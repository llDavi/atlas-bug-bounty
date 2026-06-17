import asyncio
from datetime import datetime, timezone

import httpx

from .schema import build_program
from .config import HACKERONE_API_TOKEN, HACKERONE_USERNAME
from .rubric import classify_asset_type, compute_rubric_score
from .waf import detect_many

API_URL = "https://api.hackerone.com/v1/hackers/programs"
PROGRAM_URL = "https://hackerone.com/{handle}"
GRAPHQL_URL = "https://hackerone.com/graphql"

CONCURRENCY = 10

TEAM_QUERY = """
query($handle: String!) {
  team(handle: $handle) {
    participants_count
    started_accepting_at
    resolved_report_count
    response_efficiency_percentage
    minimum_bounty_table_value
    maximum_bounty_table_value
  }
}
"""


def _program_age_months(started_accepting_at):
    if not started_accepting_at:
        return None
    try:
        started = datetime.fromisoformat(started_accepting_at.replace("Z", "+00:00"))
    except ValueError:
        return None
    delta = datetime.now(timezone.utc) - started
    return delta.days / 30.0


def _response_hours_from_efficiency(pct):
    """response_efficiency_percentage (0-100) is the closest public proxy for
    average first-response time, since first_response_time itself is
    permission-gated and returns null for non-team-members."""
    if pct is None:
        return None
    if pct >= 75:
        return 12.0
    if pct >= 40:
        return 48.0
    return 96.0


async def _fetch_scopes(client, sem, handle):
    async with sem:
        try:
            resp = await client.get(
                f"{API_URL}/{handle}/structured_scopes",
                params={"page[size]": 100},
            )
            resp.raise_for_status()
            return resp.json().get("data", [])
        except httpx.HTTPError:
            return None


async def _fetch_team_stats(client, sem, handle):
    async with sem:
        try:
            resp = await client.post(
                GRAPHQL_URL, json={"query": TEAM_QUERY, "variables": {"handle": handle}}
            )
            resp.raise_for_status()
            return (resp.json().get("data") or {}).get("team") or {}
        except httpx.HTTPError:
            return {}


async def _gather_extras(handles):
    auth = (HACKERONE_USERNAME, HACKERONE_API_TOKEN)
    sem = asyncio.Semaphore(CONCURRENCY)
    graphql_sem = asyncio.Semaphore(CONCURRENCY)

    # structured_scopes requires the authenticated REST API; the GraphQL
    # endpoint is public and rejects requests that carry the REST Basic Auth
    # header, so it needs its own unauthenticated client.
    async with httpx.AsyncClient(auth=auth, timeout=10) as rest_client, httpx.AsyncClient(timeout=10) as graphql_client:
        scope_tasks = [_fetch_scopes(rest_client, sem, h) for h in handles]
        stats_tasks = [_fetch_team_stats(graphql_client, graphql_sem, h) for h in handles]
        scopes_results, stats_results = await asyncio.gather(
            asyncio.gather(*scope_tasks), asyncio.gather(*stats_tasks)
        )

    extras = {}
    waf_targets = {}
    for handle, scopes, stats in zip(handles, scopes_results, stats_results):
        in_scope = [s for s in (scopes or []) if s.get("attributes", {}).get("eligible_for_submission")]
        asset_types = set()
        has_wildcard = False
        domain = None
        for asset in in_scope:
            attrs = asset["attributes"]
            asset_type = attrs.get("asset_type", "")
            asset_types.add(classify_asset_type(asset_type))
            if asset_type == "WILDCARD" or "*" in attrs.get("asset_identifier", ""):
                has_wildcard = True
            if domain is None and asset_type in ("URL", "WILDCARD"):
                domain = attrs.get("asset_identifier")

        if domain:
            waf_targets[handle] = domain

        extras[handle] = {
            "asset_count": len(in_scope) if scopes is not None else None,
            "asset_types": asset_types,
            "has_wildcard": has_wildcard,
            "scope_clear": len(in_scope) > 0 if scopes is not None else None,
            "bounty_table_defined": bool(stats.get("maximum_bounty_table_value")),
            "resolved_reports": stats.get("resolved_report_count"),
            "program_age_months": _program_age_months(stats.get("started_accepting_at")),
            "participants": stats.get("participants_count"),
            "response_hours": _response_hours_from_efficiency(stats.get("response_efficiency_percentage")),
        }

    waf_results = await detect_many(waf_targets.values())
    for handle, domain in waf_targets.items():
        extras[handle]["waf"] = waf_results.get(domain, "unknown")

    return extras


def fetch():
    if not HACKERONE_USERNAME or not HACKERONE_API_TOKEN:
        return []

    raw_programs = []
    auth = (HACKERONE_USERNAME, HACKERONE_API_TOKEN)
    url = API_URL

    with httpx.Client(timeout=10, auth=auth) as client:
        while url:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()

            for item in data.get("data", []):
                attrs = item.get("attributes", {})
                if attrs.get("state") != "public_mode":
                    continue
                raw_programs.append(
                    {
                        "handle": attrs.get("handle", ""),
                        "name": attrs.get("name", attrs.get("handle", "")),
                        "currency": attrs.get("currency", "USD"),
                    }
                )

            url = data.get("links", {}).get("next")

    handles = [p["handle"] for p in raw_programs]
    extras = asyncio.run(_gather_extras(handles))

    programs = []
    for p in raw_programs:
        metrics = extras.get(p["handle"], {})
        rubric_score = compute_rubric_score(metrics)
        programs.append(
            build_program(
                name=p["name"],
                platform="hackerone",
                url=PROGRAM_URL.format(handle=p["handle"]),
                currency=p["currency"],
                rubric_score=rubric_score,
            )
        )

    return programs
