# Telegram Manager

A modular desktop application for managing Telegram channels using Pyrogram.

## Features
- Multi-account session management
- Channel listing, joining, and leaving
- Automated reactions with configurable emoji
- PySide6 desktop UI with async task orchestration

## Prerequisites
- Python 3.10 or newer
- A Telegram API ID and hash from <https://my.telegram.org/apps>

## Installation
1. **Clone the repository** (or download the source) and open a terminal inside the project directory.
2. **Create and activate a virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```
3. **Install the project in editable mode** (installs Pyrogram, PySide6, etc.):
   ```bash
   pip install -e .
   ```
4. **Create a `.env` file** (or export environment variables) with your Telegram API credentials:
   ```env
   API_ID=12345
   API_HASH=your_api_hash
   ```

## First-time session login
Pyrogram needs to authenticate at least one Telegram account before the UI can list channels.

1. Ensure your virtual environment is active and run the helper script:
   ```bash
   python scripts/bootstrap_session.py
   ```
2. Follow the prompts to enter a session name (press Enter to use `default`), your phone number, and the login code sent by Telegram. If your account uses two-factor authentication, you will also be asked for the password.
3. The script stores the session file in the `sessions/` directory. Once authorised, you can reuse the same session name in the desktop app.

## Running the desktop app
Launch the UI after at least one session has been authorised:
```bash
python -m ui.main_window
```

The window automatically initialises the `default` session, downloads the current list of channels, and displays status updates in the log pane. Use the buttons to leave or join channels and to start the auto-reaction worker.

## Testing
Unit tests live in the `tests/` directory and can be executed with:
```bash
pytest
```
Dependencies such as `pydantic` must be installed beforehand (see Installation above).
