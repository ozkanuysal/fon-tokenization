from app.indexer import Indexer
from app.store import EventStore
from tests.conftest import FakeChainReader, nav_updated


def indexed_blocks(store: EventStore) -> list[int]:
    return [point["block_number"] for point in store.nav_history()]


def test_waits_for_confirmations(store: EventStore, reader: FakeChainReader) -> None:
    reader.events = [nav_updated(1_010_000, block=7), nav_updated(1_020_000, block=8)]
    reader.head = 10

    last_block = Indexer(reader, store, start_block=0, confirmations=3).run_once()

    assert last_block == 7
    assert indexed_blocks(store) == [7]


def test_starts_at_start_block(store: EventStore, reader: FakeChainReader) -> None:
    reader.events = [nav_updated(1_010_000, block=4), nav_updated(1_020_000, block=5)]
    reader.head = 20

    Indexer(reader, store, start_block=5, confirmations=3).run_once()

    assert reader.ranges == [(5, 17)]
    assert indexed_blocks(store) == [5]


def test_resumes_from_the_cursor(store: EventStore, reader: FakeChainReader) -> None:
    reader.head = 13
    Indexer(reader, store, start_block=0, confirmations=3).run_once()

    reader.head = 18
    last_block = Indexer(reader, store, start_block=0, confirmations=3).run_once()

    assert reader.ranges == [(0, 10), (11, 15)]
    assert last_block == 15


def test_splits_the_range_into_batches(store: EventStore, reader: FakeChainReader) -> None:
    reader.head = 28

    last_block = Indexer(reader, store, start_block=0, confirmations=3, batch_size=10).run_once()

    assert reader.ranges == [(0, 9), (10, 19), (20, 25)]
    assert last_block == store.last_block() == 25


def test_rerun_does_not_duplicate_events(store: EventStore, reader: FakeChainReader) -> None:
    reader.events = [nav_updated(1_010_000, block=2)]
    reader.head = 10
    indexer = Indexer(reader, store, start_block=0, confirmations=3)

    indexer.run_once()
    assert indexer.run_once() == 7
    reader.head = 20
    indexer.run_once()

    assert indexed_blocks(store) == [2]


def test_returns_none_when_nothing_is_confirmed(store: EventStore, reader: FakeChainReader) -> None:
    reader.head = 2

    assert Indexer(reader, store, start_block=0, confirmations=3).run_once() is None
    assert reader.ranges == []
