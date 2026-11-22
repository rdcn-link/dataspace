"""Configuration for dataset-vfs-v2.

All settings are loaded from environment variables with sensible defaults.
MongoDB is the single source of truth for metadata – no REST API layer.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""

    # ── MongoDB connection ─────────────────────────────────────────────
    MONGO_URI: str
    MONGO_DB: str
    MONGO_COLLECTION: str
    MONGO_CONNECT_TIMEOUT_MS: int
    MONGO_SOCKET_TIMEOUT_MS: int
    MONGO_MAX_POOL_SIZE: int

    # ── Mount point ───────────────────────────────────────────────────
    MOUNT_POINT: str
    VIRTUAL_ROOT: str  # e.g. "/fairspace"

    # ── Cache ─────────────────────────────────────────────────────────
    CACHE_TTL_SECONDS: int
    CACHE_MAX_SIZE: int  # max entries per cache instance

    @classmethod
    def from_env(cls) -> "Settings":
        """Create Settings from environment variables with defaults."""
        return cls(
            MONGO_URI=os.environ.get(
                "MONGO_URI",
                "REPLACE_WITH_EXTERNAL_CONFIG",
            ),
            MONGO_DB=os.environ.get("MONGO_DB", "tds"),
            MONGO_COLLECTION=os.environ.get(
                "MONGO_COLLECTION", "scidb_dataseek_filePath"
            ),
            MONGO_CONNECT_TIMEOUT_MS=int(
                os.environ.get("MONGO_CONNECT_TIMEOUT_MS", "5000")
            ),
            MONGO_SOCKET_TIMEOUT_MS=int(
                os.environ.get("MONGO_SOCKET_TIMEOUT_MS", "10000")
            ),
            MONGO_MAX_POOL_SIZE=int(
                os.environ.get("MONGO_MAX_POOL_SIZE", "50")
            ),
            MOUNT_POINT=os.environ.get("MOUNT_POINT", "/mnt/fairspace"),
            VIRTUAL_ROOT=os.environ.get("VIRTUAL_ROOT", "/fairspace"),
            CACHE_TTL_SECONDS=int(os.environ.get("CACHE_TTL_SECONDS", "60")),
            CACHE_MAX_SIZE=int(os.environ.get("CACHE_MAX_SIZE", "10000")),
        )


# ── Helpers ────────────────────────────────────────────────────────────

def ensure_mount_point(path: str) -> None:
    """Create the mount point directory if it does not exist."""
    Path(path).mkdir(parents=True, exist_ok=True)
