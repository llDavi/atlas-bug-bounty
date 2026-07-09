"""Normalized program schema shared by every source fetcher.

Each fetcher in this package returns a list of dicts matching this shape,
so the rest of the app (and the frontend) only ever deals with one format,
regardless of whether the program is a classic web bug bounty or a
smart-contract audit contest.

Fields:
  id            int, assigned by the aggregator (stable within a single run)
  name          str, program/contest name
  platform      str slug, e.g. "yeswehack", "immunefi", "sherlock"
  url           str, direct link to the program/contest page
  type          str, one of "web" | "api" | "mobile" | "smart_contract"
  payout_min    int, lowest known reward (0 if unknown)
  payout_max    int, highest known reward / bounty cap
  currency      str, "USD" | "EUR" | ...
  geo_access    str, "ok" | "vpn" | "blocked" | "unknown"
  geo_note      str, short human-readable note shown in the geo badge
  difficulty    int 1-5, heuristic based on payout_max, or derived from
                rubric_score when available
  difficulty_band  str, "easy" | "medium" | "hard" - used to group programs
                into the Netflix-style rows on the frontend
  rubric_score  float 0-100 or None, output of rubric.compute_rubric_score()
                when the source provides enough data, else None
  stack_tags    list[str], technologies / ecosystems involved
  updated_at    str, ISO date (YYYY-MM-DD)
  logo          str, URL to the program/project logo ("" if unknown)
  targets       list[dict], in-scope assets as {"identifier": str, "type": str}.
                Free to view. Empty when the source doesn't expose scope
                publicly (e.g. Bugcrowd, which gates it behind a researcher
                login).
  stats         dict, Pro-only program intel: participants, resolved_reports,
                response_hours, bounty_table_defined, waf. Any key may be
                None when the source doesn't provide it.
"""

from .rubric import band_from_rubric_score, difficulty_from_rubric_score

DIFFICULTY_THRESHOLDS = [
    (1_000, 1),
    (5_000, 2),
    (20_000, 3),
    (100_000, 4),
]


def difficulty_from_payout(payout_max):
    if not payout_max:
        return 1
    for threshold, level in DIFFICULTY_THRESHOLDS:
        if payout_max < threshold:
            return level
    return 5


def band_from_difficulty(difficulty):
    if difficulty <= 2:
        return "easy"
    if difficulty == 3:
        return "medium"
    return "hard"


def build_program(
    *,
    name,
    platform,
    url,
    type="web",
    payout_min=0,
    payout_max=0,
    currency="USD",
    geo_access="unknown",
    geo_note="Not specified",
    stack_tags=None,
    updated_at="",
    difficulty=None,
    logo="",
    rubric_score=None,
    targets=None,
    stats=None,
):
    payout_min = payout_min or 0
    payout_max = payout_max or 0

    if rubric_score is not None:
        difficulty = difficulty_from_rubric_score(rubric_score)
        difficulty_band = band_from_rubric_score(rubric_score)
    else:
        difficulty = difficulty if difficulty is not None else difficulty_from_payout(payout_max)
        difficulty_band = band_from_difficulty(difficulty)

    return {
        "name": name,
        "platform": platform,
        "url": url,
        "type": type,
        "payout_min": payout_min,
        "payout_max": payout_max,
        "currency": currency,
        "geo_access": geo_access,
        "geo_note": geo_note,
        "difficulty": difficulty,
        "difficulty_band": difficulty_band,
        "rubric_score": rubric_score,
        "stack_tags": stack_tags or [],
        "updated_at": updated_at,
        "logo": logo or "",
        "targets": targets or [],
        "stats": stats or {},
    }
