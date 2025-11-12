"""High-level orchestration for Telegram automation workflows."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

import logging

from .config import AppSettings
from .channel_manager import ChannelManager
from .reaction_engine import ReactionEngine
from .session_manager import SessionManager

log = logging.getLogger(__name__)


@dataclass(slots=True)
class ProgressUpdate:
    stage: str
    message: str


class Orchestrator:
    """Coordinates sessions, channel operations, and reactions."""

    def __init__(self, settings: AppSettings):
        self.settings = settings
        self.session_manager = SessionManager(
            settings.api_id, settings.api_hash, settings.session_dir
        )

    async def prepare_account(self, session_name: str) -> ProgressUpdate:
        """Ensure the session exists and report authorisation status."""

        info = await self.session_manager.init_session(session_name)
        return ProgressUpdate(stage="session", message=f"{session_name}: authorised={info.is_authorized}")

    async def perform_channel_ops(
        self, session_name: str, to_leave: Iterable[int], to_join: Iterable[str]
    ) -> List[ProgressUpdate]:
        """Join and leave channels, returning status updates."""

        client = await self.session_manager.get_client(session_name)
        manager = ChannelManager(client)
        updates: List[ProgressUpdate] = []

        to_leave_list = list(to_leave)
        if to_leave_list:
            await manager.leave_channels(to_leave_list)
            updates.append(
                ProgressUpdate("leave", f"Left {len(to_leave_list)} channels")
            )

        to_join_list = list(to_join)
        if to_join_list:
            await manager.join_channels(to_join_list)
            updates.append(
                ProgressUpdate("join", f"Joined {len(to_join_list)} channels")
            )

        if not updates:
            updates.append(ProgressUpdate("noop", "No channel operations requested"))

        return updates

    async def start_reactions(
        self, session_name: str, channels: Iterable[int], emojis: Iterable[str]
    ) -> ProgressUpdate:
        """Start reacting to messages in the supplied channels."""

        client = await self.session_manager.get_client(session_name)
        engine = ReactionEngine(client, emojis)
        channel_list = list(channels)
        emoji_list = list(emojis)
        await engine.start(channel_list)
        return ProgressUpdate(
            "react", f"Reacting on {len(channel_list)} channels with {emoji_list}"
        )

    async def list_channels(self, session_name: str):
        """Return the chats the account is currently part of."""

        client = await self.session_manager.get_client(session_name)
        manager = ChannelManager(client)
        return await manager.list_joined_channels()
