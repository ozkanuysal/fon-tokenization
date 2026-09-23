.PHONY: build test fmt abi

build:
	cd contracts && forge build
	cd web && pnpm build

test:
	cd contracts && forge test
	cd backend && uv run pytest

fmt:
	cd contracts && forge fmt
	cd backend && uv run ruff format .

abi:
	cd contracts && forge build
	python3 scripts/export_abi.py
