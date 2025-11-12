from pathlib import Path

from app.config import AppSettings


def test_session_dir_expansion(tmp_path, monkeypatch):
    monkeypatch.setenv("API_ID", "12345")
    monkeypatch.setenv("API_HASH", "hash")
    monkeypatch.setenv("SESSION_DIR", str(tmp_path / "sessions"))

    settings = AppSettings()
    assert settings.session_dir == (tmp_path / "sessions").resolve()
