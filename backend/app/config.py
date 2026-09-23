from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    rpc_url: str = "http://localhost:8545"
    fund_address: str = ""
    registry_address: str = ""
    start_block: int = 0
    db_path: str = "indexer.db"
    poll_interval: float = 12.0
    confirmations: int = 3
    batch_size: int = 2000
    cors_origins: list[str] = ["http://localhost:5173"]
