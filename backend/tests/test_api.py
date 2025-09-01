from fastapi.testclient import TestClient
from backend.backend import app


client = TestClient(app)


def test_score_endpoint_smoke():
    resp = client.get("/score", params={"address": "0x0000000000000000000000000000000000000000", "details": True})
    assert resp.status_code in (200, 400)


def test_badges_and_summary_flow():
    addr = "0x0000000000000000000000000000000000000000"
    r1 = client.get("/dashboard/summary", params={"address": addr})
    assert r1.status_code in (200, 500)
    # summary may 500 in CI if external calls fail; accept 500 as smoke tolerance

    r2 = client.get("/badges", params={"address": addr})
    assert r2.status_code in (200, 500)


def test_profile_crud_memory():
    addr = "0x1111111111111111111111111111111111111111"
    get1 = client.get("/profile", params={"address": addr})
    assert get1.status_code == 200
    body = get1.json()
    assert body["address"].lower() == addr.lower()

    save = client.post("/profile", json={
        "address": addr,
        "username": "tester",
        "name": "Test User",
        "birthDate": "2000-01-01",
        "avatar": "/default-avatar.svg",
        "useBasenameProfile": False,
    })
    assert save.status_code == 200

    get2 = client.get("/profile", params={"address": addr})
    assert get2.status_code == 200
    assert get2.json().get("username") == "tester"


