"""批量扫描脚本 - 扫描目录自动生成映射关系

用法:
    python -m app.scan --root /data/2026 --bucket tpdc-bucket --prefix v2026/
"""

import argparse
import sys
from pathlib import Path

from .config import settings
from .database import init_database
from .mapping import MappingService

SUPPORTED_EXTENSIONS = {
    ".nc", ".h5", ".hdf5", ".tif", ".tiff", ".csv", ".json",
    ".txt", ".zip", ".tar", ".gz", ".xml", ".html",
    ".png", ".jpg", ".jpeg", ".bin",
}


def main():
    parser = argparse.ArgumentParser(description="批量扫描目录生成 S3 映射")
    parser.add_argument("--root", required=True, help="扫描根目录（容器内路径）")
    parser.add_argument("--bucket", required=True, help="Bucket 名称")
    parser.add_argument("--prefix", default="", help="S3 Object Key 前缀")
    parser.add_argument("--all-files", action="store_true", help="包含所有文件类型，不限扩展名")
    parser.add_argument("--dry-run", action="store_true", help="只打印不实际写入")
    args = parser.parse_args()

    root = Path(args.root)
    if not root.exists():
        print(f"ERROR: root directory not found: {args.root}", file=sys.stderr)
        sys.exit(1)
    if not root.is_dir():
        print(f"ERROR: root is not a directory: {args.root}", file=sys.stderr)
        sys.exit(1)

    init_database(settings.db_path)
    service = MappingService(settings)

    count = 0
    for file_path in sorted(root.rglob("*")):
        if not file_path.is_file():
            continue
        if not args.all_files and file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        relative = file_path.relative_to(root)
        object_key = args.prefix + str(relative).replace("\\", "/")

        if args.dry_run:
            print(f"[DRY-RUN] s3://{args.bucket}/{object_key} -> {file_path}")
        else:
            try:
                service.add_mapping(
                    bucket_name=args.bucket,
                    object_key=object_key,
                    real_path=str(file_path),
                )
                print(f"[OK] s3://{args.bucket}/{object_key} -> {file_path}")
            except Exception as e:
                print(f"[FAIL] s3://{args.bucket}/{object_key}: {e}", file=sys.stderr)
        count += 1

    print(f"\nTotal: {count} files scanned")


if __name__ == "__main__":
    main()