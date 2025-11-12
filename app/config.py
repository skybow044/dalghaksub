"""Application configuration and logging setup."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import logging
import logging.config

from pydantic import BaseSettings, Field, validator
import yaml


class AppSettings(BaseSettings):
    """Container for configuration values.

    Settings can be provided via environment variables or an optional ``.env`` file.
    ``session_dir`` is expanded to an absolute path to ensure Pyrogram can persist
    session files in a predictable location.
    """

    api_id: int = Field(..., description="Telegram API ID")
    api_hash: str = Field(..., description="Telegram API hash")
    session_dir: Path = Field(default=Path("./sessions"))
    log_config: Path | None = Field(default=None)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("session_dir", pre=True)
    def _expand_session_dir(cls, value: Any) -> Path:
        """Expand user and resolve to absolute path."""

        if isinstance(value, Path):
            path = value
        else:
            path = Path(str(value))
        return path.expanduser().resolve()


def setup_logging(settings: AppSettings) -> None:
    """Configure logging for the application.

    If ``settings.log_config`` is provided and points to an existing YAML file the
    configuration is loaded from there. Otherwise a sensible default configuration is
    applied that logs to stdout.
    """

    if settings.log_config and settings.log_config.exists():
        with settings.log_config.open("r", encoding="utf-8") as handle:
            logging.config.dictConfig(yaml.safe_load(handle))
    else:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        )
