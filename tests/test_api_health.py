import pytest
from fastapi.testclient import TestClient

from api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


def test_health_check(client) -> None:
    """Test the health check endpoint returns 200 OK."""
    response = client.get("/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_404(client) -> None:
    """Test that root returns 404 since no root route is defined."""
    response = client.get("/")
    assert response.status_code == 404
