"""路径映射服务 - S3 Object Key 到真实文件路径的映射"""

import logging
from pathlib import Path
from typing import Optional

from .config import Settings
from .database import get_mapping, list_mappings, upsert_mapping
from .models import ObjectMapping
from .utils import (
    compute_etag,
    get_content_type,
    get_file_size,
    is_path_traversal,
)

logger = logging.getLogger(__name__)


class MappingError(Exception):
    pass


class MappingService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.db_path = settings.db_path

    def resolve(self, bucket_name: str, object_key: str) -> ObjectMapping:
        if is_path_traversal(object_key):
            raise MappingError(f"Path traversal detected in object key: {object_key}")
        if is_path_traversal(bucket_name):
            raise MappingError(f"Path traversal detected in bucket name: {bucket_name}")
        mapping = get_mapping(self.db_path, bucket_name, object_key)
        if mapping is None:
            raise MappingError(f"No such key: {bucket_name}/{object_key}")
        return mapping

    def resolve_real_path(self, bucket_name: str, object_key: str) -> Path:
        mapping = self.resolve(bucket_name, object_key)
        real_path = Path(mapping.real_path)
        if not real_path.exists():
            raise MappingError(f"Real file not found: {mapping.real_path}")
        if not real_path.is_file():
            raise MappingError(f"Real path is not a file: {mapping.real_path}")
        return real_path

    def list_objects(
        self,
        bucket_name: str,
        prefix: str = "",
        max_keys: int = 1000,
        start_after: Optional[str] = None,
    ) -> tuple[list[ObjectMapping], bool]:
        return list_mappings(self.db_path, bucket_name, prefix, max_keys, start_after)

    def add_mapping(
        self,
        bucket_name: str,
        object_key: str,
        real_path: str,
        auto_fill: bool = True,
    ) -> None:
        size = None
        content_type = None
        etag = None
        if auto_fill and Path(real_path).exists():
            try:
                size = get_file_size(real_path)
                content_type = get_content_type(real_path)
                etag = compute_etag(real_path)
            except OSError as e:
                logger.warning(f"Cannot stat file {real_path}: {e}")
        upsert_mapping(
            self.db_path,
            bucket_name,
            object_key,
            real_path,
            size=size,
            content_type=content_type,
            etag=etag,
        )
        logger.info(
            f"Mapping added: s3://{bucket_name}/{object_key} -> {real_path} "
            f"(size={size}, content_type={content_type})"
        )

    def refresh_mapping(self, bucket_name: str, object_key: str) -> Optional[ObjectMapping]:
        mapping = get_mapping(self.db_path, bucket_name, object_key)
        if mapping is None:
            return None
        real_path = Path(mapping.real_path)
        if real_path.exists() and real_path.is_file():
            size = get_file_size(str(real_path))
            content_type = get_content_type(str(real_path))
            etag = compute_etag(str(real_path))
            upsert_mapping(
                self.db_path,
                bucket_name,
                object_key,
                str(real_path),
                size=size,
                content_type=content_type,
                etag=etag,
            )
            return get_mapping(self.db_path, bucket_name, object_key)
        return mapping