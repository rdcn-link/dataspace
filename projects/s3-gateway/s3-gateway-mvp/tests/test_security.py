"""安全测试 - 路径穿越防护、只读限制"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def disable_auth(monkeypatch):
    monkeypatch.setattr(settings, "enable_auth", False)


def test_path_traversal_double_dot():
    response = client.get(f"/{settings.bucket_name}/../../etc/passwd")
    assert response.status_code in (400, 404)


def test_path_traversal_encoded():
    response = client.get(f"/{settings.bucket_name}/..%2F..%2Fetc%2Fpasswd")
    assert response.status_code in (400, 404)


def test_path_traversal_url_encoded():
    response = client.get(f"/{settings.bucket_name}/%2e%2e/%2e%2e/etc/passwd")
    assert response.status_code in (400, 404)


def test_readonly_put_rejected():
    response = client.put(f"/{settings.bucket_name}/test/test.txt", content=b"data")
    assert response.status_code == 405


def test_readonly_post_rejected():
    response = client.post(f"/{settings.bucket_name}/test/test.txt", content=b"data")
    assert response.status_code == 405


def test_readonly_delete_rejected():
    response = client.delete(f"/{settings.bucket_name}/test/test.txt")
    assert response.status_code == 405


def test_method_not_allowed_xml_error():
    response = client.put(f"/{settings.bucket_name}/test/test.txt", content=b"data")
    assert response.status_code == 405
    assert "MethodNotAllowed" in response.text or "Error" in response.text


def test_null_byte_in_key():
    response = client.get(f"/{settings.bucket_name}/test%00.txt")
    assert response.status_code in (400, 404)