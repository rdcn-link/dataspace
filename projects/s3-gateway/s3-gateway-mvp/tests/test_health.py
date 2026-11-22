"""健康检查测试"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "s3-gateway"


def test_health_response_format():
    response = client.get("/health")
    assert response.headers["content-type"].startswith("application/json")