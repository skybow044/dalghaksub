"""Channel operations including list, join, and leave actions."""
from __future__ import annotations

from typing import Iterable, List, Sequence

import logging

from pyrogram import Client
from pyrogram.types import Chat

log = logging.getLogger(__name__)


class ChannelManager:
    """Expose channel management helpers for a Pyrogram client."""

    def __init__(self, client: Client):
        self.client = client

    async def list_joined_channels(self) -> List[Chat]:
        """Return chats the user is part of that are channels or supergroups."""

        chats: List[Chat] = []
        async for dialog in self.client.get_dialogs():
            chat = dialog.chat
            if chat.type in {"channel", "supergroup"}:
                chats.append(chat)
        log.debug("Fetched %d channels", len(chats))
        return chats

    async def leave_channels(self, channel_ids: Sequence[int]) -> None:
        """Leave the channels specified by ID."""

        for channel_id in channel_ids:
            try:
                await self.client.leave_chat(channel_id)
                log.info("Left channel %s", channel_id)
            except Exception as exc:  # pragma: no cover - Pyrogram specific
                log.exception("Failed to leave channel %s: %s", channel_id, exc)

    async def join_channels(self, invite_links: Iterable[str]) -> None:
        """Join channels using invite links or public usernames."""

        for link in invite_links:
            try:
                await self.client.join_chat(link)
                log.info("Joined channel %s", link)
            except Exception as exc:  # pragma: no cover - Pyrogram specific
                log.exception("Failed to join %s: %s", link, exc)
