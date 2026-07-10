import threading
import time
from concurrent.futures import ThreadPoolExecutor

from . import bugcrowd, hackerone, immunefi, intigriti, sherlock, yeswehack

FETCHERS = [yeswehack, immunefi, sherlock, bugcrowd, hackerone, intigriti]
CACHE_TTL_SECONDS = 60 * 60  # 1 hour

_cache = {"programs": [], "fetched_at": 0}
_fetch_lock = threading.Lock()


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
    # Always serve whatever is cached, even if stale, instead of blocking on
    # a fresh fetch: HackerOne alone can take several minutes once it's
    # respecting rate limits properly, and no request should hang that long.
    # Freshness is entirely the job of _warm_cache (boot) and
    # _background_refresh_loop (periodic), which run off the request path.
    return _cache["programs"]


def _warm_cache():
    """Populate the cache as soon as the process boots, so the first real
    request doesn't have to block on a synchronous multi-platform fetch."""
    try:
        with _fetch_lock:
            programs = _fetch_all()
            if programs:
                _cache["programs"] = programs
                _cache["fetched_at"] = time.time()
    except Exception as exc:
        print(f"[aggregator] initial warm-up failed: {exc}")


def _background_refresh_loop():
    """Refresh well ahead of expiry: a full fetch can take 10+ minutes now that
    HackerOne properly backs off on rate limits, so the lead time needs to
    comfortably exceed that instead of the old 2-minute buffer."""
    while True:
        time.sleep(60)
        now = time.time()
        age = now - _cache["fetched_at"]
        if _cache["programs"] and age > CACHE_TTL_SECONDS - 900:
            try:
                with _fetch_lock:
                    programs = _fetch_all()
                    if programs:
                        _cache["programs"] = programs
                        _cache["fetched_at"] = time.time()
            except Exception as exc:
                print(f"[aggregator] background refresh failed: {exc}")


threading.Thread(target=_warm_cache, daemon=True).start()
threading.Thread(target=_background_refresh_loop, daemon=True).start()
