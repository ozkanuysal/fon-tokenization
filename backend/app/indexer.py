import asyncio
import logging

from app.chain import ChainReader
from app.store import EventStore

log = logging.getLogger(__name__)


class Indexer:
    def __init__(
        self, reader: ChainReader, store: EventStore, start_block: int, confirmations: int = 3
    ) -> None:
        self.reader = reader
        self.store = store
        self.start_block = start_block
        self.confirmations = confirmations

    def run_once(self) -> int:
        """Indexes new blocks and returns the last processed block."""
        raise NotImplementedError

    async def run_forever(self, interval: float) -> None:
        while True:
            # TODO: run_once + error logging
            await asyncio.sleep(interval)
