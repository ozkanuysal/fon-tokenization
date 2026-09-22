from fastapi import FastAPI

app = FastAPI(title="Fund Indexer")

# TODO: start the indexer in a lifespan handler, add CORS


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/nav-history")
def nav_history() -> list[dict]:
    # TODO
    return []


@app.get("/transactions")
def transactions(investor: str | None = None, limit: int = 50) -> list[dict]:
    # TODO
    return []
