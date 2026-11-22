"""Object API 测试 - HeadObject / GetObject"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def disable_auth(monkeypatch):
    monkeypatch.setattr(settings, "enable_auth", False)


def test_get_object_text():
    response = client.get(f"/{settings.bucket_name}/test/test.txt")
    assert response.status_code == 200
    assert b"S3 Gateway MVP Test" in response.content
    assert response.headers.get("content-type") == "text/plain"
    assert "content-length" in response.headers
    assert "etag" in response.headers
    assert "last-modified" in response.headers
    assert response.headers.get("accept-ranges") == "bytes"


def test_head_object():
    response = client.head(f"/{settings.bucket_name}/test/test.txt")
    assert response.status_code == 200
    assert "content-length" in response.headers
    assert "etag" in response.headers
    assert response.headers.get("accept-ranges") == "bytes"


def test_get_object_not_found():
    response = client.get(f"/{settings.bucket_name}/nonexistent/file.txt")
    assert response.status_code == 404
    assert "NoSuchKey" in response.text or "Error" in response.text


def test_get_object_json():
    response = client.get(f"/{settings.bucket_name}/test/data.json")
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/json"
    assert b'"service"' in response.content


def test_get_object_binary():
    response = client.get(f"/{settings.bucket_name}/test/sample.bin")
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/octet-stream"
    assert len(response.content) == 10240


def test_get_object_netcdf():
    response = client.get(f"/{settings.bucket_name}/test/temp.nc")
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/x-netcdf"