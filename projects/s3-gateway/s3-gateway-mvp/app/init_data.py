"""数据初始化脚本 - 添加单条映射关系

用法:
    python -m app.init_data --bucket tpdc-bucket --key v2026/temp.nc --path /data/2026/temp.nc
"""

import argparse
import sys

from .config import settings
from .database import init_database
from .mapping import MappingService


def main():
    parser = argparse.ArgumentParser(description="添加 S3 对象映射")
    parser.add_argument("--bucket", required=True, help="Bucket 名称")
    parser.add_argument("--key", required=True, help="S3 Object Key")
    parser.add_argument("--path", required=True, help="真实文件路径（容器内路径）")
    parser.add_argument("--no-auto-fill", action="store_true", help="不自动填充 size/content_type/etag")
    args = parser.parse_args()

    init_database(settings.db_path)
    service = MappingService(settings)

    try:
        service.add_mapping(
            bucket_name=args.bucket,
            object_key=args.key,
            real_path=args.path,
            auto_fill=not args.no_auto_fill,
        )
        print(f"OK: s3://{args.bucket}/{args.key} -> {args.path}")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()