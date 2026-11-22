"""FUSE filesystem for dataset-vfs-v2 – arbitrary-depth virtual paths.

Layout
------
/ fairspace
│
├─ <datasetIdA>               ← dataset directory (virtual root of one dataset)
│  ├─ V1                      ← nested intermediate directory
│  │   ├─ SADR_submission     ← nested intermediate directory
│  │   │   ├─ calibration_202405/
│  │   │   ├─ test_2025/
│  │   │   └─ 数据说明．txt    ← leaf file
│  │   └─ ...
│  └─ ...
├─ <datasetIdB>
└─ ...

The ``fileTree`` in MongoDB is traversed lazily – we load the whole
document once per dataset (cached in-process) and walk it in memory
via :mod:`tree_walker`.  The FUSE layer never queries more than one
document at a time.

Error path
----------
* ROOT outside /fairspace → ENOENT
* Dataset missing from Mongo → ENOENT
* Segment path doesn't exist in fileTree → ENOENT
* Leaf file that resolves in Mongo but missing on disk → ENOENT (with a warning log)
* All write operations → EPERM (filesystem is read-only at kernel level too)
"""

from __future__ import annotations

import errno
import logging
import os
import stat
import threading
from typing import Any, Dict, List, Optional

from fuse import FUSE, FuseOSError, Operations  # type: ignore

from .api_client import MetadataClient
from .config import Settings
from .models import PathRole
from .resolver import PathResolver

logger = logging.getLogger(__name__)


