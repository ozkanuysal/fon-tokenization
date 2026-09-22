.PHONY: build test fmt

build:
	cd contracts && forge build
	cd web && pnpm build

test:
	cd contracts && forge test
	cd backend && uv run pytest

fmt:
	cd contracts && forge fmt
	cd backend && uv run ruff format .
