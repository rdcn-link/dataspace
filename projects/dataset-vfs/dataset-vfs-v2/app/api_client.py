"""Direct MongoDB-backed metadata client.

Instead of calling a remote REST API, this module queries MongoDB
collection ``scidb_dataseek_filePath`` directly.  Each document has:

* ``datasetId`` – unique dataset identifier (string).
* ``fileTree`` – arbitrarily-deep nested dict describing every file
  inside the dataset, mapped from relative virtual path segments to
  the real absolute path on disk.

All fileTree navigation is delegated to :mod:`tree_walker` – the
client itself only handles DB connection + caching, keeping the two
concerns strictly separated.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from pymongo import MongoClient
from pymongo.collection import Collection

from .cache import LRUCache
from .config import Settings
from .models import DatasetInfo, FileInfo, ResolvedFile
from .tree_walker import classify_children, resolve_path

logger = logging.getLogger(__name__)


class MetadataClient:
    """Direct MongoDB metadata accessor with LRU+TTL in-process caches.

    Method signatures are intentionally close to the previous HTTP client
    so that :mod:`filesystem` barely needs to change.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

        # ── Mongo ───────────────────────────────────────────────────
        self._mongo_client: MongoClient = MongoClient(
            settings.MONGO_URI,
            connectTimeoutMS=settings.MONGO_CONNECT_TIMEOUT_MS,
            socketTimeoutMS=settings.MONGO_SOCKET_TIMEOUT_MS,
            maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
            serverSelectionTimeoutMS=settings.MONGO_CONNECT_TIMEOUT_MS,
        )
        db = self._mongo_client[settings.MONGO_DB]
        self._collection: Collection = db[settings.MONGO_COLLECTION]

        # ── Caches ──────────────────────────────────────────────────
        # dataset_id → { "fileTree": {...} } full document (minus _id)
        self._filetree_cache = LRUCache(
            max_size=settings.CACHE_MAX_SIZE, ttl=settings.CACHE_TTL_SECONDS
        )
        # "datasets" → List[DatasetInfo]
        self._datasets_cache = LRUCache(
            max_size=1, ttl=settings.CACHE_TTL_SECONDS
        )

    # ── Low-level DB helpers ──────────────────────────────────────

    def _load_filetree(self, dataset_id: str) -> Dict[str, Any]:
        """Return the full fileTree dict for ``dataset_id``.

        Uses LRU+TTL cache; misses query MongoDB once per miss.  The
        returned dict is the raw ``fileTree`` field from the document –
        callers can mutate without affecting the cache entry (we store
        the original dict reference; for safety this is a shallow
        limitation, acceptable because tree_walker is read-only).
        """
        cached = self._filetree_cache.get(dataset_id)
        if cached is not None:
            return cached

        doc = self._collection.find_one(
            {"datasetId": dataset_id},
            projection={"_id": 0, "fileTree": 1},
        )
        if doc is None:
            raise FileNotFoundError(
                f"no document in {self._settings.MONGO_COLLECTION} "
                f"for datasetId={dataset_id!r}"
            )
        file_tree = doc.get("fileTree") or {}
        self._filetree_cache.put(dataset_id, file_tree)
        logger.debug("loaded fileTree for %s (cached)", dataset_id)
        return file_tree

    # ── Public API ──────────────────────────────────────────────────

    def list_datasets(self) -> List[DatasetInfo]:
        """Return every dataset known to MongoDB."""
        cached = self._datasets_cache.get("datasets")
        if cached is not None:
            return cached

        # Use distinct for O(n) round-trips, then enrich with names
        ids = list(
            self._collection.distinct("datasetId")
        )
        result = [DatasetInfo(dataset_id=str(x), name=str(x)) for x in ids]
        self._datasets_cache.put("datasets", result)
        logger.debug("list_datasets → %d entries", len(result))
        return result

    def list_children(self, dataset_id: str, segments: List[str]) -> List[FileInfo]:
        """Return immediate child entries at ``segments``.

        Each entry carries ``is_dir`` so the caller can decide whether
        to recurse further or treat it as a leaf file.  This is the
        modern, arbitrary-depth replacement for the old flat
        ``list_files``.
        """
        file_tree = self._load_filetree(dataset_id)
        try:
            raw = classify_children(file_tree, segments)
        except FileNotFoundError:
            raise
        return [FileInfo(name=n, is_dir=d) for n, d in raw]

    def resolve(self, dataset_id: str, segments: List[str]) -> ResolvedFile:
        """Translate a virtual path (``dataset_id + segments``) to a
        real absolute path on disk.

        ``segments`` is the full path **after** the dataset ID, and the
        last element is expected to be the leaf file name (not a
        directory).  Raises :class:`FileNotFoundError` if the leaf is
        missing.
        """
        if not segments:
            raise FileNotFoundError("segments must include at least a file name")

        file_tree = self._load_filetree(dataset_id)
        real_path = resolve_path(file_tree, segments)
        virtual_path = "/" + "/".join([self._settings.VIRTUAL_ROOT.strip("/"), dataset_id, *segments])
        return ResolvedFile(virtual_path=virtual_path, real_path=real_path)

    def is_file(self, dataset_id: str, segments: List[str]) -> bool:
        """Quick check: does the leaf path actually resolve to a file?

        This is faster than calling :meth:`resolve` for negative
        answers because we swallow the exception.  For positive
        answers it still does the same work (tree walk), so it's
        mostly useful for classification tests (``getattr`` deep paths).
        """
        try:
            self.resolve(dataset_id, segments)
            return True
        except FileNotFoundError:
            return False

    # ── Lifecycle ────────────────────────────────────────────────────

    def close(self) -> None:
        """Release the MongoDB connection pool."""
        self._mongo_client.close()

    def __enter__(self) -> "MetadataClient":
        return self

    def __exit__(self, *_exc) -> None:
        self.close()
