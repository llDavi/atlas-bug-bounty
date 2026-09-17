"""Hunters — the people who signed the register — and their progress.

A hunter exists from the moment a Clerk user signs the register. Identity
(name, alignment, kingdoms followed) can change at any time; progress
(correct answers, completed quests) only ever grows. XP is never stored as a
running total: it is summed from completed quests, so it cannot drift from
the record that earned it.
"""

import re
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from .realm import ALIGNMENTS, KINGDOMS
from .store import tx


class AlreadyRegistered(Exception):
    pass


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def clean_name(raw: str) -> str:
    name = " ".join(str(raw).split())
    if not 2 <= len(name) <= 40 or not re.fullmatch(r"[\w .'\-]+", name):
        raise ValueError("A hunter's name is 2–40 letters, digits, spaces or . ' -")
    return name


def _clean_alignment(alignment: str) -> str:
    if alignment not in ALIGNMENTS:
        raise ValueError(f"Unknown alignment: {alignment}")
    return alignment


def _clean_kingdoms(kingdoms: list[str]) -> list[str]:
    cleaned = []
    for kingdom in kingdoms:
        if kingdom not in KINGDOMS:
            raise ValueError(f"Unknown kingdom: {kingdom}")
        if kingdom not in cleaned:
            cleaned.append(kingdom)
    if not cleaned:
        raise ValueError("Follow at least one kingdom")
    return cleaned


def is_registered(clerk_id: str) -> bool:
    with tx() as conn:
        return conn.execute(
            text("SELECT 1 FROM hunters WHERE clerk_id = :id"), {"id": clerk_id}
        ).first() is not None


def get_hunter(clerk_id: str) -> dict | None:
    with tx() as conn:
        row = conn.execute(
            text("SELECT name, alignment, oath_sworn_at, created_at FROM hunters WHERE clerk_id = :id"),
            {"id": clerk_id},
        ).mappings().first()
        if not row:
            return None
        # Always the realm's own order, so the sheet never reshuffles with
        # the timestamps of when each kingdom was joined.
        # A kingdom since retired from the realm is simply left off the sheet.
        kingdoms = sorted(
            (r[0] for r in conn.execute(
                text("SELECT kingdom FROM hunter_kingdoms WHERE clerk_id = :id"), {"id": clerk_id}
            ) if r[0] in KINGDOMS),
            key=KINGDOMS.index,
        )
        earned = {
            r[0]: int(r[1]) for r in conn.execute(
                text("SELECT kingdom, SUM(xp) FROM quest_completions WHERE clerk_id = :id GROUP BY kingdom"),
                {"id": clerk_id},
            )
        }
        completed = [
            r[0] for r in conn.execute(
                text("SELECT quest_slug FROM quest_completions WHERE clerk_id = :id ORDER BY completed_at"),
                {"id": clerk_id},
            )
        ]

    # Every followed kingdom shows a grade, even at 0; progress made in a
    # kingdom the hunter stopped following is kept, not hidden.
    kingdom_xp = {k: earned.get(k, 0) for k in kingdoms}
    for kingdom, xp in earned.items():
        kingdom_xp.setdefault(kingdom, xp)

    return {
        "name": row["name"],
        "alignment": row["alignment"],
        "kingdoms": kingdoms,
        "xp": sum(earned.values()),
        "kingdom_xp": kingdom_xp,
        "completed_quests": completed,
        "oath_sworn_at": row["oath_sworn_at"],
        "created_at": row["created_at"],
    }


def register(clerk_id: str, name: str, alignment: str, kingdoms: list[str]) -> dict:
    name = clean_name(name)
    alignment = _clean_alignment(alignment)
    kingdoms = _clean_kingdoms(kingdoms)
    now = _now()
    try:
        with tx() as conn:
            conn.execute(
                text("""INSERT INTO hunters (clerk_id, name, alignment, oath_sworn_at, created_at, updated_at)
                        VALUES (:id, :name, :alignment, :now, :now, :now)"""),
                {"id": clerk_id, "name": name, "alignment": alignment, "now": now},
            )
            for kingdom in kingdoms:
                conn.execute(
                    text("INSERT INTO hunter_kingdoms (clerk_id, kingdom, joined_at) VALUES (:id, :kingdom, :now)"),
                    {"id": clerk_id, "kingdom": kingdom, "now": now},
                )
    except IntegrityError:
        # The primary key on hunters is the only thing that can collide here.
        raise AlreadyRegistered()
    return get_hunter(clerk_id)


def update(clerk_id: str, name: str | None = None, alignment: str | None = None,
           kingdoms: list[str] | None = None) -> dict | None:
    changes = {}
    if name is not None:
        changes["name"] = clean_name(name)
    if alignment is not None:
        changes["alignment"] = _clean_alignment(alignment)
    followed = _clean_kingdoms(kingdoms) if kingdoms is not None else None
    now = _now()

    with tx() as conn:
        if conn.execute(text("SELECT 1 FROM hunters WHERE clerk_id = :id"), {"id": clerk_id}).first() is None:
            return None
        if changes:
            # Column names come only from the fixed keys above, never from input.
            assignments = ", ".join(f"{column} = :{column}" for column in changes)
            conn.execute(
                text(f"UPDATE hunters SET {assignments}, updated_at = :now WHERE clerk_id = :id"),
                {**changes, "now": now, "id": clerk_id},
            )
        if followed is not None:
            # Keep the original joined_at of kingdoms still followed.
            for kingdom in KINGDOMS:
                if kingdom not in followed:
                    conn.execute(
                        text("DELETE FROM hunter_kingdoms WHERE clerk_id = :id AND kingdom = :kingdom"),
                        {"id": clerk_id, "kingdom": kingdom},
                    )
            for kingdom in followed:
                conn.execute(
                    text("""INSERT INTO hunter_kingdoms (clerk_id, kingdom, joined_at)
                            VALUES (:id, :kingdom, :now) ON CONFLICT DO NOTHING"""),
                    {"id": clerk_id, "kingdom": kingdom, "now": now},
                )
    return get_hunter(clerk_id)


