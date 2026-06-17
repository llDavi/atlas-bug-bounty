"""Lightweight SQLite persistence — no external DB service needed.

Used for Get Listed submissions. Note: on Render's free tier this disk is
ephemeral and gets wiped on every redeploy, so submissions aren't permanent —
acceptable for this low-stakes use case. (Stripe customer <-> Clerk user
mapping lives in Clerk/Stripe metadata instead of here, since losing that on
redeploy would break Pro users' billing portal access.)
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path

_DB_PATH = Path(__file__).parent.parent / "data" / "atlas.db"


@contextmanager
def get_conn():
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS program_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                program_name TEXT NOT NULL,
                platform TEXT NOT NULL,
                program_url TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
