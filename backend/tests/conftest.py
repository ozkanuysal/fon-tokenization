from pathlib import Path
from typing import Any

import pytest

from app.chain import ChainEvent
from app.store import EventStore

ALICE = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
BOB = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"
CAROL = "0x90f79bf6eb2c4f870365e785982e1f101e93b906"


class FakeChainReader:
    """In-memory chain: tests set `events` and `head`, then inspect the requested `ranges`."""

    def __init__(self) -> None:
        self.events: list[ChainEvent] = []
        self.head = 0
        self.ranges: list[tuple[int, int]] = []

    def latest_block(self) -> int:
        return self.head

    def get_events(self, from_block: int, to_block: int) -> list[ChainEvent]:
        self.ranges.append((from_block, to_block))
        return [event for event in self.events if from_block <= event.block_number <= to_block]


def make_event(name: str, block: int, args: dict[str, Any], log_index: int = 0) -> ChainEvent:
    return ChainEvent(
        name=name,
        block_number=block,
        tx_hash=f"0x{block:064x}",
        log_index=log_index,
        timestamp=1_750_000_000 + 12 * block,
        args=args,
    )


def subscribed(investor: str, block: int, log_index: int = 0) -> ChainEvent:
    args = {"investor": investor, "assets": 100_000_000, "shares": 100 * 10**18, "price": 1_000_000}
    return make_event("Subscribed", block, args, log_index)


def transfer(sender: str, receiver: str, block: int, log_index: int = 0) -> ChainEvent:
    args = {"from": sender, "to": receiver, "value": 10**18}
    return make_event("Transfer", block, args, log_index)


def nav_updated(nav: int, block: int) -> ChainEvent:
    return make_event("NavUpdated", block, {"oldNav": 1_000_000, "newNav": nav})


@pytest.fixture
def store(tmp_path: Path) -> EventStore:
    return EventStore(str(tmp_path / "events.db"))


@pytest.fixture
def reader() -> FakeChainReader:
    return FakeChainReader()
