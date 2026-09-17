"""Quests — lessons with questions set into the text.

Each quest is a markdown file at quests/<kingdom>/<slug>.md with YAML
frontmatter. Questions are fenced blocks inside the body:

    ```question
    id: method
    prompt: Which method does this request use?
    answer: GET
    accept: [get request]
    hint: The first word of the request line.
    ```

The public view never contains `answer` or `accept`: the browser only ever
receives the prompt, and answers are checked here. A quest is complete when
every one of its questions has been answered correctly; wrong answers can be
retried without limit or penalty. A quest unlocks when every quest in its
`requires` list is complete — the roads on the map, written down.

Content is validated when the app boots, so a malformed quest file fails the
deploy instead of failing a hunter mid-lesson.
"""

import re
from functools import lru_cache
from pathlib import Path

import frontmatter
import yaml

from .realm import ATTRIBUTES, DISCIPLINES, KINGDOMS

_DIR = Path(__file__).parent.parent / "quests"
_QUESTION = re.compile(r"^```question[ \t]*\n(.*?)\n```[ \t]*$", re.M | re.S)
_REQUIRED = ("slug", "title", "kingdom", "place", "xp")


def _normalise(value) -> str:
    """Case, spacing, surrounding quotes and a trailing . or : never decide an answer."""
    s = " ".join(str(value).strip().lower().split())
    return s.strip("\"'`").rstrip(".:").strip()


def _parse(path: Path) -> dict:
    post = frontmatter.load(str(path))
    meta = dict(post.metadata)
    missing = [key for key in _REQUIRED if key not in meta]
    if missing:
        raise ValueError(f"{path.name}: missing frontmatter {', '.join(missing)}")
    if meta["kingdom"] not in KINGDOMS:
        raise ValueError(f"{path.name}: unknown kingdom {meta['kingdom']}")
    if meta["kingdom"] != path.parent.name:
        raise ValueError(f"{path.name}: kingdom {meta['kingdom']} but filed under {path.parent.name}/")

    skills = [str(s) for s in (meta.get("skills") or [])]
    unknown = [s for s in skills if s not in DISCIPLINES]
    if unknown:
        raise ValueError(f"{path.name}: unknown skills {', '.join(unknown)}")
    trains = {str(k): int(v) for k, v in (meta.get("attributes") or {}).items()}
    unknown = [a for a in trains if a not in ATTRIBUTES]
    if unknown:
        raise ValueError(f"{path.name}: unknown attributes {', '.join(unknown)}")

    body = post.content
    sections, answers, cursor = [], {}, 0
    for match in _QUESTION.finditer(body):
        prose = body[cursor:match.start()].strip()
        if prose:
            sections.append({"type": "text", "markdown": prose})

        block = yaml.safe_load(match.group(1)) or {}
        for key in ("id", "prompt", "answer"):
            if key not in block:
                raise ValueError(f"{path.name}: a question is missing '{key}'")
        question_id = str(block["id"])
        if question_id in answers:
            raise ValueError(f"{path.name}: question id '{question_id}' used twice")

        answers[question_id] = {_normalise(block["answer"])} | {_normalise(a) for a in block.get("accept") or []}
        public = {"type": "question", "id": question_id, "prompt": str(block["prompt"])}
        if block.get("hint"):
            public["hint"] = str(block["hint"])
        sections.append(public)
        cursor = match.end()

    tail = body[cursor:].strip()
    if tail:
        sections.append({"type": "text", "markdown": tail})
    if not answers:
        raise ValueError(f"{path.name}: a quest needs at least one question")

    return {
        "meta": {
            "slug": str(meta["slug"]),
            "title": str(meta["title"]),
            "kingdom": meta["kingdom"],
            "place": str(meta["place"]),
            "xp": int(meta["xp"]),
            "order": int(meta.get("order", 0)),
            "difficulty": int(meta.get("difficulty", 1)),
            "minutes": meta.get("minutes"),
            "summary": str(meta.get("summary", "")),
            "requires": [str(r) for r in (meta.get("requires") or [])],
            "skills": skills,
            "attributes": trains,
        },
        "sections": sections,
        "answers": answers,
    }


@lru_cache(maxsize=1)
def _all() -> dict[str, dict]:
    found = {}
    for path in sorted(_DIR.glob("*/*.md")):
        quest = _parse(path)
        slug = quest["meta"]["slug"]
        if slug in found:
            raise ValueError(f"{path.name}: slug '{slug}' used by two quests")
        found[slug] = quest
    for slug, quest in found.items():
        for required in quest["meta"]["requires"]:
            if required not in found:
                raise ValueError(f"{slug}: requires unknown quest '{required}'")
    return found


def validate() -> int:
    """Parse every quest now; raises on malformed content. Returns the count."""
    return len(_all())


def _status(meta: dict, completed: set[str]) -> str:
    if meta["slug"] in completed:
        return "completed"
    return "available" if all(r in completed for r in meta["requires"]) else "locked"


def meta(slug: str) -> dict | None:
    quest = _all().get(slug)
    return quest["meta"] if quest else None


def question_ids(slug: str) -> list[str]:
    return list(_all()[slug]["answers"])


def is_unlocked(slug: str, completed: set[str]) -> bool:
    return _status(_all()[slug]["meta"], completed) != "locked"


def check(slug: str, question_id: str, given: str) -> bool | None:
    """True/False for a known question, None if the question does not exist."""
    accepted = _all()[slug]["answers"].get(question_id)
    if accepted is None:
        return None
    return _normalise(given) in accepted


def list_public(kingdom: str | None = None, completed: set[str] = frozenset(),
                answered: dict[str, int] | None = None) -> list[dict]:
    quests = [q for q in _all().values() if not kingdom or q["meta"]["kingdom"] == kingdom]
    quests.sort(key=lambda q: (q["meta"]["kingdom"], q["meta"]["order"], q["meta"]["slug"]))
    return [
        {
            **q["meta"],
            "questions": len(q["answers"]),
            "answered": (answered or {}).get(q["meta"]["slug"], 0),
            "status": _status(q["meta"], completed),
        }
        for q in quests
    ]


def get_public(slug: str, completed: set[str] = frozenset(), answered: set[str] = frozenset()) -> dict | None:
    quest = _all().get(slug)
    if not quest:
        return None
    sections = [
        {**s, "answered": s["id"] in answered} if s["type"] == "question" else s
        for s in quest["sections"]
    ]
    return {
        **quest["meta"],
        "questions": len(quest["answers"]),
        "status": _status(quest["meta"], completed),
        "sections": sections,
    }
