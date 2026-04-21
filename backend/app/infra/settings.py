from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "orcid-pubmetrics"
    log_level: str = "INFO"

    openalex_mailto: str

    journal_metrics_provider: Literal["sjr", "jcr"] = "sjr"
    sjr_data_dir: str = "./data/sjr"

    jcr_api_key: str = ""
    jcr_api_base: str = "https://api.clarivate.com/apis/wos-journal/v1"

    editorial_boards_provider: Literal["open_editors", "manual", "composite"] = "open_editors"
    open_editors_data_path: str = "./data/open_editors/dataset.csv"

    database_url: str = "sqlite:///./data/app.db"


settings = Settings()  # type: ignore[call-arg]
