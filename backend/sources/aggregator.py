import threading
import time
from concurrent.futures import ThreadPoolExecutor

from . import bugcrowd, hackerone, immunefi, intigriti, sherlock, yeswehack

FETCHERS = [yeswehack, immunefi, sherlock, bugcrowd, hackerone, intigriti]
CACHE_TTL_SECONDS = 60 * 60  # 1 hour

_cache = {"programs": [], "fetched_at": 0}


def _fetch_all():
    programs = []

    # hackerone/yeswehack/intigriti each make many extra requests to compute
    # the rubric score, so run all fetchers in parallel rather than summing
    # their wall-clock times.
    with ThreadPoolExecutor(max_workers=len(FETCHERS)) as pool:
        futures = {pool.submit(fetcher.fetch): fetcher for fetcher in FETCHERS}
        for future, fetcher in futures.items():
            try:
                programs.extend(future.result())
            except Exception as exc:
                print(f"[aggregator] {fetcher.__name__} failed: {exc}")

    for next_id, program in enumerate(programs, start=1):
        program["id"] = next_id

    return programs


def get_programs():
    now = time.time()
    if not _cache["programs"] or now - _cache["fetched_at"] > CACHE_TTL_SECONDS:
        programs = _fetch_all()
        if programs:
            _cache["programs"] = programs
            _cache["fetched_at"] = now

    return _cache["programs"]


def _background_refresh_loop():
    """Pre-warm the cache 2 minutes before expiry so no request ever blocks on a cold fetch."""
    while True:
        time.sleep(60)
        now = time.time()
        age = now - _cache["fetched_at"]
        if _cache["programs"] and age > CACHE_TTL_SECONDS - 120:
            try:
                programs = _fetch_all()
                if programs:
                    _cache["programs"] = programs
                    _cache["fetched_at"] = time.time()
            except Exception as exc:
                print(f"[aggregator] background refresh failed: {exc}")


threading.Thread(target=_background_refresh_loop, daemon=True).start()
