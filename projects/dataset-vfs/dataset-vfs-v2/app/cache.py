"""LRU + TTL in-memory cache.

This is a tiny, dependency-free hybrid cache used by the metadata API
client to keep hot virtualPath -> realPath mappings and directory
listings for a configurable amount of time without growing unbounded.

The implementation is intentionally simple so it can be unit-tested
standalone and later swapped for Redis / an in-process DB.
"""

from __future__ import annotations

import threading
import time
from collections import OrderedDict
from typing import Any, Optional


class LRUCache:
    """Thread-safe LRU cache with per-entry TTL support.

    Keys that have lived longer than ``ttl`` seconds are considered stale
    and are returned only when no fresh value exists.  Background
    pruning is triggered on every write so the cache never silently
    accumulates expired entries.

    Parameters
    ----------
    max_size:
        Maximum number of entries.  Oldest (LRU) entries are evicted when
        this limit is exceeded.
    ttl:
        Time-to-live in seconds.  A value of ``0`` disables expiration.
    """

    def __init__(self, max_size: int = 10_000, ttl: int = 60) -> None:
        if max_size <= 0:
            raise ValueError("max_size must be positive")
        if ttl < 0:
            raise ValueError("ttl must be >= 0")

        self._max_size = max_size
        self._ttl = ttl
        self._store: "OrderedDict[Any, tuple[Any, float]]" = OrderedDict()
        self._lock = threading.RLock()

    # ── Public API ──────────────────────────────────────────────────

    def get(self, key: Any) -> Optional[Any]:
        """Return a fresh value for ``key`` or ``None`` if missing/stale."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, ts = entry
            if self._is_expired(ts):
                self._store.pop(key, None)
                return None
            # Move to end → most-recently-used
            self._store.move_to_end(key)
            return value

    def put(self, key: Any, value: Any) -> None:
        """Store ``value`` under ``key``, evicting LRU entries as needed."""
        with self._lock:
            # Free some slots by dropping expired entries first
            self._prune_expired()

            if key in self._store:
                self._store.move_to_end(key)
            self._store[key] = (value, time.monotonic())

            # Hard-limit enforcement
            while len(self._store) > self._max_size:
                self._store.popitem(last=False)  # drop LRU

    def delete(self, key: Any) -> None:
        """Remove ``key`` from the cache if present."""
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        """Remove every entry."""
        with self._lock:
            self._store.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._store)

    def __contains__(self, key: Any) -> bool:
        return self.get(key) is not None

    # ── Internal helpers ────────────────────────────────────────────

    def _is_expired(self, timestamp: float) -> bool:
        if self._ttl == 0:
            return False
        return (time.monotonic() - timestamp) > self._ttl

    def _prune_expired(self) -> None:
        """Drop every entry whose TTL has elapsed (O(n) scan, cached size ≪ max)."""
        if self._ttl == 0:
            return
        now = time.monotonic()
        expired = [
            k for k, (_v, ts) in self._store.items()
            if (now - ts) > self._ttl
        ]
        for k in expired:
            del self._store[k]
