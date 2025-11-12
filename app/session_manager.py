"""Management of Pyrogram sessions for multiple accounts."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

import logging

from pyrogram import Client, errors

log = logging.getLogger(__name__)


@dataclass(slots=True)
class SessionInfo:
    """Lightweight description of a Pyrogram session."""

    name: str
    phone_number: str | None = None
    is_authorized: bool = False


class SessionManager:
    """Create and track Pyrogram sessions for multiple accounts."""

    def __init__(self, api_id: int, api_hash: str, session_dir: Path):
        self.api_id = api_id
        self.api_hash = api_hash
        self.session_dir = session_dir
        self.session_dir.mkdir(parents=True, exist_ok=True)
        self._clients: Dict[str, Client] = {}

    async def init_session(self, name: str) -> SessionInfo:
        """Initialise a session and return authorisation status."""

        log.debug("Initialising session %s", name)
        client = Client(name, api_id=self.api_id, api_hash=self.api_hash, workdir=str(self.session_dir))
        await client.connect()
        authorized = await client.is_authorized()
        self._clients[name] = client
        log.info("Session %s authorised=%s", name, authorized)
        return SessionInfo(name=name, is_authorized=authorized)

    async def authorize(self, name: str, phone_number: str) -> None:
        """Send login code to the provided phone number for the session."""

        client = self._require_client(name)
        await client.send_code(phone_number)
        log.info("Sent login code to %s for session %s", phone_number, name)

    async def complete_login(
        self, name: str, phone_number: str, code: str, password: Optional[str] = None
    ) -> SessionInfo:
        """Complete login with a received code (and optional 2FA password)."""

        client = self._require_client(name)
        try:
            await client.sign_in(phone_number, code, password=password)
        except errors.SessionPasswordNeeded as exc:
            log.warning("Two-factor authentication required for session %s", name)
            raise exc
        except errors.PhoneCodeInvalid as exc:
            log.error("Invalid verification code supplied for session %s", name)
            raise exc

        log.info("Session %s logged in successfully", name)
        return SessionInfo(name=name, phone_number=phone_number, is_authorized=True)

    async def get_client(self, name: str) -> Client:
        """Return the underlying Pyrogram client for a session."""

        return self._require_client(name)

    async def close_all(self) -> None:
        """Disconnect all managed clients."""

        await asyncio.gather(*(client.disconnect() for client in self._clients.values()))
        closed = len(self._clients)
        self._clients.clear()
        log.debug("Closed %d sessions", closed)

    def _require_client(self, name: str) -> Client:
        try:
            return self._clients[name]
        except KeyError as exc:
            raise RuntimeError(f"Session '{name}' has not been initialised") from exc
