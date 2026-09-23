import asyncio
import logging

from app.chain import ChainReader
from app.store import EventStore

log = logging.getLogger(__name__)


class Indexer:
    """Copies confirmed chain events into the store, one block range at a time."""

    def __init__(
        self,
        reader: ChainReader,
        store: EventStore,
        start_block: int,
        confirmations: int = 3,
        batch_size: int = 2000,
    ) -> None:
        self.reader = reader
        self.store = store
        self.start_block = start_block
        self.confirmations = confirmations
        self.batch_size = batch_size

    def run_once(self) -> int | None:
        """Indexes every confirmed block after the cursor and returns the last indexed block."""
        last_block = self.store.last_block()
        first_block = self.start_block if last_block is None else last_block + 1
        # The newest blocks can still be reorganized, so they wait for the next run.
        safe_head = self.reader.latest_block() - self.confirmations

        for start in range(first_block, safe_head + 1, self.batch_size):
            end = min(start + self.batch_size - 1, safe_head)
            events = self.reader.get_events(start, end)
            self.store.save(events, end)
            last_block = end
            if events:
                log.info("Indexed %d events from blocks %d-%d", len(events), start, end)
        return last_block

    async def run_forever(self, interval: float) -> None:
        while True:
            try:
                await asyncio.to_thread(self.run_once)
            except Exception:
                log.exception("Indexing failed, retrying in %s seconds", interval)
            await asyncio.sleep(interval)
