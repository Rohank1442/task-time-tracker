def test_create_and_get_task(client, auth_headers_user1):
    res = client.post(
        "/api/tasks",
        json={"title": "Design Database Schema", "description": "Relational tables for tasks and time logs"},
        headers=auth_headers_user1
    )
    assert res.status_code == 201
    task_id = res.json()["id"]
    assert res.json()["title"] == "Design Database Schema"
    assert res.json()["status"] == "PENDING"

    # Get single task
    res_get = client.get(f"/api/tasks/{task_id}", headers=auth_headers_user1)
    assert res_get.status_code == 200
    assert res_get.json()["title"] == "Design Database Schema"

def test_update_task_status(client, auth_headers_user1):
    res = client.post("/api/tasks", json={"title": "Write unit tests"}, headers=auth_headers_user1)
    task_id = res.json()["id"]

    res_up = client.put(f"/api/tasks/{task_id}", json={"status": "COMPLETED"}, headers=auth_headers_user1)
    assert res_up.status_code == 200
    assert res_up.json()["status"] == "COMPLETED"
    assert res_up.json()["completed_at"] is not None

def test_idor_protection(client, auth_headers_user1, auth_headers_user2):
    # User 1 creates task
    res = client.post("/api/tasks", json={"title": "User 1 Secret Task"}, headers=auth_headers_user1)
    task_id = res.json()["id"]

    # User 2 attempts to read User 1's task
    res_user2_get = client.get(f"/api/tasks/{task_id}", headers=auth_headers_user2)
    assert res_user2_get.status_code == 404

    # User 2 attempts to update User 1's task
    res_user2_update = client.put(f"/api/tasks/{task_id}", json={"title": "Hacked Title"}, headers=auth_headers_user2)
    assert res_user2_update.status_code == 404

    # User 2 attempts to delete User 1's task
    res_user2_delete = client.delete(f"/api/tasks/{task_id}", headers=auth_headers_user2)
    assert res_user2_delete.status_code == 404
