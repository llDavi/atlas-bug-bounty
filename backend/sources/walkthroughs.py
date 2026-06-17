"""Loads walkthrough markdown files from the walkthroughs/ directory.

Each file has YAML frontmatter + markdown body.
The body is only returned on the detail endpoint (Pro-gated).
The list endpoint returns frontmatter + teaser only.
"""

import os
from pathlib import Path

import frontmatter

_WALKTHROUGHS_DIR = Path(__file__).parent.parent / "walkthroughs"

_DIFFICULTY_ORDER = {"easy": 0, "medium": 1, "hard": 2}


def _load_all() -> list[dict]:
    results = []
    for path in sorted(_WALKTHROUGHS_DIR.glob("*.md")):
        post = frontmatter.load(str(path))
        meta = dict(post.metadata)
        meta["body"] = post.content
        results.append(meta)

    results.sort(key=lambda w: (
        _DIFFICULTY_ORDER.get(w.get("difficulty", "hard"), 99),
        w.get("published_at", ""),
    ))
    return results


def get_list() -> list[dict]:
    """Returns all walkthroughs without the full body (safe for public endpoint)."""
    return [
        {k: v for k, v in w.items() if k != "body"}
        for w in _load_all()
    ]


def get_detail(slug: str) -> dict | None:
    """Returns a single walkthrough including full body, or None if not found."""
    for w in _load_all():
        if w.get("slug") == slug:
            return w
    return None
