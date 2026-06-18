import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_bills_empty():
    response = client.get("/bills")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_load_demo_bills():
    response = client.post("/demo/load-samples")
    assert response.status_code in (200, 409)
    if response.status_code == 200:
        data = response.json()
        assert data["loaded"] > 0
    else:
        assert response.json()["detail"] == "Demo data already loaded"
