import time

def test_timer_start_and_stop(client, auth_headers_user1):
    # Create task
    res_task = client.post("/api/tasks", json={"title": "Implement Timer API"}, headers=auth_headers_user1)
    task_id = res_task.json()["id"]

    # Start timer
    res_start = client.post(f"/api/tasks/{task_id}/timer/start", headers=auth_headers_user1)
    assert res_start.status_code == 201
    log_id = res_start.json()["id"]
    assert res_start.json()["ended_at"] is None

    # Check active timer endpoint
    res_active = client.get("/api/timer/active", headers=auth_headers_user1)
    assert res_active.status_code == 200
    assert res_active.json()["task_id"] == task_id

    # Stop timer
    res_stop = client.post(f"/api/tasks/{task_id}/timer/stop", headers=auth_headers_user1)
    assert res_stop.status_code == 200
    assert res_stop.json()["id"] == log_id
    assert res_stop.json()["ended_at"] is not None
    assert res_stop.json()["duration_seconds"] is not None

def test_prevent_multiple_active_timers(client, auth_headers_user1):
    task1 = client.post("/api/tasks", json={"title": "Task 1"}, headers=auth_headers_user1).json()["id"]
    task2 = client.post("/api/tasks", json={"title": "Task 2"}, headers=auth_headers_user1).json()["id"]

    # Start task1 timer
    client.post(f"/api/tasks/{task1}/timer/start", headers=auth_headers_user1)

    # Attempt to start task2 timer while task1 is running -> 409 Conflict
    res_conflict = client.post(f"/api/tasks/{task2}/timer/start", headers=auth_headers_user1)
    assert res_conflict.status_code == 409
    assert "Another task" in res_conflict.json()["detail"] or "already running" in res_conflict.json()["detail"]
