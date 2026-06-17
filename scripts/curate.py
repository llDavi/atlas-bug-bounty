#!/usr/bin/env python3
"""
Fetches index.json from ajaysenr/HackerOne-Disclosed-Reports and prints
a ranked shortlist of good walkthrough candidates.

Usage:
    python scripts/curate.py
    python scripts/curate.py --beginner-only --top 30
    python scripts/curate.py --check-detail --top 20   # slower, fetches content
"""
import argparse
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

INDEX_URL = "https://raw.githubusercontent.com/ajaysenr/HackerOne-Disclosed-Reports/main/index.json"
REPORT_URL = "https://raw.githubusercontent.com/ajaysenr/HackerOne-Disclosed-Reports/main/reports/{id}.md"
CACHE_FILE = Path("/tmp/h1_index.json")

BEGINNER_KEYWORDS = [
    "idor", "insecure direct object",
    "broken access control", "authorization",
    "xss", "cross-site scripting",
    "csrf", "cross-site request forgery",
    "open redirect",
    "ssrf", "server-side request forgery",
    "sql injection",
    "information disclosure", "information exposure",
    "authentication bypass", "improper authentication",
    "privilege escalation",
    "path traversal", "directory traversal",
    "business logic", "rate limit", "mass assignment",
    "account takeover",
]


def fetch_index(force=False):
    if not force and CACHE_FILE.exists():
        print(f"Using cached index. Pass --refresh to re-download.", file=sys.stderr)
        return json.loads(CACHE_FILE.read_text())
    print("Fetching index.json from GitHub (~5 MB)...", file=sys.stderr)
    with urllib.request.urlopen(INDEX_URL, timeout=30) as r:
        data = json.load(r)
    CACHE_FILE.write_text(json.dumps(data))
    print(f"Cached {len(data)} reports to {CACHE_FILE}", file=sys.stderr)
    return data


def fetch_word_count(report_id):
    try:
        url = REPORT_URL.format(id=report_id)
        with urllib.request.urlopen(url, timeout=10) as r:
            content = r.read().decode("utf-8")
        # Strip the frontmatter-like header lines and count words in the body
        lines = content.splitlines()
        body_lines = [l for l in lines if not l.startswith("**") or len(l) > 60]
        words = len(" ".join(body_lines).split())
        return report_id, words
    except Exception:
        return report_id, 0


def score(r):
    s = 0
    bounty = r.get("bounty") or 0
    s += min(bounty / 50, 60)
    s += (r.get("votes") or 0) * 3
    severity = (r.get("severity") or "").lower()
    s += {"critical": 30, "high": 20, "medium": 10}.get(severity, 0)
    return round(s, 1)


def is_beginner_friendly(r):
    weakness = (r.get("weakness") or "").lower()
    return any(kw in weakness for kw in BEGINNER_KEYWORDS)


def detail_label(words):
    if words == 0:
        return "  ?"
    if words < 200:
        return " ░░"   # sparse
    if words < 500:
        return " ▒▒"   # medium
    if words < 1000:
        return " ▓▓"   # good
    return " ██"       # detailed


def main():
    parser = argparse.ArgumentParser(description="Curate HackerOne reports for walkthroughs")
    parser.add_argument("--min-bounty", type=float, default=300, metavar="USD")
    parser.add_argument("--min-votes", type=int, default=5)
    parser.add_argument("--severity", nargs="+", default=["high", "critical"],
                        choices=["low", "medium", "high", "critical"])
    parser.add_argument("--top", type=int, default=50)
    parser.add_argument("--beginner-only", action="store_true")
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--check-detail", action="store_true",
                        help="Fetch report content and show word count (slower, uses threads)")
    args = parser.parse_args()

    reports = fetch_index(force=args.refresh)

    filtered = []
    for r in reports:
        if r.get("substate") != "resolved":
            continue
        if not r.get("bounty") or r["bounty"] < args.min_bounty:
            continue
        if (r.get("severity") or "").lower() not in args.severity:
            continue
        if not r.get("weakness"):
            continue
        if (r.get("votes") or 0) < args.min_votes:
            continue
        if args.beginner_only and not is_beginner_friendly(r):
            continue
        filtered.append({**r, "_score": score(r), "_beginner": is_beginner_friendly(r)})

    filtered.sort(key=lambda r: (not r["_beginner"], -r["_score"]))
    top = filtered[: args.top]

    word_counts = {}
    if args.check_detail:
        print(f"Fetching content for top {len(top)} reports...", file=sys.stderr)
        with ThreadPoolExecutor(max_workers=15) as ex:
            futures = {ex.submit(fetch_word_count, r["id"]): r["id"] for r in top}
            done = 0
            for fut in as_completed(futures):
                rid, wc = fut.result()
                word_counts[rid] = wc
                done += 1
                print(f"\r  {done}/{len(top)}", end="", file=sys.stderr)
        print(file=sys.stderr)
        # Re-sort: combine quality score + detail (words capped at 1000)
        for r in top:
            wc = word_counts.get(r["id"], 0)
            r["_words"] = wc
            r["_final"] = r["_score"] + min(wc / 20, 50)
        top.sort(key=lambda r: (not r["_beginner"], -r["_final"]))

    if args.check_detail:
        header = f"{'':1}{'ID':<10} {'Sev':<9} {'Bounty':>8} {'Votes':>5} {'Detail':<6}  {'Weakness':<35} Title"
    else:
        header = f"{'':1}{'ID':<10} {'Severity':<10} {'Bounty':>8} {'Votes':>5}  {'Weakness':<38} Title"
    print(header)
    print("─" * 130)

    for r in top:
        bf = "★" if r["_beginner"] else " "
        weakness = (r.get("weakness") or "")[:33]
        title = (r.get("title") or "")[:52]
        bounty = f"${r['bounty']:,.0f}" if r.get("bounty") else "-"
        severity = (r.get("severity") or "")[:8]
        if args.check_detail:
            wc = word_counts.get(r["id"], 0)
            detail = detail_label(wc)
            wc_str = f"{wc:>5}w" if wc else "    ?"
            print(f"{bf} {r['id']:<9} {severity:<9} {bounty:>8} {r['votes']:>5} {detail} {wc_str}  {weakness:<35} {title}")
        else:
            print(f"{bf} {r['id']:<9} {severity:<10} {bounty:>8} {r['votes']:>5}  {weakness:<38} {title}")

    print(f"\n★ = beginner-friendly  |  detail: ░░ sparse  ▒▒ ok  ▓▓ good  ██ detailed")
    print(f"{len(filtered)} total candidates  |  showing top {len(top)}")
    print(f"\nTo create a walkthrough: python scripts/new_walkthrough.py <ID>")


if __name__ == "__main__":
    main()
