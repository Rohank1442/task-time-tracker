def test_signup(client):
    response = client.post("/api/auth/signup", json={"email": "newuser@example.com", "password": "securepassword"})
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"

def test_signup_duplicate_email(client):
    client.post("/api/auth/signup", json={"email": "duplicate@example.com", "password": "password123"})
    response = client.post("/api/auth/signup", json={"email": "duplicate@example.com", "password": "password123"})
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client):
    client.post("/api/auth/signup", json={"email": "login@example.com", "password": "mypassword"})
    response = client.post("/api/auth/login", json={"email": "login@example.com", "password": "mypassword"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_password(client):
    client.post("/api/auth/signup", json={"email": "wrongpwd@example.com", "password": "correctpassword"})
    response = client.post("/api/auth/login", json={"email": "wrongpwd@example.com", "password": "wrongpassword"})
    assert response.status_code == 401

def test_protected_route_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 403 or response.status_code == 401
