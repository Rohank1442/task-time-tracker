def test_daily_summary(client, auth_headers_user1):
    # Create tasks
    task1 = client.post("/api/tasks", json={"title": "Summary Task 1"}, headers=auth_headers_user1).json()["id"]
    task2 = client.post("/api/tasks", json={"title": "Summary Task 2"}, headers=auth_headers_user1).json()["id"]

    # Start and stop timer for task 1
    client.post(f"/api/tasks/{task1}/timer/start", headers=auth_headers_user1)
    client.post(f"/api/tasks/{task1}/timer/stop", headers=auth_headers_user1)

    # Complete task 2
    client.put(f"/api/tasks/{task2}", json={"status": "COMPLETED"}, headers=auth_headers_user1)

    # Fetch daily summary
    res_summary = client.get("/api/dashboard/daily-summary", headers=auth_headers_user1)
    assert res_summary.status_code == 200
    data = res_summary.json()

    assert data["worked_on_count"] >= 1
    assert data["completed_count"] >= 1
    assert "formatted_total_time" in data
