"""Data models shared between resolver, filesystem and API client.

Note
----
The fileTree in MongoDB has **arbitrary depth** – a virtual path like
``/fairspace/DS001/V1/SADR_submission/calibration_202405/snow.nc`` may
have any number of intermediate directory segments between the dataset
ID and the actual file name.

The resolver is a pure string parser – it extracts :attr:`dataset_id`
and the remaining :attr:`segments` but it **cannot tell whether the
final segment is a file or a subdirectory** (that requires walking the
MongoDB fileTree).  The FUSE layer consults :class:`MetadataClient`
(which in turn uses :mod:`tree_walker`) to make the final classification.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class PathRole(str, Enum):
    """High-level role of a virtual path (best-effort from strings only).

    ``ROOT`` and ``DATASET_DIR`` are known *without* touching the DB.
    Anything deeper is labelled ``DEEP`` – the caller must verify
    against the fileTree before deciding whether it's a nested
    subdirectory or an actual file.
    """

    ROOT = "root"                  # /fairspace
    DATASET_DIR = "dataset_dir"    # /fairspace/{datasetId}
    DEEP = "deep"                  # /fairspace/{datasetId}/{*segments}


@dataclass(frozen=True)
class ParsedPath:
    """Result of parsing a virtual POSIX path against ``VIRTUAL_ROOT``."""

    raw_path: str
    role: PathRole
    dataset_id: Optional[str] = None
    # Everything after datasetId (may be empty for DATASET_DIR)
    segments: List[str] = field(default_factory=list)

    # ── Convenience predicates ─────────────────────────────────────

    def is_root(self) -> bool:
        return self.role is PathRole.ROOT

    def is_dataset_dir(self) -> bool:
        return self.role is PathRole.DATASET_DIR


# ── Metadata API response models ──────────────────────────────────────

@dataclass(frozen=True)
class DatasetInfo:
    """Lightweight dataset listing entry."""

    dataset_id: str
    name: str = ""


@dataclass(frozen=True)
class FileInfo:
    """Lightweight child-entry (file *or* subdirectory) inside a path."""

    name: str
    is_dir: bool  # True = subdirectory, False = leaf file


@dataclass(frozen=True)
class ResolvedFile:
    """Result of a virtual-file → real-path lookup."""

    virtual_path: str
    real_path: str