class DatasetVFS(Operations):  # type: ignore[misc]
    """Read-only FUSE filesystem backed by MongoDB + tree_walker."""

    def __init__(
        self,
        settings: Settings,
        resolver: Optional[PathResolver] = None,
        client: Optional[MetadataClient] = None,
    ) -> None:
        self._settings = settings
        self.resolver = resolver or PathResolver(settings.VIRTUAL_ROOT)
        self.client = client or MetadataClient(settings)

        # Thread-safe file-handle table  (fh int → real os.open handle)
        self._handles: Dict[int, int] = {}
        self._next_fh = 1
        self._lock = threading.Lock()

    # ── Helpers ──────────────────────────────────────────────────────

    def _dir_stat(self) -> Dict[str, Any]:
        return {
            "st_mode": stat.S_IFDIR | 0o755,
            "st_nlink": 2,
            "st_size": 4096,
        }

    def _file_stat(self, real_path: str) -> Dict[str, Any]:
        try:
            st = os.stat(real_path)
        except FileNotFoundError:
            logger.warning("real file missing on disk: %s", real_path)
            raise FuseOSError(errno.ENOENT)
        except OSError as exc:
            raise FuseOSError(exc.errno or errno.ENOENT)
        return {
            "st_mode": stat.S_IFREG | 0o444,
            "st_nlink": 1,
            "st_size": st.st_size,
            "st_atime": st.st_atime,
            "st_mtime": st.st_mtime,
            "st_ctime": st.st_ctime,
        }

    # ── FUSE operations ────────────────────────────────────────────

    def getattr(self, path: str, fh: Optional[int] = None) -> Dict[str, Any]:  # noqa: D401
        parsed = self.resolver.parse(path)

        if parsed.is_root():
            # "/" (fusepy-native) or "/fairspace" (user-facing)
            return self._dir_stat()

        if parsed.is_dataset_dir():
            # Validate dataset exists in Mongo, then report as directory
            try:
                self.client._load_filetree(parsed.dataset_id)  # noqa: SLF001
            except FileNotFoundError:
                raise FuseOSError(errno.ENOENT)
            return self._dir_stat()

        # ── DEEP path: classify as FILE or INTERMEDIATE_DIR ─────────
        try:
            # Try leaf first – cheaper if that's the common case
            resolved = self.client.resolve(parsed.dataset_id, parsed.segments)  # type: ignore[arg-type]
            return self._file_stat(resolved.real_path)
        except FileNotFoundError:
            pass

        # Not a leaf – check if it's a reachable intermediate directory
        try:
            self.client.list_children(parsed.dataset_id, parsed.segments)  # type: ignore[arg-type]
            return self._dir_stat()
        except FileNotFoundError:
            raise FuseOSError(errno.ENOENT)

    def readdir(self, path: str, fh: int) -> List[str]:  # noqa: D401
        parsed = self.resolver.parse(path)

        if parsed.is_root():
            try:
                datasets = self.client.list_datasets()
            except Exception as exc:
                logger.warning("list_datasets failed: %s", exc)
                raise FuseOSError(errno.ENOENT)
            return [".", ".."] + [d.dataset_id for d in datasets]

        # Dataset dir OR intermediate nested dir – both use list_children
        segments: List[str] = list(parsed.segments)

        # Dataset dir (segments == []) but we still need to list children
        # list_children with empty segments gives top-level fileTree entries
        try:
            children = self.client.list_children(parsed.dataset_id, segments)  # type: ignore[arg-type]
        except FileNotFoundError:
            raise FuseOSError(errno.ENOENT)
        except Exception as exc:
            logger.warning("readdir(%s) failed: %s", path, exc)
            raise FuseOSError(errno.ENOENT)

        entries = [".", ".."] + [c.name for c in children]
        return entries

    def open(self, path: str, flags: int) -> int:  # noqa: D401
        parsed = self.resolver.parse(path)
        if parsed.is_root() or parsed.is_dataset_dir():
            raise FuseOSError(errno.EISDIR)
        if parsed.role is not PathRole.DEEP:
            raise FuseOSError(errno.ENOENT)

        # Must resolve a leaf file
        try:
            resolved = self.client.resolve(parsed.dataset_id, parsed.segments)  # type: ignore[arg-type]
        except FileNotFoundError:
            raise FuseOSError(errno.ENOENT)

        # Force read-only
        try:
            real_fh = os.open(resolved.real_path, os.O_RDONLY)
        except FileNotFoundError:
            logger.warning("real file missing: %s", resolved.real_path)
            raise FuseOSError(errno.ENOENT)
        except OSError as exc:
            raise FuseOSError(exc.errno or errno.EACCES)

        with self._lock:
            fh = self._next_fh
            self._next_fh += 1
            self._handles[fh] = real_fh

        logger.debug("open %s → %s (fh=%d)", path, resolved.real_path, fh)
        return fh

    def read(self, path: str, size: int, offset: int, fh: int) -> bytes:  # noqa: D401
        with self._lock:
            real_fh = self._handles.get(fh)
        if real_fh is None:
            raise FuseOSError(errno.EBADF)

        try:
            os.lseek(real_fh, offset, os.SEEK_SET)
            return os.read(real_fh, size)
        except OSError as exc:
            raise FuseOSError(exc.errno or errno.EACCES)

    def release(self, path: str, fh: int) -> None:  # noqa: D401
        with self._lock:
            real_fh = self._handles.pop(fh, None)
        if real_fh is None:
            logger.warning("release: unknown fh %d for %s", fh, path)
            return
        try:
            os.close(real_fh)
        except OSError:
            logger.exception("release: failed to close real fd for %s", path)

    # ── Write-path overrides (explicitly deny) ──────────────────────

    def create(self, path: str, mode: int, fi: Any = None) -> int:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def write(self, path: str, buf: bytes, offset: int, fh: int) -> int:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def unlink(self, path: str) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def mkdir(self, path: str, mode: int) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def rmdir(self, path: str) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def rename(self, src: str, dst: str) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def chmod(self, path: str, mode: int) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def utime(self, path: str, times: Any) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def truncate(self, path: str, size: int, fh: Optional[int] = None) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def mknod(self, path: str, mode: int, dev: int) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def link(self, target: str, source: str) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)

    def symlink(self, target: str, source: str) -> None:  # noqa: D401
        raise FuseOSError(errno.EPERM)


# ── Mount entry point ──────────────────────────────────────────────────

def mount_vfs(settings: Settings) -> None:
    """Create and mount the dataset virtual filesystem (blocking)."""
    from .config import ensure_mount_point

    ensure_mount_point(settings.MOUNT_POINT)

    vfs = DatasetVFS(settings)
    logger.info(
        "Mounting dataset-vfs-v2 at %s (mongo=%s/%s.%s)",
        settings.MOUNT_POINT,
        settings.MONGO_URI.split("@")[-1].split("?")[0]
        if "@" in settings.MONGO_URI
        else settings.MONGO_URI,
        settings.MONGO_DB,
        settings.MONGO_COLLECTION,
    )

    FUSE(
        vfs,
        settings.MOUNT_POINT,
        ro=True,
        nothreads=True,
        foreground=True,
        allow_other=True,
    )
