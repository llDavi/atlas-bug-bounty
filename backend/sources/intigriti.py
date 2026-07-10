import asyncio

import httpx

from .schema import build_program
from .config import INTIGRITI_API_TOKEN
from .rubric import classify_asset_type, compute_rubric_score
from .waf import detect_many

API_URL = "https://api.intigriti.com/external/researcher/v1/programs"
PROGRAM_URL = "https://app.intigriti.com/researcher/programs/{handle}/{id}"

CONCURRENCY = 10


def _domain_for_waf(endpoint):
    domain = endpoint.strip().lstrip("*").lstrip(".")
    if "/" in domain:
        domain = domain.split("/")[0]
    return domain


RETRY_ATTEMPTS = 3


async def _fetch_detail(client, sem, program_id):
    async with sem:
        for attempt in range(RETRY_ATTEMPTS):
            try:
                resp = await client.get(f"{API_URL}/{program_id}")
                if resp.status_code != 200:
                    raise httpx.HTTPStatusError("non-200", request=resp.request, response=resp)
                return resp.json()
            except httpx.HTTPError:
                if attempt == RETRY_ATTEMPTS - 1:
                    return None
                await asyncio.sleep(0.5 * (attempt + 1))


async def _gather_extras(ids):
    sem = asyncio.Semaphore(CONCURRENCY)
    headers = {"Authorization": f"Bearer {INTIGRITI_API_TOKEN}"}

    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        details = await asyncio.gather(*[_fetch_detail(client, sem, pid) for pid in ids])

    extras = {}
    waf_targets = {}
    for pid, detail in zip(ids, details):
        if detail is None or "domains" not in detail:
            extras[pid] = {}
            continue

        content = detail["domains"].get("content") or []
        asset_types = {classify_asset_type(c["type"]["value"]) for c in content}
        has_wildcard = any(c["type"]["value"] == "Wildcard" for c in content)
        targets = [
            {"identifier": c["endpoint"], "type": classify_asset_type(c["type"]["value"])}
            for c in content
        ]

        for c in content:
            if c["type"]["value"] in ("Wildcard", "Url"):
                waf_targets[pid] = _domain_for_waf(c["endpoint"])
                break

        extras[pid] = {
            "asset_count": len(content),
            "asset_types": asset_types,
            "has_wildcard": has_wildcard,
            "scope_clear": len(content) > 0,
            "targets": targets,
            # bounty table here only exposes qualitative tiers (Tier 1-3 / No
            # Bounty), not per-severity amounts, so we can't confirm a
            # defined $ bounty table from this endpoint.
            "bounty_table_defined": None,
            "resolved_reports": None,
            "program_age_months": None,
            "participants": None,
            "response_hours": None,
        }

    waf_results = await detect_many(waf_targets.values())
    for pid, domain in waf_targets.items():
        extras[pid]["waf"] = waf_results.get(domain, "unknown")

    return extras


def fetch():
    if not INTIGRITI_API_TOKEN:
        return []

    raw_programs = []
    headers = {"Authorization": f"Bearer {INTIGRITI_API_TOKEN}"}

    with httpx.Client(timeout=10, headers=headers) as client:
        resp = client.get(API_URL)
        resp.raise_for_status()
        data = resp.json()

        items = data if isinstance(data, list) else data.get("records", data.get("items", []))

        for item in items:
            max_bounty = item.get("maxBounty") or {}
            min_bounty = item.get("minBounty") or {}
            raw_programs.append(
                {
                    "id": item.get("id", ""),
                    "handle": item.get("handle", ""),
                    "name": item.get("name", ""),
                    "payout_min": min_bounty.get("value", 0),
                    "payout_max": max_bounty.get("value", 0),
                    "currency": max_bounty.get("currency", "EUR"),
                }
            )

    ids = [p["id"] for p in raw_programs]
    extras = asyncio.run(_gather_extras(ids))

    programs = []
    for p in raw_programs:
        metrics = extras.get(p["id"], {})
        rubric_score = compute_rubric_score(metrics)
        programs.append(
            build_program(
                name=p["name"],
                platform="intigriti",
                url=PROGRAM_URL.format(handle=p["handle"], id=p["id"]),
                payout_min=p["payout_min"],
                payout_max=p["payout_max"],
                currency=p["currency"],
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
