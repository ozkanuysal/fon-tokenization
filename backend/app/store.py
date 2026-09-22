import sqlite3

from app.chain import ChainEvent


class EventStore:
    def __init__(self, path: str) -> None:
        self.conn = sqlite3.connect(path, check_same_thread=False)
        # TODO: create tables

    def save(self, events: list[ChainEvent]) -> None:
        raise NotImplementedError

    def last_block(self) -> int | None:
        raise NotImplementedError

    def set_last_block(self, block: int) -> None:
        raise NotImplementedError

    def nav_history(self) -> list[dict]:
        raise NotImplementedError

    def transactions(self, investor: str | None = None, limit: int = 50) -> list[dict]:
        raise NotImplementedError
