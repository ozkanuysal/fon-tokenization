.PHONY: build test fmt abi up deploy-sepolia

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

# whole stack locally: anvil + contracts + backend + web on http://localhost:5173
up:
	docker compose up --build

# needs contracts/.env, see contracts/.env.example
deploy-sepolia:
	cd contracts && forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
