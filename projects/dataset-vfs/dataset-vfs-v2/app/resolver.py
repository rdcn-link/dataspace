"""Virtual path parser – pure string operations, no DB access.

**Important** – fusepy hands us paths **relative to the mountpoint**.
If the FUSE mount point is ``/mnt/fairspace`` and we open
``/mnt/fairspace/d9a3.../V1/file.csv``, fusepy delivers to our
Operations class the stripped path ``/d9a3.../V1/file.csv``.  It never
includes the mountpoint prefix – and crucially, it also does **not**
include our configurable ``VIRTUAL_ROOT`` (``/fairspace``).

So :meth:`parse` accepts paths in **two equivalent forms**:

* ``/dsId/V1/segments/file.csv``   ← what fusepy actually sends
* ``/fairspace/dsId/V1/segments/file.csv``   ← what DataSeek thinks
  it is (and what our earlier smoke tests used)

Both produce the same :class:`ParsedPath`.
"""

from __future__ import annotations

import logging
from typing import List

from .models import ParsedPath, PathRole

logger = logging.getLogger(__name__)


class PathResolver:
    """Parses virtual paths against a configurable ``virtual_root``.

    Parameters
    ----------
    virtual_root:
        The "virtual" root that appears in user-facing paths, e.g.
        ``"/fairspace"``.  Must start with ``/`` and must not have a
        trailing slash.  **This is NOT the FUSE mountpoint** – the
        FUSE mountpoint is configured separately and is typically a
        real filesystem path like ``"/mnt/fairspace"``.
    """

    def __init__(self, virtual_root: str = "/fairspace") -> None:
        if not virtual_root.startswith("/"):
            raise ValueError("virtual_root must be an absolute POSIX path")
        if virtual_root.endswith("/") and len(virtual_root) > 1:
            virtual_root = virtual_root.rstrip("/")
        self._virtual_root = virtual_root
        self._root_parts = [p for p in virtual_root.split("/") if p]

    @property
    def virtual_root(self) -> str:
        return self._virtual_root

    # ── Public API ──────────────────────────────────────────────────

    def parse(self, path: str) -> ParsedPath:
        """Classify ``path`` and extract the dataset ID + segments.

        Accepts both fusepy-native paths (no prefix) and user-facing
        paths (with ``virtual_root`` prefix).
        """
        # Normalise – strip trailing slash (but keep absolute form)
        if path != "/" and path.endswith("/"):
            path = path.rstrip("/")

        parts = [p for p in path.split("/") if p]
        root_parts = self._root_parts

        # ── Case A: path carries the virtual_root prefix ──
        # e.g. "/fairspace/dsId/V1/file"
        if len(parts) >= len(root_parts) and parts[: len(root_parts)] == root_parts:
            tail = parts[len(root_parts) :]

            if len(tail) == 0:
                # "/fairspace"  → ROOT (the virtual root itself)
                return ParsedPath(raw_path=path, role=PathRole.ROOT)

            dataset_id = tail[0]
            segments: List[str] = list(tail[1:])

            if not segments:
                return ParsedPath(
                    raw_path=path,
                    role=PathRole.DATASET_DIR,
                    dataset_id=dataset_id,
                    segments=[],
                )

            return ParsedPath(
                raw_path=path,
                role=PathRole.DEEP,
                dataset_id=dataset_id,
                segments=segments,
            )

        # ── Case B: relative path from fusepy (no virtual_root prefix) ──
        # e.g. "/" (mountpoint itself), "/dsId", "/dsId/V1/file"
        #
        # Here the path IS the virtual-root-scoped tree – "/" means
        # virtual root, "/dsId" means that dataset, etc.
        if len(parts) == 0:
            return ParsedPath(raw_path=path, role=PathRole.ROOT)

        dataset_id = parts[0]
        segments = list(parts[1:])

        if not segments:
            return ParsedPath(
                raw_path=path,
                role=PathRole.DATASET_DIR,
                dataset_id=dataset_id,
                segments=[],
            )

        return ParsedPath(
            raw_path=path,
            role=PathRole.DEEP,
            dataset_id=dataset_id,
            segments=segments,
        )
