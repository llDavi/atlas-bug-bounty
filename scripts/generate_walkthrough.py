#!/usr/bin/env python3
"""
Generates walkthrough .md files from HackerOne reports using the Claude CLI.
No API key needed — uses your existing Claude Code subscription.

Usage:
    python scripts/generate_walkthrough.py 689314           # single
    python scripts/generate_walkthrough.py 689314 826361    # batch
    python scripts/generate_walkthrough.py --all            # all 15 targets
    python scripts/generate_walkthrough.py --all --force    # overwrite existing
"""
import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

INDEX_URL = "https://raw.githubusercontent.com/ajaysenr/HackerOne-Disclosed-Reports/main/index.json"
REPORT_URL = "https://raw.githubusercontent.com/ajaysenr/HackerOne-Disclosed-Reports/main/reports/{id}.md"
CACHE_FILE = Path("/tmp/h1_index.json")
OUTPUT_DIR = Path(__file__).parent.parent / "backend" / "walkthroughs"

TARGET_IDS = [
    689314, 273946, 2107680, 1212067, 1731349,
    1439593, 826361, 894569, 265943, 976603,
    850447, 827052, 1819832, 2122671, 1295844,
]

SEVERITY_TO_DIFFICULTY = {
    "critical": "hard",
    "high": "medium",
    "medium": "easy",
    "low": "easy",
}


def fetch_index():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    print("Fetching index.json...", file=sys.stderr)
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
        return f"(Report content unavailable: {e})"


def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


def clean_weakness(weakness):
    return re.sub(r"\s*\(CWE-\d+\)\s*$", "", weakness).strip()


