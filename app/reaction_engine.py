"""Automated reaction handling for Telegram channels."""
from __future__ import annotations

from typing import Iterable, Optional, Set

import logging

from pyrogram import Client
from pyrogram.handlers import MessageHandler
from pyrogram.types import Message

log = logging.getLogger(__name__)


class ReactionEngine:
    """React to messages in the configured channels."""

    def __init__(self, client: Client, default_reactions: Iterable[str]):
        self.client = client
        self.default_reactions = list(default_reactions)
        self._handler: Optional[MessageHandler] = None
        self._channels: Set[int] = set()

    async def start(self, channel_ids: Iterable[int]) -> None:
        """Start reacting to messages in the supplied channels."""

        self._channels = set(channel_ids)

        async def _on_message(client: Client, message: Message) -> None:
            if message.chat and message.chat.id in self._channels:
                for emoji in self.default_reactions:
                    try:
                        await message.react(emoji)
                        log.info("Reacted to message %s in %s with %s", message.id, message.chat.id, emoji)
                    except Exception:  # pragma: no cover - Pyrogram specific
                        log.exception("Failed to react to %s with %s", message.id, emoji)

        self._handler = MessageHandler(_on_message)
        await self.client.start()
        self.client.add_handler(self._handler)
        log.info("Reaction engine started for channels %s", self._channels)

    async def stop(self) -> None:
        """Stop reacting and remove handlers."""

        if self._handler:
            self.client.remove_handler(self._handler)
            self._handler = None
        await self.client.stop()
        self._channels.clear()
        log.info("Reaction engine stopped")
