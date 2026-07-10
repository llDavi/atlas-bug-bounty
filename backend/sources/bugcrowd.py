import re
from datetime import date

import httpx

from .schema import build_program

API_URL = "https://bugcrowd.com/engagements.json"
HEADERS = {"User-Agent": "Mozilla/5.0"}


def _parse_amount(value):
    if not value:
        return 0
    digits = re.sub(r"[^\d]", "", value)
    return int(digits) if digits else 0


def fetch():
    programs = []
    today = date.today().isoformat()
    with httpx.Client(timeout=10, headers=HEADERS) as client:
        page = 1
        while True:
            resp = client.get(
                API_URL,
                params={"category": "bug_bounty", "page": page, "sort_by": "promoted", "sort_direction": "desc"},
            )
            resp.raise_for_status()
            data = resp.json()

            for item in data["engagements"]:
                if item.get("isPrivate") or item.get("accessStatus") != "open":
                    continue

                reward = item.get("rewardSummary") or {}
                currency = "EUR" if "€" in (reward.get("minReward") or reward.get("maxReward") or "") else "USD"
                programs.append(
                    build_program(
                        name=item["name"],
                        platform="bugcrowd",
                        url=item["briefUrl"],
                        payout_min=_parse_amount(reward.get("minReward")),
                        payout_max=_parse_amount(reward.get("maxReward")),
                        currency=currency,
                        stack_tags=[item["industryName"]] if item.get("industryName") else [],
                        updated_at=today,
                        logo=item.get("logoUrl") or "",
                    )
                )

            meta = data["paginationMeta"]
            if page * meta["limit"] >= meta["totalCount"]:
                break
            page += 1

    return programs
