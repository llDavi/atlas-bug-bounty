from datetime import datetime, timezone

import httpx

from .schema import build_program

API_URL = "https://audits.sherlock.xyz/api/contests"
PROGRAM_URL = "https://audits.sherlock.xyz/contests/{id}"
MAX_PAGES = 5


def fetch():
    programs = []
    with httpx.Client(timeout=10) as client:
        for page in range(1, MAX_PAGES + 1):
            resp = client.get(API_URL, params={"page": page})
            resp.raise_for_status()
            data = resp.json()

            for item in data["items"]:
                if item.get("status") != "RUNNING" or item.get("private"):
                    continue

                starts_at = item.get("starts_at")
                updated_at = (
                    datetime.fromtimestamp(starts_at, tz=timezone.utc).strftime("%Y-%m-%d")
                    if starts_at
                    else ""
                )
                programs.append(
                    build_program(
                        name=item["title"],
                        platform="sherlock",
                        url=PROGRAM_URL.format(id=item["id"]),
                        type="smart_contract",
                        payout_max=max(item.get("prize_pool") or 0, item.get("rewards") or 0),
                        currency="USD",
                        stack_tags=[item["type_label"]] if item.get("type_label") else [],
                        updated_at=updated_at,
                        logo=item.get("logo_url") or "",
                    )
                )

            if not data.get("has_next"):
                break

    return programs
