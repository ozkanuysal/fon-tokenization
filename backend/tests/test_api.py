import pytest
from fastapi.testclient import TestClient

from app.api import create_app
from app.store import EventStore
from tests.conftest import ALICE, BOB, CAROL, nav_updated, subscribed, transfer


@pytest.fixture
def client(store: EventStore) -> TestClient:
    return TestClient(create_app(store))


def test_health_reports_the_last_indexed_block(client: TestClient, store: EventStore) -> None:
    assert client.get("/health").json() == {"status": "ok", "last_indexed_block": None}

    store.save([], last_block=42)

    assert client.get("/health").json() == {"status": "ok", "last_indexed_block": 42}


def test_nav_history(client: TestClient, store: EventStore) -> None:
    update = nav_updated(1_100_000, block=5)
    store.save([update], last_block=5)

    response = client.get("/nav-history")

    assert response.status_code == 200
    assert response.json() == [
        {
            "nav": "1100000",
            "block_number": 5,
            "tx_hash": update.tx_hash,
            "timestamp": update.timestamp,
        }
    ]


def test_transactions_of_an_investor(client: TestClient, store: EventStore) -> None:
    move = transfer(ALICE, BOB, block=2)
    store.save([subscribed(ALICE, block=1), move, subscribed(CAROL, block=3)], last_block=3)

    response = client.get("/transactions", params={"investor": BOB})

    assert response.status_code == 200
    assert response.json() == [
        {
            "type": "transfer",
            "investor": ALICE,
            "counterparty": BOB,
            "assets": None,
            "shares": "1000000000000000000",
            "price": None,
            "block_number": 2,
            "tx_hash": move.tx_hash,
            "timestamp": move.timestamp,
        }
    ]


def test_transactions_limit(client: TestClient, store: EventStore) -> None:
    store.save([subscribed(ALICE, block=n) for n in range(1, 4)], last_block=3)

    response = client.get("/transactions", params={"limit": 2})

    assert [tx["block_number"] for tx in response.json()] == [3, 2]


@pytest.mark.parametrize("limit", [0, 201])
def test_transactions_rejects_limit_out_of_range(client: TestClient, limit: int) -> None:
    assert client.get("/transactions", params={"limit": limit}).status_code == 422
