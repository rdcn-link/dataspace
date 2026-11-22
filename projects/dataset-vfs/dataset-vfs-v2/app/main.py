"""Entry point for dataset-vfs-v2 (MongoDB direct mode).

Usage:
    python -m app.main   # mount FUSE using env-var configuration
"""

from __future__ import annotations

import ctypes
import logging
import os
import sys

# ═════════════════════════════════════════════════════════════════════
# WORKAROUND: fusepy 3.0.1 has two deprecated fields ("getdir", "utime")
# typed as ``ctypes.c_voidp`` in the C struct.  Their default value is
# ``None``, which Python ≤3.11 implicitly converted to a null pointer.
# Python 3.12 removed that implicit conversion – ``setattr(struct, name, None)``
# now raises ``TypeError: cannot be converted to pointer``.
#
# The fix is straightforward: ensure these two void* fields hold an
# explicit ``c_void_p(None)`` (a real null pointer) **before** fusepy's
# FUSE.__init__ iterates over them.  Once they start as real pointers,
# ``setattr`` will overwrite them cleanly (with the same value) instead
# of trying to convert ``None``.
# ═════════════════════════════════════════════════════════════════════
import ctypes as _ct

def _patch_fusepy_void_p() -> None:
    try:
        import fuse as _fuse_mod  # type: ignore
    except ImportError:
        return
    ops_cls = getattr(_fuse_mod, "fuse_operations", None)
    if ops_cls is None:
        return
    # Build a bare instance – this triggers ctypes to allocate zeroed
    # storage for every field (including the void* ones).  We then touch
    # each void* field explicitly so it becomes a real null pointer.
    _blank = ops_cls()
    for ent in _blank._fields_:
        fname, proto = ent[:2]   # 2- or 3-tuple
        if proto is _ct.c_voidp:
            setattr(_blank, fname, _ct.c_void_p(None))

    # Now patch FUSE.__init__'s setattr loop to skip void* = None
    if not getattr(ops_cls, "_dataset_vfs_patched", False):
        ops_cls._dataset_vfs_patched = True
        _orig_init = _fuse_mod.FUSE.__init__

        def _patched_init(self, operations, mountpoint, raw_fi=False, encoding="utf-8", **kwargs):
            import functools as _functools
            import signal as _signal

            self.operations = operations
            self.raw_fi = raw_fi
            self.encoding = encoding
            self._FUSE__critical_exception = None  # noqa: SLF001

            self.use_ns = getattr(operations, "use_ns", False)
            args = ["fuse"]
            args.extend(
                flag
                for arg, flag in _fuse_mod.FUSE.OPTIONS
                if kwargs.pop(arg, False)
            )
            kwargs.setdefault("fsname", operations.__class__.__name__)
            args.append("-o")
            args.append(",".join(_fuse_mod.FUSE._normalize_fuse_options(**kwargs)))
            args.append(mountpoint)

            args = [arg.encode(encoding) for arg in args]
            argv = (_ct.c_char_p * len(args))(*args)

            fuse_ops = ops_cls()
            for ent in ops_cls._fields_:
                name, prototype = ent[:2]

                # Skip deprecated void* fields entirely
                if prototype is _ct.c_voidp:
                    continue

                check_name = name
                if check_name in ("ftruncate", "fgetattr"):
                    check_name = check_name[1:]

                val = getattr(operations, check_name, None)
                if val is None:
                    continue

                if hasattr(prototype, "argtypes"):
                    val = prototype(
                        _functools.partial(self._wrapper, getattr(self, name))
                    )

                setattr(fuse_ops, name, val)

            try:
                old_handler = _signal.signal(_signal.SIGINT, _signal.SIG_DFL)
            except ValueError:
                old_handler = _signal.SIG_DFL

            err = _fuse_mod._libfuse.fuse_main_real(  # type: ignore[attr-defined]
                len(args), argv, _ct.pointer(fuse_ops),
                _ct.sizeof(fuse_ops), None)

            try:
                _signal.signal(_signal.SIGINT, old_handler)
            except ValueError:
                pass

            del self.operations
            if self._FUSE__critical_exception:  # noqa: SLF001
                raise self._FUSE__critical_exception
            if err:
                raise RuntimeError(err)

        _fuse_mod.FUSE.__init__ = _patched_init


_patch_fusepy_void_p()

from fuse import FUSE  # type: ignore  # noqa: E402

from .config import Settings, ensure_mount_point  # noqa: E402

# ── Logging ───────────────────────────────────────────────────────────

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("dataset-vfs-v2")


def run_fuse() -> None:
    """Pre-flight Mongo reachability, then mount FUSE (blocking)."""
    from .api_client import MetadataClient
    from .filesystem import DatasetVFS

    settings = Settings.from_env()
    ensure_mount_point(settings.MOUNT_POINT)

    # Pre-flight: confirm MongoDB reachable *before* we block on FUSE
    try:
        with MetadataClient(settings) as client:
            client.list_datasets()
            logger.info(
                "MongoDB connected: %s.%s",
                settings.MONGO_DB, settings.MONGO_COLLECTION,
            )
    except Exception:
        logger.exception("MongoDB pre-flight failed – aborting")
        sys.exit(1)

    vfs = DatasetVFS(settings)
    logger.info("Mounting at %s", settings.MOUNT_POINT)

    try:
        FUSE(
            vfs,
            settings.MOUNT_POINT,
            ro=True,
            nothreads=True,
            foreground=True,
            allow_other=True,
        )
    except Exception:
        logger.exception("FUSE main loop exited with error")
        sys.exit(1)


if __name__ == "__main__":
    run_fuse()
