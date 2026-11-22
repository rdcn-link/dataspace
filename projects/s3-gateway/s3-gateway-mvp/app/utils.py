"""工具函数模块 - Content-Type 判断、ETag 计算、路径安全校验、时间格式化"""

import hashlib
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

CONTENT_TYPE_MAP = {
    ".nc": "application/x-netcdf",
    ".h5": "application/x-hdf5",
    ".hdf5": "application/x-hdf5",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".csv": "text/csv",
    ".json": "application/json",
    ".txt": "text/plain",
    ".zip": "application/zip",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".xml": "application/xml",
    ".html": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".bin": "application/octet-stream",
}

DEFAULT_CONTENT_TYPE = "application/octet-stream"


def get_content_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext in CONTENT_TYPE_MAP:
        return CONTENT_TYPE_MAP[ext]
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or DEFAULT_CONTENT_TYPE


def compute_etag(file_path: str, chunk_size: int = 8 * 1024 * 1024) -> str:
    md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            md5.update(chunk)
    return md5.hexdigest()


def compute_etag_bytes(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def get_file_size(file_path: str) -> int:
    return Path(file_path).stat().st_size


def get_last_modified(file_path: str) -> datetime:
    ts = Path(file_path).stat().st_mtime
    return datetime.fromtimestamp(ts, tz=timezone.utc)


def format_s3_time(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def format_http_time(dt: datetime) -> str:
    return dt.strftime("%a, %d %b %Y %H:%M:%S GMT")


def is_path_traversal(object_key: str) -> bool:
    dangerous_patterns = ["..", "%2e%2e", "%2E%2E"]
    normalized = object_key.replace("\\", "/")
    parts = normalized.split("/")
    for part in parts:
        if part == "..":
            return True
    lower = object_key.lower()
    for pattern in dangerous_patterns:
        if pattern in lower:
            return True
    if "\x00" in object_key:
        return True
    return False


def safe_resolve(real_path: str) -> Optional[Path]:
    p = Path(real_path)
    try:
        resolved = p.resolve(strict=False)
    except (OSError, RuntimeError):
        return None
    return resolved


def parse_range_header(range_header: str, total_size: int) -> Optional[tuple[int, int]]:
    if not range_header or not range_header.startswith("bytes="):
        return None
    spec = range_header[len("bytes="):].strip()
    if "," in spec:
        spec = spec.split(",")[0].strip()
    if "-" not in spec:
        return None
    start_str, end_str = spec.split("-", 1)
    start_str = start_str.strip()
    end_str = end_str.strip()
    if start_str == "":
        if end_str == "":
            return None
        length = int(end_str)
        if length <= 0:
            return None
        start = max(0, total_size - length)
        end = total_size - 1
    else:
        start = int(start_str)
        if end_str == "":
            end = total_size - 1
        else:
            end = int(end_str)
    if start < 0 or start >= total_size:
        return None
    if end >= total_size:
        end = total_size - 1
    if end < start:
        return None
    return start, end


def generate_request_id() -> str:
    return hashlib.md5(datetime.now(timezone.utc).isoformat().encode()).hexdigest()[:16]