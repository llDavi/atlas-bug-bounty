"""Scoring engine for the 4-category program rubric.

Each category is scored on its own raw scale and then normalized to 25
points (so the four categories sum to 0-100). Unlike a flat "missing data
= 0" approach, normalization here is done **per sub-metric availability**:
a sub-metric that we have no data for is excluded from both the raw score
and the max for its category, rather than counting against the program.

If an entire category has no available sub-metrics at all (e.g. Intigriti's
competitiveness data), that category gets a neutral 12.5/25 (50%) instead
of collapsing the whole score to 0.
"""

NEUTRAL_CATEGORY_SCORE = 12.5


def classify_asset_type(raw_type):
    """Map a platform-specific asset/scope type string to web/mobile/api/other."""
    t = (raw_type or "").lower()
    if "mobile" in t or "android" in t or "ios" in t:
        return "mobile"
    if "api" in t:
        return "api"
    if t in ("url", "wildcard", "web-application", "domain", "other"):
        return "web" if t != "other" else "other"
    return "other"


def score_category1(asset_count, asset_types, has_wildcard):
    if asset_count is None:
        return []

    pairs = []
    if asset_count < 10:
        pairs.append((5, 25))
    elif asset_count <= 30:
        pairs.append((15, 25))
    else:
        pairs.append((25, 25))

    n_types = len(set(asset_types or []))
    if n_types >= 3:
        pairs.append((10 + (5 if n_types > 3 else 0), 15))
    elif n_types >= 1:
        pairs.append((5, 15))
    else:
        pairs.append((0, 15))

    pairs.append((5 if has_wildcard else 0, 5))
    return pairs


def score_category2(waf, account_required, stack_known):
    pairs = []

    if waf in ("none", "cloudflare", "akamai", "imperva", "other"):
        if waf == "none":
            points = 25
        elif waf == "cloudflare":
            points = 15
        elif waf in ("akamai", "imperva"):
            points = 5
        else:
            points = 0
        pairs.append((points, 25))

    if account_required is not None:
        if account_required == "no":
            points = 5
        elif account_required == "free":
            points = 3
        else:
            points = 0
        pairs.append((points, 5))

    if stack_known is not None:
        pairs.append((5 if stack_known else 0, 5))

    return pairs


def score_category3(resolved_reports, program_age_months, participants):
    pairs = []

    if resolved_reports is not None:
        if resolved_reports == 0:
            points = 25
        elif resolved_reports <= 10:
            points = 15
        elif resolved_reports <= 50:
            points = 8
        else:
            points = 2
        pairs.append((points, 25))

    if program_age_months is not None:
        if program_age_months < 6:
            points = 10
        elif program_age_months <= 24:
            points = 5
        else:
            points = 0
        pairs.append((points, 10))

    if participants is not None:
        if participants < 100:
            points = 5
        elif participants <= 500:
            points = 3
        else:
            points = 0
        pairs.append((points, 5))

    return pairs


def score_category4(response_hours, scope_clear, bounty_table_defined):
    pairs = []

    if response_hours is not None:
        if response_hours < 24:
            points = 10
        elif response_hours <= 72:
            points = 5
        else:
            points = 0
        pairs.append((points, 10))

    if scope_clear is not None:
        pairs.append((5 if scope_clear else 0, 5))

    if bounty_table_defined is not None:
        pairs.append((5 if bounty_table_defined else 0, 5))

    return pairs


def _category_score(pairs):
    total_max = sum(m for _, m in pairs)
    if total_max == 0:
        return NEUTRAL_CATEGORY_SCORE
    total_raw = sum(r for r, _ in pairs)
    return (total_raw / total_max) * 25


def compute_rubric_score(metrics):
    """metrics: dict with the keys consumed by score_category1..4.

    Returns a float in [0, 100].
    """
    c1 = _category_score(
        score_category1(
            metrics.get("asset_count"),
            metrics.get("asset_types"),
            metrics.get("has_wildcard"),
        )
    )
    c2 = _category_score(
        score_category2(
            metrics.get("waf"),
            metrics.get("account_required"),
            metrics.get("stack_known"),
        )
    )
    c3 = _category_score(
        score_category3(
            metrics.get("resolved_reports"),
            metrics.get("program_age_months"),
            metrics.get("participants"),
        )
    )
    c4 = _category_score(
        score_category4(
            metrics.get("response_hours"),
            metrics.get("scope_clear"),
            metrics.get("bounty_table_defined"),
        )
    )

    return c1 + c2 + c3 + c4


def band_from_rubric_score(score):
    if score >= 75:
        return "easy"
    if score >= 45:
        return "medium"
    return "hard"


def difficulty_from_rubric_score(score):
    """Map the 0-100 rubric score to the existing 1-5 difficulty dots."""
    if score >= 75:
        return 1
    if score >= 60:
        return 2
    if score >= 45:
        return 3
    if score >= 25:
        return 4
    return 5
