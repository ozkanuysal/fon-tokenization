import sqlite3
from collections.abc import Iterable, Iterator
from contextlib import contextmanager
from typing import Any

from app.chain import ChainEvent

SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    tx_hash      TEXT    NOT NULL,
    log_index    INTEGER NOT NULL,
    block_number INTEGER NOT NULL,
    timestamp    INTEGER NOT NULL,
    name         TEXT    NOT NULL,
    investor     TEXT,
    counterparty TEXT,
    assets       TEXT,
    shares       TEXT,
    price        TEXT,
    PRIMARY KEY (tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS cursor (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    last_block INTEGER NOT NULL
);
"""

_TRADE_COLUMNS = {"investor": "investor", "assets": "assets", "shares": "shares", "price": "price"}

# Column -> event argument, per event. Columns not listed stay NULL.
COLUMN_ARGS: dict[str, dict[str, str]] = {
    "Subscribed": _TRADE_COLUMNS,
    "Redeemed": _TRADE_COLUMNS,
    "NavUpdated": {"price": "newNav"},
    "Transfer": {"investor": "from", "counterparty": "to", "shares": "value"},
    "InvestorApproved": {"investor": "investor"},
    "InvestorRemoved": {"investor": "investor"},
}

TRANSACTION_TYPES = {"Subscribed": "subscribe", "Redeemed": "redeem", "Transfer": "transfer"}


class EventStore:
    """SQLite store for indexed events and the indexer cursor."""

    def __init__(self, path: str) -> None:
        self.path = path
        with self._connect() as conn:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.executescript(SCHEMA)

    def save(self, events: Iterable[ChainEvent], last_block: int) -> None:
        """Stores new events and moves the cursor to last_block in one transaction."""
        with self._connect() as conn:
            conn.executemany(
                """
                INSERT OR IGNORE INTO events (
                    tx_hash, log_index, block_number, timestamp, name,
                    investor, counterparty, assets, shares, price
                ) VALUES (
                    :tx_hash, :log_index, :block_number, :timestamp, :name,
                    :investor, :counterparty, :assets, :shares, :price
                )
                """,
                map(_to_row, events),
            )
            conn.execute(
                """
                INSERT INTO cursor (id, last_block) VALUES (1, ?)
                ON CONFLICT (id) DO UPDATE SET last_block = excluded.last_block
                """,
                (last_block,),
            )

    def last_block(self) -> int | None:
        with self._connect() as conn:
            row = conn.execute("SELECT last_block FROM cursor").fetchone()
        return row["last_block"] if row else None

    def nav_history(self) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT price AS nav, block_number, tx_hash, timestamp
                FROM events
                WHERE name = 'NavUpdated'
                ORDER BY block_number, log_index
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def transactions(self, investor: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        """Returns subscriptions, redemptions and transfers, newest first.

        With an investor, only rows where that address is the investor or the counterparty.
        """
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT name, investor, counterparty, assets, shares, price,
                       block_number, tx_hash, timestamp
                FROM events
                WHERE name IN ('Subscribed', 'Redeemed', 'Transfer')
                  AND (:investor IS NULL OR investor = :investor OR counterparty = :investor)
                ORDER BY block_number DESC, log_index DESC
                LIMIT :limit
                """,
                {"investor": investor.lower() if investor else None, "limit": limit},
            ).fetchall()
        return [_to_transaction(row) for row in rows]

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        # A connection per operation, so the indexer thread and API handlers never share one.
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()


def _to_row(event: ChainEvent) -> dict[str, Any]:
    row: dict[str, Any] = {
        "tx_hash": event.tx_hash,
        "log_index": event.log_index,
        "block_number": event.block_number,
        "timestamp": event.timestamp,
        "name": event.name,
        "investor": None,
        "counterparty": None,
        "assets": None,
        "shares": None,
        "price": None,
    }
    for column, arg in COLUMN_ARGS[event.name].items():
        # uint256 values overflow SQLite integers, so every value is kept as text.
        row[column] = str(event.args[arg])
    return row


def _to_transaction(row: sqlite3.Row) -> dict[str, Any]:
    transaction = dict(row)
    transaction["type"] = TRANSACTION_TYPES[transaction.pop("name")]
    return transaction
