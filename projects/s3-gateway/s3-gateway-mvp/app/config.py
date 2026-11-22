"""配置管理模块 - 通过环境变量加载配置，不硬编码任何密钥或路径"""

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Settings:
    s3_access_key: str
    s3_secret_key: str
    s3_region: str
    host: str
    port: int
    db_path: str
    data_root: str
    bucket_name: str
    owner_id: str
    owner_display_name: str
    max_keys: int
    enable_auth: bool
    log_level: str

    @property
    def db_file(self) -> Path:
        return Path(self.db_path)

    @property
    def data_dir(self) -> Path:
        return Path(self.data_root)


def load_settings() -> Settings:
    return Settings(
        s3_access_key=os.environ.get("S3_ACCESS_KEY", "tpdc-access"),
        s3_secret_key=os.environ.get("S3_SECRET_KEY", "change-me"),
        s3_region=os.environ.get("S3_REGION", "us-east-1"),
        host=os.environ.get("S3_HOST", "0.0.0.0"),
        port=int(os.environ.get("S3_PORT", "9000")),
        db_path=os.environ.get("S3_DB_PATH", "/app/data/s3_gateway.db"),
        data_root=os.environ.get("S3_DATA_ROOT", "/data"),
        bucket_name=os.environ.get("S3_BUCKET_NAME", "tpdc-bucket"),
        owner_id=os.environ.get("S3_OWNER_ID", "tpdc-owner"),
        owner_display_name=os.environ.get("S3_OWNER_DISPLAY_NAME", "tpdc"),
        max_keys=int(os.environ.get("S3_MAX_KEYS", "1000")),
        enable_auth=os.environ.get("S3_ENABLE_AUTH", "true").lower() == "true",
        log_level=os.environ.get("S3_LOG_LEVEL", "INFO"),
    )


settings = load_settings()