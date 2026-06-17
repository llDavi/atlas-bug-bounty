"""In-memory per-key rate limiting.

Single-process only — fine for this app's current single-instance Render
deployment. If it ever scales to multiple workers/replicas, this state needs
to move to a shared store (e.g. Redis) instead, since each process would
otherwise keep its own independent counters.
"""

import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

_lock = threading.Lock()
_hits: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check(key: str, max_requests: int, window_seconds: int) -> None:
    """Raise 429 if `key` has exceeded `max_requests` within `window_seconds`."""
    now = time.time()
    cutoff = now - window_seconds
    with _lock:
        hits = _hits[key]
        while hits and hits[0] < cutoff:
            hits.pop(0)
        if len(hits) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please try again later",
            )
        hits.append(now)


def by_ip(max_requests: int, window_seconds: int):
    """FastAPI dependency factory: limit requests per client IP."""

    def _dep(request: Request):
        check(f"ip:{_client_ip(request)}", max_requests, window_seconds)

    return _dep
