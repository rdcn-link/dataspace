"""数据模型定义"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ObjectMapping:
    id: int
    bucket_name: str
    object_key: str
    real_path: str
    size: Optional[int]
    content_type: Optional[str]
    etag: Optional[str]
    enabled: int
    created_at: Optional[str]
    updated_at: Optional[str]


@dataclass
class BucketInfo:
    name: str
    creation_date: str


@dataclass
class ListEntry:
    key: str
    last_modified: str
    etag: str
    size: int
    storage_class: str = "STANDARD"


@dataclass
class RangeSpec:
    start: int
    end: int
    total: int

    @property
    def length(self) -> int:
        return self.end - self.start + 1


@dataclass
class S3Error:
    code: str
    message: str
    resource: str
    request_id: str
    http_status: int