def record_correct_answer(clerk_id: str, quest_slug: str, question_id: str) -> None:
    with tx() as conn:
        conn.execute(
            text("""INSERT INTO quest_answers (clerk_id, quest_slug, question_id, answered_at)
                    VALUES (:id, :slug, :question, :now) ON CONFLICT DO NOTHING"""),
            {"id": clerk_id, "slug": quest_slug, "question": question_id, "now": _now()},
        )


def answered_ids(clerk_id: str, quest_slug: str) -> set[str]:
    with tx() as conn:
        return {
            r[0] for r in conn.execute(
                text("SELECT question_id FROM quest_answers WHERE clerk_id = :id AND quest_slug = :slug"),
                {"id": clerk_id, "slug": quest_slug},
            )
        }


def answered_counts(clerk_id: str) -> dict[str, int]:
    """Correct answers so far, per quest — how far into each lesson a hunter is."""
    with tx() as conn:
        return {
            r[0]: int(r[1]) for r in conn.execute(
                text("SELECT quest_slug, COUNT(*) FROM quest_answers WHERE clerk_id = :id GROUP BY quest_slug"),
                {"id": clerk_id},
            )
        }


def complete_quest(clerk_id: str, quest_slug: str, kingdom: str, xp: int) -> bool:
    """Record the completion; True only the first time, so XP is awarded once."""
    with tx() as conn:
        result = conn.execute(
            text("""INSERT INTO quest_completions (clerk_id, quest_slug, kingdom, xp, completed_at)
                    VALUES (:id, :slug, :kingdom, :xp, :now) ON CONFLICT DO NOTHING"""),
            {"id": clerk_id, "slug": quest_slug, "kingdom": kingdom, "xp": xp, "now": _now()},
        )
        return result.rowcount == 1


def completed_slugs(clerk_id: str) -> set[str]:
    with tx() as conn:
        return {
            r[0] for r in conn.execute(
                text("SELECT quest_slug FROM quest_completions WHERE clerk_id = :id"), {"id": clerk_id}
            )
        }


def total_xp(clerk_id: str) -> int:
    with tx() as conn:
        value = conn.execute(
            text("SELECT SUM(xp) FROM quest_completions WHERE clerk_id = :id"), {"id": clerk_id}
        ).scalar()
        return int(value or 0)


def roll(kingdom: str | None = None, limit: int = 100) -> list[dict]:
    """The Roll: hunters ordered by XP — overall, or earned in one kingdom.

    A kingdom's roll lists everyone who follows it or has earned in it, so a
    hunter who has just joined appears at 0 rather than not at all. Ties go
    to whoever signed the register first.
    """
    if kingdom is not None and kingdom not in KINGDOMS:
        raise ValueError(f"Unknown kingdom: {kingdom}")
    if kingdom:
        sql = """
            SELECT h.clerk_id, h.name, h.alignment, h.created_at,
                   COALESCE(SUM(qc.xp), 0) AS xp, COUNT(qc.quest_slug) AS quests
            FROM hunters h
            LEFT JOIN quest_completions qc ON qc.clerk_id = h.clerk_id AND qc.kingdom = :kingdom
            WHERE EXISTS (SELECT 1 FROM hunter_kingdoms hk WHERE hk.clerk_id = h.clerk_id AND hk.kingdom = :kingdom)
               OR EXISTS (SELECT 1 FROM quest_completions q2 WHERE q2.clerk_id = h.clerk_id AND q2.kingdom = :kingdom)
            GROUP BY h.clerk_id, h.name, h.alignment, h.created_at
            ORDER BY xp DESC, h.created_at ASC
            LIMIT :limit"""
        params = {"kingdom": kingdom, "limit": limit}
    else:
        sql = """
            SELECT h.clerk_id, h.name, h.alignment, h.created_at,
                   COALESCE(SUM(qc.xp), 0) AS xp, COUNT(qc.quest_slug) AS quests
            FROM hunters h
            LEFT JOIN quest_completions qc ON qc.clerk_id = h.clerk_id
            GROUP BY h.clerk_id, h.name, h.alignment, h.created_at
            ORDER BY xp DESC, h.created_at ASC
            LIMIT :limit"""
        params = {"limit": limit}
    with tx() as conn:
        rows = conn.execute(text(sql), params).mappings().all()
    return [
        {"clerk_id": r["clerk_id"], "name": r["name"], "alignment": r["alignment"],
         "xp": int(r["xp"]), "quests": int(r["quests"])}
        for r in rows
    ]

