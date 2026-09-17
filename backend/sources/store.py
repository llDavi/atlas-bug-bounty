"""Durable storage for hunters and their progress.

Postgres (Neon) when DATABASE_URL is set; otherwise the local SQLite file, for
development only. Unlike db.py's program_submissions, this data must survive
redeploys — Render's free disk is wiped on every deploy, so production must
always run with DATABASE_URL.

Every statement here is written to run unchanged on both SQLite and Postgres:
plain TEXT/INTEGER columns, ISO timestamps generated in Python, and
INSERT ... ON CONFLICT DO NOTHING for idempotent writes.
"""

from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine, text

from .config import DATABASE_URL


def _url() -> str:
    url = DATABASE_URL.strip()
    if not url:
        path = Path(__file__).parent.parent / "data" / "atlas.db"
        path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{path}"
    # Neon hands out postgres:// or postgresql:// URLs; SQLAlchemy needs to be
    # told to use the psycopg 3 driver.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


_URL = _url()
_IS_SQLITE = _URL.startswith("sqlite")

_engine = create_engine(
    _URL,
    # FastAPI runs sync endpoints on a thread pool; SQLite refuses to share a
    # connection across threads unless told it may.
    connect_args={"check_same_thread": False} if _IS_SQLITE else {},
    # Neon closes idle connections; check before use and recycle often.
    pool_pre_ping=True,
    pool_recycle=300,
)

_SCHEMA = (
    """CREATE TABLE IF NOT EXISTS hunters (
        clerk_id      TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        alignment     TEXT NOT NULL,
        oath_sworn_at TEXT NOT NULL,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS hunter_kingdoms (
        clerk_id  TEXT NOT NULL,
        kingdom   TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        PRIMARY KEY (clerk_id, kingdom)
    )""",
    # Only correct answers are recorded: wrong ones can be retried without
    # limit or penalty, so there is nothing to keep about them.
    """CREATE TABLE IF NOT EXISTS quest_answers (
        clerk_id    TEXT NOT NULL,
        quest_slug  TEXT NOT NULL,
        question_id TEXT NOT NULL,
        answered_at TEXT NOT NULL,
        PRIMARY KEY (clerk_id, quest_slug, question_id)
    )""",
    """CREATE TABLE IF NOT EXISTS quest_completions (
        clerk_id     TEXT NOT NULL,
        quest_slug   TEXT NOT NULL,
        kingdom      TEXT NOT NULL,
        xp           INTEGER NOT NULL,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (clerk_id, quest_slug)
    )""",
    "CREATE INDEX IF NOT EXISTS ix_quest_completions_kingdom ON quest_completions (kingdom)",
)


def init_schema() -> None:
    with _engine.begin() as conn:
        for statement in _SCHEMA:
            conn.execute(text(statement))


@contextmanager
def tx():
    """One transaction: committed on exit, rolled back on error."""
    with _engine.begin() as conn:
        yield conn


def backend_name() -> str:
    return "sqlite" if _IS_SQLITE else "postgres"
