import httpx

from .schema import build_program

API_URL = "https://immunefi.com/public-api/bounties.json"
PROGRAM_URL = "https://immunefi.com/bug-bounty/{slug}/"


def fetch():
    programs = []
    with httpx.Client(timeout=15) as client:
        resp = client.get(API_URL)
        resp.raise_for_status()
        items = resp.json()

    for item in items:
        if item.get("inviteOnly"):
            continue

        tags = [*(item.get("ecosystem") or []), *(item.get("language") or [])]
        programs.append(
            build_program(
                name=item["project"],
                platform="immunefi",
                url=PROGRAM_URL.format(slug=item["slug"]),
                type="smart_contract",
                payout_max=item.get("maxBounty") or 0,
                currency="USD",
                stack_tags=tags[:4],
                updated_at=(item.get("updatedDate") or "")[:10],
                logo=item.get("logo") or "",
            )
        )

    return programs
