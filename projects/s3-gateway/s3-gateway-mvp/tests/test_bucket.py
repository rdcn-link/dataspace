"""Bucket API 测试 - ListBuckets / HeadBucket"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def disable_auth(monkeypatch):
    monkeypatch.setattr(settings, "enable_auth", False)


def test_list_buckets():
    response = client.get("/")
    assert response.status_code == 200
    assert "application/xml" in response.headers.get("content-type", "")
    body = response.text
    assert "ListAllMyBucketsResult" in body
    assert settings.bucket_name in body


def test_head_bucket_exists():
    response = client.head(f"/{settings.bucket_name}")
    assert response.status_code == 200


def test_head_bucket_not_exists():
    response = client.head("/nonexistent-bucket-12345")
    assert response.status_code == 404


def test_list_objects_v2():
    response = client.get(f"/{settings.bucket_name}?list-type=2")
    assert response.status_code == 200
    body = response.text
    assert "ListBucketResult" in body
    assert "Contents" in body or "KeyCount" in body