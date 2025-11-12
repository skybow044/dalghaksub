"""Interactive helper to create or authorise Pyrogram sessions."""
from __future__ import annotations

import asyncio
from getpass import getpass

from pyrogram import errors

from app.config import AppSettings, setup_logging
from app.session_manager import SessionManager


async def main() -> None:
    settings = AppSettings()
    setup_logging(settings)

    session_name = input("Session name [default]: ").strip() or "default"
    phone_number = input("Phone number with country code (e.g. +15551234567): ").strip()

    manager = SessionManager(settings.api_id, settings.api_hash, settings.session_dir)
    info = await manager.init_session(session_name)
    if info.is_authorized:
        print(f"Session '{session_name}' is already authorised.")
        await manager.close_all()
        return

    if not phone_number:
        raise SystemExit("A phone number is required to complete login.")

    await manager.authorize(session_name, phone_number)
    code = input("Enter the login code you received: ").strip()

    try:
        info = await manager.complete_login(session_name, phone_number, code)
    except errors.SessionPasswordNeeded:
        password = getpass("Two-factor password: ")
        info = await manager.complete_login(session_name, phone_number, code, password=password)
    finally:
        await manager.close_all()

    if info.is_authorized:
        print(f"Session '{session_name}' authorised successfully.")
    else:
        print("Login incomplete. Please retry.")


if __name__ == "__main__":
    asyncio.run(main())
