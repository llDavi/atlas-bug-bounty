#!/usr/bin/env python3
"""
Creates a new walkthrough .md template from a HackerOne report ID.
Pre-populates frontmatter from index.json and fetches the original
report content as a reference section at the bottom.

Usage:
    python scripts/new_walkthrough.py <report_id>

Example:
    python scripts/new_walkthrough.py 1000117
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

INDEX_URL = "https://raw.githubusercontent.com/ajaysenr/HackerOne-Disclosed-Reports/main/index.json"
REPORT_URL = "https://raw.githubusercontent.com/ajaysenr/HackerOne-Disclosed-Reports/main/reports/{id}.md"
CACHE_FILE = Path("/tmp/h1_index.json")
OUTPUT_DIR = Path(__file__).parent.parent / "backend" / "walkthroughs"

SEVERITY_TO_DIFFICULTY = {
    "critical": "hard",
    "high": "medium",
    "medium": "easy",
    "low": "easy",
}


def fetch_index():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    print("Fetching index.json from GitHub...", file=sys.stderr)
    with urllib.request.urlopen(INDEX_URL, timeout=30) as r:
        data = json.load(r)
    CACHE_FILE.write_text(json.dumps(data))
    return data


def fetch_report_content(report_id):
    url = REPORT_URL.format(id=report_id)
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return r.read().decode("utf-8")
    except Exception as e:
        return f"(Could not fetch report content: {e})"


def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


def clean_weakness(weakness):
    """'Improper Access Control (CWE-284)' → 'Improper Access Control'"""
    return re.sub(r"\s*\(CWE-\d+\)\s*$", "", weakness).strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/new_walkthrough.py <report_id>")
        sys.exit(1)

    try:
        report_id = int(sys.argv[1])
    except ValueError:
        print(f"Invalid report ID: {sys.argv[1]}")
        sys.exit(1)

    index = fetch_index()
    report = next((r for r in index if r["id"] == report_id), None)
    if not report:
        print(f"Report {report_id} not found in index. Try --refresh in curate.py.")
        sys.exit(1)

    title = report.get("title") or f"HackerOne Report {report_id}"
    slug = slugify(title)
    difficulty = SEVERITY_TO_DIFFICULTY.get((report.get("severity") or "").lower(), "medium")
    weakness_raw = report.get("weakness") or "Unknown"
    vuln_class = clean_weakness(weakness_raw)
    bounty = report.get("bounty") or 0
    program = report.get("program") or "Unknown Program"
    reporter = report.get("reporter") or "anonymous"
    disclosed_at = (report.get("disclosed_at") or "")[:10]
    source_url = report.get("url") or f"https://hackerone.com/reports/{report_id}"
    severity = (report.get("severity") or "unknown").lower()
    cvss = report.get("cvss") or ""
    votes = report.get("votes") or 0

    output_path = OUTPUT_DIR / f"{slug}.md"
    if output_path.exists():
        print(f"File already exists: {output_path}")
        print("Delete it first or choose a different report.")
        sys.exit(1)

    print(f"Fetching original report content...", file=sys.stderr)
    raw_content = fetch_report_content(report_id)

    template = f"""---
title: "{title}"
slug: "{slug}"
platform: "hackerone"
vuln_class: "{vuln_class}"
difficulty: "{difficulty}"
scope_type: "web"
bounty: {int(bounty)}
program: "{program}"
reporter: "{reporter}"
published_at: "{disclosed_at}"
source_url: "{source_url}"
tags: []
teaser: "TODO: one sentence that captures what made this bug interesting and what a reader will learn."
---

## The Program

TODO: Describe the target — what does the company build, what's in scope, why is it a good target?
What drew you to this program specifically?

---

## The Recon

TODO: Walk through the recon phase step by step.
What did you map out first? What tools did you use (Burp, subfinder, ffuf, manual browsing)?
What patterns did you notice in the app's behavior?

---

## The "Wait a Second..." Moment

TODO: Describe the exact observation that made you think something was wrong.
What were you looking at? What didn't add up?

---

## The Exploit

TODO: Reproduce the bug step by step — specific enough that a beginner can follow.
Include HTTP requests, payloads, or code snippets where relevant.
What does a successful exploitation look like?

---

## The Report

TODO: Show the structure of a good report for this vuln type.
Include: title, severity justification, step-by-step reproduction, impact statement.
What made the triager accept it quickly?

---

## The Takeaway

TODO: One-sentence core insight. How to spot this class of bug elsewhere.
What to look for, what tools help, common variants to test.

---
<!--
ORIGINAL REPORT — reference only, not rendered
Source: {source_url}
Severity: {severity} | CVSS: {cvss} | Bounty: ${int(bounty):,} | Votes: {votes}

{raw_content}
-->
"""

    output_path.write_text(template)
    print(f"\n✓ Created: {output_path}")
    print(f"  Title:    {title}")
    print(f"  Program:  {program}")
    print(f"  Severity: {severity} → difficulty: {difficulty}")
    print(f"  Bounty:   ${int(bounty):,}")
    print(f"  Source:   {source_url}")
    print(f"\nNow write the 6 sections and replace the TODOs.")


if __name__ == "__main__":
    main()
