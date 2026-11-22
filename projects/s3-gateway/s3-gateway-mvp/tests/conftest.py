"""测试配置 - 在导入 app 之前设置本地路径"""

import os
import sys
from pathlib import Path

os.environ["S3_DB_PATH"] = str(Path(__file__).parent.parent / "data" / "test_s3_gateway.db")
os.environ["S3_DATA_ROOT"] = str(Path(__file__).parent.parent / "test-data")
os.environ["S3_ENABLE_AUTH"] = "false"

import pytest
from app.database import init_database, upsert_mapping
from app.config import settings
from app.utils import compute_etag, get_content_type, get_file_size

_test_data_dir = Path(__file__).parent.parent / "test-data"


def _init_test_mappings():
    init_database(settings.db_path)
    mappings = [
        ("tpdc-bucket", "test/test.txt", str(_test_data_dir / "test.txt")),
        ("tpdc-bucket", "test/data.json", str(_test_data_dir / "data.json")),
        ("tpdc-bucket", "test/sample.bin", str(_test_data_dir / "sample.bin")),
        ("tpdc-bucket", "test/temp.nc", str(_test_data_dir / "temp.nc")),
        ("tpdc-bucket", "v2026/temp.nc", str(_test_data_dir / "temp.nc")),
    ]
    for bucket, key, real_path in mappings:
        if Path(real_path).exists():
            size = get_file_size(real_path)
            ct = get_content_type(real_path)
            etag = compute_etag(real_path)
            upsert_mapping(settings.db_path, bucket, key, real_path, size=size, content_type=ct, etag=etag)


_init_test_mappings()