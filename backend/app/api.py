import asyncio
from collections.abc import AsyncIterator, Sequence
from contextlib import asynccontextmanager, suppress
from typing import Annotated, Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.indexer import Indexer
from app.store import EventStore


class Health(BaseModel):
    status: str
    last_indexed_block: int | None


class NavPoint(BaseModel):
    nav: str
    block_number: int
    tx_hash: str
    timestamp: int


class Transaction(BaseModel):
    type: Literal["subscribe", "redeem", "transfer"]
    investor: str
    counterparty: str | None
    assets: str | None
    shares: str | None
    price: str | None
    block_number: int
    tx_hash: str
    timestamp: int


def create_app(
    store: EventStore,
    indexer: Indexer | None = None,
    cors_origins: Sequence[str] = (),
    poll_interval: float = 12.0,
) -> FastAPI:
    """Builds the history API. If an indexer is given, it runs in the background."""

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        task = asyncio.create_task(indexer.run_forever(poll_interval)) if indexer else None
        yield
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task

    app = FastAPI(title="Fund Indexer", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_methods=["GET"])

    @app.get("/", include_in_schema=False)
    def root() -> RedirectResponse:
        return RedirectResponse("/docs")

    @app.get("/health")
    def health() -> Health:
        return Health(status="ok", last_indexed_block=store.last_block())

    @app.get("/nav-history")
    def nav_history() -> list[NavPoint]:
        return [NavPoint.model_validate(point) for point in store.nav_history()]

    @app.get("/transactions")
    def transactions(
        investor: str | None = None,
        limit: Annotated[int, Query(ge=1, le=200)] = 50,
    ) -> list[Transaction]:
        return [Transaction.model_validate(row) for row in store.transactions(investor, limit)]

    return app
