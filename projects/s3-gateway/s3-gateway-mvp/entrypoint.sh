#!/bin/bash
set -e

echo "=== S3 Gateway MVP Entry Point ==="

python -c "from app.setup_test_data import setup_test_data; setup_test_data()"

echo "Starting S3 Gateway on 0.0.0.0:9000 ..."
exec uvicorn app.main:app --host 0.0.0.0 --port 9000