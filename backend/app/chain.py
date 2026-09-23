import json
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from web3 import Web3
from web3.constants import ADDRESS_ZERO
from web3.contract.contract import ContractEvent
from web3.types import EventData

ABI_PATH = Path(__file__).with_name("abi.json")
FUND_EVENTS = ("Subscribed", "Redeemed", "NavUpdated", "Transfer")
REGISTRY_EVENTS = ("InvestorApproved", "InvestorRemoved")


@dataclass(frozen=True)
class ChainEvent:
    """A decoded contract event. Addresses are lowercase, integers are plain ints."""

    name: str
    block_number: int
    tx_hash: str
    log_index: int
    timestamp: int
    args: dict[str, Any]


class ChainReader(Protocol):
    def latest_block(self) -> int: ...

    def get_events(self, from_block: int, to_block: int) -> list[ChainEvent]:
        """Returns the events in the inclusive range, ordered by block and log index."""


class Web3ChainReader:
    """Reads fund and investor registry events over JSON-RPC."""

    def __init__(self, rpc_url: str, fund_address: str, registry_address: str) -> None:
        self._w3 = Web3(Web3.HTTPProvider(rpc_url))
        abis = json.loads(ABI_PATH.read_text())
        fund = self._w3.eth.contract(Web3.to_checksum_address(fund_address), abi=abis["FundToken"])
        registry = self._w3.eth.contract(
            Web3.to_checksum_address(registry_address), abi=abis["InvestorRegistry"]
        )
        self._events: list[ContractEvent] = [
            *(fund.events[name] for name in FUND_EVENTS),
            *(registry.events[name] for name in REGISTRY_EVENTS),
        ]

    def latest_block(self) -> int:
        return self._w3.eth.block_number

    def get_events(self, from_block: int, to_block: int) -> list[ChainEvent]:
        logs = sorted(
            (
                log
                for event in self._events
                for log in event.get_logs(from_block=from_block, to_block=to_block)
                if not _is_mint_or_burn(log)
            ),
            key=lambda log: (log["blockNumber"], log["logIndex"]),
        )
        blocks = {log["blockNumber"] for log in logs}
        timestamps = {number: self._w3.eth.get_block(number)["timestamp"] for number in blocks}
        return [_to_chain_event(log, timestamps[log["blockNumber"]]) for log in logs]


def _is_mint_or_burn(log: EventData) -> bool:
    # Mints and burns are already recorded as Subscribed and Redeemed.
    return log["event"] == "Transfer" and ADDRESS_ZERO in (log["args"]["from"], log["args"]["to"])


def _to_chain_event(log: EventData, timestamp: int) -> ChainEvent:
    return ChainEvent(
        name=log["event"],
        block_number=log["blockNumber"],
        tx_hash=log["transactionHash"].to_0x_hex(),
        log_index=log["logIndex"],
        timestamp=timestamp,
        args=_lowercase_addresses(log["args"]),
    )


def _lowercase_addresses(args: Mapping[str, Any]) -> dict[str, Any]:
    return {key: value.lower() if isinstance(value, str) else value for key, value in args.items()}
