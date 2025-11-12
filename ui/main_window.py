"""PySide6 desktop shell for the Telegram management tool."""
from __future__ import annotations

import asyncio
from functools import partial
from typing import Iterable, List

from PySide6.QtCore import Qt, QRunnable, QThreadPool, Slot
from PySide6.QtWidgets import (
    QApplication,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QPushButton,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from app.config import AppSettings, setup_logging
from app.orchestrator import Orchestrator, ProgressUpdate


class AsyncTask(QRunnable):
    """Run a coroutine in a dedicated event loop within a worker thread."""

    def __init__(self, coro, callback=None):
        super().__init__()
        self.coro = coro
        self.callback = callback

    @Slot()
    def run(self) -> None:  # pragma: no cover - Qt thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(self.coro)
        finally:
            loop.close()
        if self.callback:
            self.callback(result)


class MainWindow(QWidget):
    def __init__(self, orchestrator: Orchestrator):
        super().__init__()
        self.orchestrator = orchestrator
        self.pool = QThreadPool.globalInstance()

        self.status = QTextEdit()
        self.status.setReadOnly(True)

        self.channel_list = QListWidget()
        self.leave_button = QPushButton("Leave Selected Channels")
        self.join_input = QLineEdit()
        self.join_input.setPlaceholderText("channel_username or invite link, comma separated")
        self.join_button = QPushButton("Join Channels")
        self.react_button = QPushButton("Start Reactions")

        layout = QVBoxLayout()
        layout.addWidget(QLabel("Joined Channels"))
        layout.addWidget(self.channel_list)
        layout.addWidget(self.leave_button)
        layout.addWidget(QLabel("Channels to Join"))
        layout.addWidget(self.join_input)
        layout.addWidget(self.join_button)
        layout.addWidget(self.react_button)
        layout.addWidget(QLabel("Status"))
        layout.addWidget(self.status)
        self.setLayout(layout)

        self.leave_button.clicked.connect(self.leave_channels)
        self.join_button.clicked.connect(self.join_channels)
        self.react_button.clicked.connect(self.start_reactions)

        self.setWindowTitle("Telegram Manager")
        self.resize(600, 400)

        self.bootstrap_session()

    def log_status(self, update) -> None:
        if isinstance(update, ProgressUpdate):
            self.status.append(f"[{update.stage}] {update.message}")
        else:
            self.status.append(str(update))

    def run_async(self, coro, callback=None) -> None:
        self.pool.start(AsyncTask(coro, callback))

    def bootstrap_session(self, session_name: str = "default") -> None:
        self.run_async(
            self.orchestrator.prepare_account(session_name),
            lambda update: self.on_session_ready(session_name, update),
        )

    def on_session_ready(self, session_name: str, update) -> None:
        self.log_status(update)
        self.refresh_channels(session_name)

    def refresh_channels(self, session_name: str = "default") -> None:
        self.run_async(
            self.orchestrator.list_channels(session_name),
            lambda chats: self.populate_channels(chats),
        )

    def populate_channels(self, chats: Iterable) -> None:
        self.channel_list.clear()
        for chat in chats:
            item = QListWidgetItem(chat.title or chat.username or str(chat.id))
            item.setData(Qt.UserRole, chat.id)
            self.channel_list.addItem(item)
        if not self.channel_list.count():
            self.status.append("[channels] No channels available. Join or refresh later.")

    def leave_channels(self) -> None:
        selected_ids = [int(item.data(Qt.UserRole)) for item in self.channel_list.selectedItems()]
        self.run_async(
            self.orchestrator.perform_channel_ops("default", selected_ids, []),
            lambda updates: self._after_channel_ops("default", updates),
        )

    def join_channels(self) -> None:
        links = [link.strip() for link in self.join_input.text().split(",") if link.strip()]
        self.run_async(
            self.orchestrator.perform_channel_ops("default", [], links),
            lambda updates: self._after_channel_ops("default", updates),
        )

    def start_reactions(self) -> None:
        selected_ids = [int(item.data(Qt.UserRole)) for item in self.channel_list.selectedItems()]
        emojis = ["👍", "🔥"]
        self.run_async(
            self.orchestrator.start_reactions("default", selected_ids, emojis),
            self.log_status,
        )

    def _after_channel_ops(self, session_name: str, updates: List[ProgressUpdate]) -> None:
        for update in updates:
            self.log_status(update)
        self.refresh_channels(session_name)


def main() -> None:  # pragma: no cover - manual UI entry point
    settings = AppSettings()
    setup_logging(settings)
    orchestrator = Orchestrator(settings)

    app = QApplication([])
    window = MainWindow(orchestrator)
    window.show()
    app.exec()


if __name__ == "__main__":  # pragma: no cover - script execution
    main()
