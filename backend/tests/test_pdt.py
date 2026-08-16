import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Personal Digital Twin" in data["project"]

def test_twin_state():
    response = client.get("/api/pdt/state")
    assert response.status_code == 200
    data = response.json()
    assert "total_time_capacity_mins" in data
    assert "attention_capacity" in data
    assert "current_budget_spent" in data

def test_tasks_list():
    response = client.get("/api/pdt/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) > 0

def test_predictions():
    response = client.get("/api/pdt/predict")
    assert response.status_code == 200
    preds = response.json()
    assert isinstance(preds, list)

def test_planner():
    payload = {
        "goal_prompt": "Optimize my day for deep work while keeping budget under $50",
        "alpha_completion": 0.35,
        "beta_efficiency": 0.25,
        "gamma_feasibility": 0.25,
        "delta_intervention": 0.15
    }
    response = client.post("/api/pdt/planner/generate", json=payload)
    assert response.status_code == 200
    plans = response.json()
    assert len(plans) == 3
    assert any(p["is_recommended"] for p in plans)

def test_ablation():
    response = client.post("/api/pdt/ablation/run?scenario_id=S2")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert len(data["metrics"]) == 4
