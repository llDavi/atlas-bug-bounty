from .db import get_conn


def create_submission(program_name: str, platform: str, program_url: str, contact_email: str, notes: str = "") -> int:
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO program_submissions (program_name, platform, program_url, contact_email, notes)
               VALUES (?, ?, ?, ?, ?)""",
            (program_name, platform, program_url, contact_email, notes),
        )
        return cur.lastrowid


def list_submissions() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM program_submissions ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
