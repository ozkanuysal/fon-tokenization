from typing import Any

from app.store import EventStore
from tests.conftest import ALICE, BOB, CAROL, make_event, nav_updated, subscribed, transfer


def blocks(rows: list[dict[str, Any]]) -> list[int]:
    return [row["block_number"] for row in rows]


def test_save_ignores_events_already_stored(store: EventStore) -> None:
    event = subscribed(ALICE, block=1)

    store.save([event], last_block=1)
    store.save([event, event], last_block=2)

    assert len(store.transactions()) == 1


def test_cursor_is_the_last_saved_block(store: EventStore) -> None:
    assert store.last_block() is None

    store.save([], last_block=10)
    store.save([], last_block=20)

    assert store.last_block() == 20


def test_nav_history_is_oldest_first(store: EventStore) -> None:
    first = nav_updated(1_050_000, block=3)
    second = nav_updated(1_100_000, block=7)

    store.save([second, first], last_block=7)

    assert store.nav_history() == [
        {
            "nav": "1050000",
            "block_number": 3,
            "tx_hash": first.tx_hash,
            "timestamp": first.timestamp,
        },
        {
            "nav": "1100000",
            "block_number": 7,
            "tx_hash": second.tx_hash,
            "timestamp": second.timestamp,
        },
    ]


def test_transactions_map_event_arguments(store: EventStore) -> None:
    buy = make_event(
        "Subscribed",
        1,
        {"investor": ALICE, "assets": 100_000_000, "shares": 100 * 10**18, "price": 1_000_000},
    )
    move = make_event("Transfer", 2, {"from": ALICE, "to": BOB, "value": 40 * 10**18})
    sell = make_event(
        "Redeemed",
        3,
        {"investor": BOB, "shares": 40 * 10**18, "assets": 44_000_000, "price": 1_100_000},
    )

    store.save([buy, move, sell], last_block=3)

    assert store.transactions() == [
        {
            "type": "redeem",
            "investor": BOB,
            "counterparty": None,
            "assets": "44000000",
            "shares": "40000000000000000000",
            "price": "1100000",
            "block_number": 3,
            "tx_hash": sell.tx_hash,
            "timestamp": sell.timestamp,
        },
        {
            "type": "transfer",
            "investor": ALICE,
            "counterparty": BOB,
            "assets": None,
            "shares": "40000000000000000000",
            "price": None,
            "block_number": 2,
            "tx_hash": move.tx_hash,
            "timestamp": move.timestamp,
        },
        {
            "type": "subscribe",
            "investor": ALICE,
            "counterparty": None,
            "assets": "100000000",
            "shares": "100000000000000000000",
            "price": "1000000",
            "block_number": 1,
            "tx_hash": buy.tx_hash,
            "timestamp": buy.timestamp,
        },
    ]


def test_transactions_are_newest_first(store: EventStore) -> None:
    store.save(
        [
            subscribed(ALICE, block=1),
            subscribed(BOB, block=2, log_index=0),
            transfer(BOB, CAROL, block=2, log_index=1),
        ],
        last_block=2,
    )

    assert [(tx["block_number"], tx["type"]) for tx in store.transactions()] == [
        (2, "transfer"),
        (2, "subscribe"),
        (1, "subscribe"),
    ]


def test_transactions_leave_out_nav_and_registry_events(store: EventStore) -> None:
    store.save(
        [
            make_event("InvestorApproved", 1, {"investor": ALICE}),
            subscribed(ALICE, block=2),
            nav_updated(1_100_000, block=3),
            make_event("InvestorRemoved", 4, {"investor": ALICE}),
        ],
        last_block=4,
    )

    assert [tx["type"] for tx in store.transactions()] == ["subscribe"]


def test_transactions_filter_matches_investor_or_counterparty(store: EventStore) -> None:
    store.save(
        [subscribed(ALICE, block=1), subscribed(BOB, block=2), transfer(ALICE, CAROL, block=3)],
        last_block=3,
    )

    assert blocks(store.transactions(investor=ALICE)) == [3, 1]
    assert blocks(store.transactions(investor=CAROL)) == [3]


def test_transactions_filter_ignores_address_case(store: EventStore) -> None:
    store.save([subscribed(ALICE, block=1), transfer(BOB, ALICE, block=2)], last_block=2)

    checksummed = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    assert blocks(store.transactions(investor=checksummed)) == [2, 1]


def test_transactions_limit_keeps_the_newest(store: EventStore) -> None:
    store.save([subscribed(ALICE, block=n) for n in range(1, 6)], last_block=5)

    assert blocks(store.transactions(limit=2)) == [5, 4]


def test_uint256_values_round_trip_as_strings(store: EventStore) -> None:
    value = 2**256 - 1
    store.save([make_event("Transfer", 1, {"from": ALICE, "to": BOB, "value": value})], 1)

    assert store.transactions()[0]["shares"] == str(value)
