"""Range 请求测试"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def disable_auth(monkeypatch):
    monkeypatch.setattr(settings, "enable_auth", False)


def test_range_basic():
    response = client.get(
        f"/{settings.bucket_name}/test/test.txt",
        headers={"Range": "bytes=0-9"},
    )
    assert response.status_code == 206
    assert response.headers.get("content-range") is not None
    assert response.headers.get("content-range").startswith("bytes 0-9/")
    assert "content-length" in response.headers
    assert response.headers.get("accept-ranges") == "bytes"


def test_range_partial_content():
    response = client.get(
        f"/{settings.bucket_name}/test/test.txt",
        headers={"Range": "bytes=0-4"},
    )
    assert response.status_code == 206
    assert len(response.content) == 5


def test_range_open_ended():
    response = client.get(
        f"/{settings.bucket_name}/test/test.txt",
        headers={"Range": "bytes=5-"},
    )
    assert response.status_code == 206
    assert response.headers.get("content-range", "").startswith("bytes 5-")


def test_range_suffix():
    response = client.get(
        f"/{settings.bucket_name}/test/test.txt",
        headers={"Range": "bytes=-5"},
    )
    assert response.status_code == 206
    assert len(response.content) == 5


def test_range_binary_file():
    response = client.get(
        f"/{settings.bucket_name}/test/sample.bin",
        headers={"Range": "bytes=0-1023"},
    )
    assert response.status_code == 206
    assert len(response.content) == 1024
    assert response.headers.get("content-range") == "bytes 0-1023/10240"


def test_no_range_full_file():
    response = client.get(f"/{settings.bucket_name}/test/test.txt")
    assert response.status_code == 200
    assert b"S3 Gateway MVP Test" in response.content