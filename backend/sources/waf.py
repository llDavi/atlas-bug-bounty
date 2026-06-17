"""Lightweight WAF/CDN fingerprinting from HTTP response headers.

This is a fast, best-effort substitute for a full wafw00f scan: a single
GET request per domain, classified by response headers/cookies. It's run
concurrently across all domains with a small concurrency cap so it stays
cheap even for a few hundred programs.
"""

import asyncio
import re

import httpx

CONCURRENCY = 15
TIMEOUT = 4.0

# Scope strings in the wild are often free-text ("80|*.post.ch:443) AND
# 194.41...", "www.unibet.(com|it|se|...)", product names, etc.), not clean
# hostnames. Only attempt a WAF probe for things that look like a real domain.
_HOSTNAME_RE = re.compile(r"^[a-z0-9]([a-z0-9-]{0,62}\.)+[a-z]{2,}$", re.IGNORECASE)


def _classify(resp):
    headers = {k.lower(): v.lower() for k, v in resp.headers.items()}
    server = headers.get("server", "")
    set_cookie = headers.get("set-cookie", "")

    if "cf-ray" in headers or "cloudflare" in server:
        return "cloudflare"
    if "akamaighost" in server or "x-akamai-transformed" in headers:
        return "akamai"
    if "x-iinfo" in headers or "incap_ses" in set_cookie or "visid_incap" in set_cookie:
        return "imperva"
    if "x-sucuri-id" in headers or "x-sucuri-cache" in headers:
        return "other"
    return "none"


def _domain_for(asset_identifier):
    domain = asset_identifier.strip().lstrip("*.")
    if "/" in domain:
        domain = domain.split("/")[0]
    return domain


async def _detect_one(client, sem, domain):
    if not _HOSTNAME_RE.match(domain):
        return "unknown"

    async with sem:
        for scheme in ("https", "http"):
            try:
                resp = await client.get(f"{scheme}://{domain}", timeout=TIMEOUT, follow_redirects=True)
                return _classify(resp)
            except (httpx.HTTPError, ValueError):
                continue
    return "unknown"


async def detect_many(domains):
    """domains: iterable of asset identifiers (may include wildcards like '*.example.com').

    Returns dict {original_identifier: waf_result}.
    """
    sem = asyncio.Semaphore(CONCURRENCY)
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AltasBountyRadar/1.0)"}

    async with httpx.AsyncClient(headers=headers) as client:
        tasks = {
            identifier: asyncio.create_task(_detect_one(client, sem, _domain_for(identifier)))
            for identifier in domains
        }
        results = {}
        for identifier, task in tasks.items():
            results[identifier] = await task

    return results


def detect_many_sync(domains):
    return asyncio.run(detect_many(domains))
