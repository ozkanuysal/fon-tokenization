import logging

from app.api import create_app
from app.chain import Web3ChainReader
from app.config import Settings
from app.indexer import Indexer
from app.store import EventStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

settings = Settings()
store = EventStore(settings.db_path)
reader = Web3ChainReader(settings.rpc_url, settings.fund_address, settings.registry_address)
indexer = Indexer(
    reader,
    store,
    start_block=settings.start_block,
    confirmations=settings.confirmations,
    batch_size=settings.batch_size,
)
app = create_app(
    store,
    indexer,
    cors_origins=settings.cors_origins,
    poll_interval=settings.poll_interval,
)
