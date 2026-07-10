import asyncio

import httpx

from .schema import build_program
from .rubric import classify_asset_type, compute_rubric_score
from .waf import detect_many

API_URL = "https://api.yeswehack.com/programs"
PROGRAM_URL = "https://yeswehack.com/programs/{slug}"

CONCURRENCY = 10


def _scope_domain(scope):
    domain = scope.lstrip("*").lstrip(".")
    if "://" in domain:
        domain = domain.split("://", 1)[1]
    domain = domain.split("/")[0]
    return domain


RETRY_ATTEMPTS = 3


async def _fetch_detail(client, sem, slug):
    async with sem:
        for attempt in range(RETRY_ATTEMPTS):
            try:
                resp = await client.get(f"{API_URL}/{slug}")
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPError:
                if attempt == RETRY_ATTEMPTS - 1:
                    return None
                await asyncio.sleep(0.5 * (attempt + 1))


async def _gather_extras(slugs):
    sem = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient(timeout=10) as client:
        details = await asyncio.gather(*[_fetch_detail(client, sem, slug) for slug in slugs])

    extras = {}
    waf_targets = {}
    for slug, detail in zip(slugs, details):
        if detail is None:
            extras[slug] = {}
            continue

        scopes = detail.get("scopes") or []
        asset_types = {classify_asset_type(s.get("scope_type")) for s in scopes}
        has_wildcard = any(s.get("scope", "").startswith("*.") for s in scopes)
        targets = [
            {"identifier": s.get("scope", ""), "type": classify_asset_type(s.get("scope_type"))}
            for s in scopes
        ]

        reward_grid = detail.get("reward_grid_default") or {}
        bounty_table_defined = any((reward_grid.get(k) or 0) > 0 for k in reward_grid)

        stats = detail.get("stats") or {}

        if scopes:
            waf_targets[slug] = _scope_domain(scopes[0]["scope"])

        extras[slug] = {
            "asset_count": detail.get("scopes_count"),
            "asset_types": asset_types,
            "has_wildcard": has_wildcard,
            "scope_clear": len(scopes) > 0,
            "targets": targets,
            "bounty_table_defined": bounty_table_defined,
            "resolved_reports": stats.get("total_reports"),
            "program_age_months": None,
            "participants": None,
            "response_hours": stats.get("average_first_time_response"),
        }

    waf_results = await detect_many(waf_targets.values())
    for slug, domain in waf_targets.items():
        extras[slug]["waf"] = waf_results.get(domain, "unknown")

    return extras


def fetch():
    raw_programs = []
    page = 1
    with httpx.Client(timeout=10) as client:
        while True:
            resp = client.get(API_URL, params={"page": page})
            resp.raise_for_status()
            data = resp.json()

            for item in data["items"]:
                if not item.get("bounty") or item.get("status") != "V" or item.get("archived"):
                    continue

                business_unit = item.get("business_unit") or {}
                logo = (business_unit.get("logo") or {}).get("url") or (item.get("thumbnail") or {}).get("url") or ""
                raw_programs.append(
                    {
                        "title": item["title"],
                        "slug": item["slug"],
                        "payout_min": item.get("bounty_reward_min") or 0,
                        "payout_max": item.get("bounty_reward_max") or 0,
                        "currency": business_unit.get("currency", "EUR"),
                        "stack_tags": [item["activity_area"]] if item.get("activity_area") else [],
                        "updated_at": (item.get("last_update_at") or "")[:10],
                        "logo": logo,
                    }
                )

            pagination = data["pagination"]
            if page >= pagination["nb_pages"]:
                break
            page += 1

    slugs = [p["slug"] for p in raw_programs]
    extras = asyncio.run(_gather_extras(slugs))

    programs = []
    for p in raw_programs:
        metrics = extras.get(p["slug"], {})
        rubric_score = compute_rubric_score(metrics)
        programs.append(
            build_program(
                name=p["title"],
                platform="yeswehack",
                url=PROGRAM_URL.format(slug=p["slug"]),
                payout_min=p["payout_min"],
                payout_max=p["payout_max"],
                currency=p["currency"],
                stack_tags=p["stack_tags"],
                updated_at=p["updated_at"],
                logo=p["logo"],
                rubric_score=rubric_score,
                targets=metrics.get("targets", []),
                stats={
                    "participants": metrics.get("participants"),
                    "resolved_reports": metrics.get("resolved_reports"),
                    "response_hours": metrics.get("response_hours"),
                    "bounty_table_defined": metrics.get("bounty_table_defined"),
                    "waf": metrics.get("waf"),
                },
            )
        )

    return programs
