import os
import tempfile

os.environ["DATABASE_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from seed import seed  # noqa: E402


@pytest.fixture()
def client():
    seed()
    with TestClient(app) as c:
        yield c


def login(client, username, password):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def test_login_sets_session_cookie(client):
    res = login(client, "maya", "member123")
    assert res.status_code == 200
    assert res.json()["role"] == "member"
    assert "split_session" in client.cookies
    assert client.get("/api/auth/me").json()["username"] == "maya"


def test_wrong_password_is_rejected(client):
    assert login(client, "maya", "nope").status_code == 401
    assert client.get("/api/dashboard").status_code == 401


def test_admin_endpoints_are_admin_only(client):
    login(client, "maya", "member123")
    assert client.get("/api/admin/audit").status_code == 403
    assert client.post("/api/admin/invite", json={"email": "x@example.com"}).status_code == 403

    client.post("/api/auth/logout")
    login(client, "admin", "admin")
    assert client.get("/api/admin/audit").status_code == 200
    assert client.post("/api/admin/invite", json={"email": "new@example.com", "role": "member"}).status_code == 201


def test_dashboard_and_projects(client):
    login(client, "admin", "admin")
    dash = client.get("/api/dashboard").json()
    assert dash["counts"]["members"] == 6
    projects = client.get("/api/projects").json()
    assert len(projects) == 6
    detail = client.get(f"/api/projects/{projects[0]['id']}").json()
    assert detail["tasks"]