def call_claude(prompt, timeout=180):
    # report_content embedded in the prompt comes from a third-party GitHub
    # mirror, not from HackerOne directly — treat it as untrusted. --tools ""
    # disables all tool use so a prompt injection in that content can at worst
    # produce bad output text, never trigger a file/shell/network action.
    result = subprocess.run(
        ["claude", "-p", "--tools", "", "--", prompt],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI error: {result.stderr[:300]}")
    return result.stdout.strip()


def generate_body(report, report_content):
    severity = (report.get("severity") or "unknown").lower()
    bounty = int(report.get("bounty") or 0)
    weakness = clean_weakness(report.get("weakness") or "Unknown")
    source_url = report.get("url") or f"https://hackerone.com/reports/{report['id']}"
    title = report.get("title") or ""
    program = report.get("program") or ""
    reporter = report.get("reporter") or ""

    prompt = f"""You are an expert bug bounty hunter writing educational walkthroughs for beginners.

Below is a real disclosed HackerOne report. Rewrite it as a step-by-step educational walkthrough.
Your audience has never submitted a bug bounty before.

ORIGINAL REPORT:
{report_content}

METADATA:
- Title: {title}
- Program: {program}
- Vulnerability class: {weakness}
- Severity: {severity} | Bounty: ${bounty:,}
- Reporter: {reporter}
- Source: {source_url}

Write EXACTLY these 6 sections with these EXACT headers (keep ## and ---):

## The Program

2-3 paragraphs about the company, their bug bounty program, and why this functionality was worth investigating. End with what specifically made this attack surface notable.

---

## The Recon

2-4 paragraphs walking through recon step by step. Be specific: mention URL patterns, parameter names, tools used (Burp Suite, browser devtools, etc.). What got mapped out and what patterns emerged.

---

## The "Wait a Second..." Moment

1-2 paragraphs describing the exact moment the vulnerability became obvious. What was on screen, what seemed wrong, why it mattered.

---

## The Exploit

Step-by-step exploitation, specific enough for a beginner to follow. Include HTTP requests or payloads from the report if available. What successful exploitation looks like.

---

## The Report

How to write a good report for this bug: title, severity justification, reproduction steps, impact statement. What makes a triager accept it quickly?

---

## The Takeaway

The one-sentence core insight. How to find similar bugs elsewhere. What tools help, what to look for, common variants.

---

RULES:
- Only use facts present in the original report. If sparse, draw on general knowledge of the vuln class.
- Do NOT include YAML frontmatter.
- Do NOT add anything before ## The Program or after the last paragraph.
- Minimum 150 words per section.
- VOICE: write in an impersonal, neutral technical register. Never use "I", "my", "we", or "you".
  Describe actions and observations directly — e.g. "The export request triggered a server-side fetch...",
  "Testing the parameter with an internal IP revealed...", "The fix should enforce...".
  Favor passive/agentless constructions over a narrator. Read like a polished technical case study,
  not a first-person blog post."""

    return call_claude(prompt)


def generate_teaser(title, body_preview):
    prompt = (
        f"Write ONE sentence (max 20 words) teaser for a bug bounty walkthrough titled: "
        f"'{title}'. Capture what made the bug interesting. No quotes. Just the sentence."
    )
    return call_claude(prompt, timeout=30)


def build_frontmatter(report, teaser=""):
    title = report.get("title") or f"HackerOne Report {report['id']}"
    slug = slugify(title)
    difficulty = SEVERITY_TO_DIFFICULTY.get((report.get("severity") or "").lower(), "medium")
    vuln_class = clean_weakness(report.get("weakness") or "Unknown")
    bounty = int(report.get("bounty") or 0)
    program = report.get("program") or "Unknown Program"
    reporter = report.get("reporter") or "anonymous"
    disclosed_at = (report.get("disclosed_at") or "")[:10]
    source_url = report.get("url") or f"https://hackerone.com/reports/{report['id']}"
    teaser_safe = teaser.replace('"', "'")

    return slug, f"""---
title: "{title}"
slug: "{slug}"
platform: "hackerone"
vuln_class: "{vuln_class}"
difficulty: "{difficulty}"
scope_type: "web"
bounty: {bounty}
program: "{program}"
reporter: "{reporter}"
published_at: "{disclosed_at}"
source_url: "{source_url}"
tags: []
teaser: "{teaser_safe}"
---
"""


def process_report(report_id, index, force=False):
    report = next((r for r in index if r["id"] == report_id), None)
    if not report:
        print(f"  [!] Report {report_id} not found in index")
        return False

    title = report.get("title") or f"HackerOne Report {report_id}"
    slug = slugify(title)
    output_path = OUTPUT_DIR / f"{slug}.md"

    if output_path.exists() and not force:
        print(f"  [skip] {output_path.name} already exists (use --force to overwrite)")
        return False

    print(f"  Fetching report content...")
    report_content = fetch_report_content(report_id)

    print(f"  Generating walkthrough (this takes ~30-60s)...")
    try:
        body = generate_body(report, report_content)
    except subprocess.TimeoutExpired:
        print(f"  [!] Timed out on {report_id}, skipping")
        return False
    except RuntimeError as e:
        print(f"  [!] {e}")
        return False

    print(f"  Generating teaser...")
    try:
        teaser = generate_teaser(title, body[:500])
    except Exception:
        teaser = ""

    slug, frontmatter = build_frontmatter(report, teaser)
    output_path.write_text(frontmatter + "\n" + body + "\n")
    print(f"  ✓ Saved: {output_path.name}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate walkthroughs using Claude CLI")
    parser.add_argument("ids", nargs="*", type=int, help="HackerOne report IDs")
    parser.add_argument("--all", action="store_true", help="Generate all 15 target walkthroughs")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    ids = TARGET_IDS if args.all else args.ids
    if not ids:
        parser.print_help()
        sys.exit(1)

    index = fetch_index()

    print(f"Generating {len(ids)} walkthrough(s) using Claude CLI...\n")
    ok = 0
    for i, report_id in enumerate(ids, 1):
        report = next((r for r in index if r["id"] == report_id), None)
        title = (report.get("title") or str(report_id))[:65] if report else str(report_id)
        print(f"[{i}/{len(ids)}] #{report_id} — {title}")
        success = process_report(report_id, index, force=args.force)
        if success:
            ok += 1
        if i < len(ids):
            time.sleep(2)

    print(f"\nDone: {ok}/{len(ids)} walkthroughs generated → {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
