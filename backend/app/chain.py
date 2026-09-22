from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class ChainEvent:
    name: str
    block_number: int
    tx_hash: str
    log_index: int
    args: dict = field(default_factory=dict)


class ChainReader(Protocol):
    def latest_block(self) -> int: ...

    def get_events(self, from_block: int, to_block: int) -> list[ChainEvent]: ...


class Web3ChainReader:
    """Reads fund events from a JSON-RPC node."""

    def __init__(self, rpc_url: str, addresses: dict[str, str]) -> None:
        # TODO: web3 client + contract objects
        self.rpc_url = rpc_url
        self.addresses = addresses

    def latest_block(self) -> int:
        raise NotImplementedError

    def get_events(self, from_block: int, to_block: int) -> list[ChainEvent]:
        raise NotImplementedError
