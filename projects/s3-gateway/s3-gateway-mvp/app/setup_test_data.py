"""启动时自动初始化测试数据映射"""

import json
import logging
from pathlib import Path

from .config import settings
from .database import init_database, get_mapping
from .mapping import MappingService

logger = logging.getLogger(__name__)

DEFAULT_MAPPINGS = [
    {
        "bucket_name": "tpdc-bucket",
        "object_key": "test/test.txt",
        "real_path": "/data/test/test.txt",
    },
    {
        "bucket_name": "tpdc-bucket",
        "object_key": "test/data.json",
        "real_path": "/data/test/data.json",
    },
    {
        "bucket_name": "tpdc-bucket",
        "object_key": "test/sample.bin",
        "real_path": "/data/test/sample.bin",
    },
    {
        "bucket_name": "tpdc-bucket",
        "object_key": "test/temp.nc",
        "real_path": "/data/test/temp.nc",
    },
    {
        "bucket_name": "tpdc-bucket",
        "object_key": "v2026/temp.nc",
        "real_path": "/data/test/temp.nc",
    },
]


def setup_test_data():
    init_database(settings.db_path)
    service = MappingService(settings)

    config_path = Path("/app/config/mapping.json")
    mappings = DEFAULT_MAPPINGS
    if config_path.exists():
        try:
            mappings = json.loads(config_path.read_text())
        except Exception:
            mappings = DEFAULT_MAPPINGS

    for m in mappings:
        bucket = m.get("bucket_name", settings.bucket_name)
        key = m["object_key"]
        real_path = m["real_path"]

        existing = get_mapping(settings.db_path, bucket, key)
        if existing is None:
            try:
                service.add_mapping(bucket, key, real_path)
            except Exception as e:
                logger.warning(f"Failed to add mapping {bucket}/{key}: {e}")
        else:
            service.refresh_mapping(bucket, key)

    logger.info(f"Test data initialized: {len(mappings)} mappings")