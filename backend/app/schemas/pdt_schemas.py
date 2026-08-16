from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class TwinStateBase(BaseModel):
    total_time_capacity_mins: int = 840
    attention_capacity: float = 100.0
    current_attention_load: float = 35.0
    daily_budget_limit: float = 100.0
    current_budget_spent: float = 24.50
    energy_capacity: float = 100.0
    current_energy_level: float = 82.0
    default_travel_buffer_mins: int = 15
    digital_workload_demand: float = 40.0

class TwinStateResponse(TwinStateBase):
    id: int
    user_id: str
    last_synchronized_at: datetime
    
    class Config:
        from_attributes = True

class TaskItemBase(BaseModel):
    title: str
    category: str = "Work"
    start_time: str # "HH:MM"
    end_time: str   # "HH:MM"
    duration_mins: int = 60
    is_fixed: bool = False
    cognitive_load: float = 5.0
    energy_cost: float = 4.0
    monetary_cost: float = 0.0
    mobility_req: bool = False
    location: str = "Office"
    priority: int = 3
    status: str = "pending"

class TaskItemCreate(TaskItemBase):
    pass

class TaskItemResponse(TaskItemBase):
    id: int
    user_id: str
    
    class Config:
        from_attributes = True

class PredictionForecastResponse(BaseModel):
    id: int
    timestamp: datetime
    conflict_type: str
    severity: str
    affected_tasks: List[str]
    description: str
    confidence_score: float
    suggested_resolution: Optional[str] = None
    
    class Config:
        from_attributes = True

class MemoryItemBase(BaseModel):
    type: str = "preference"
    key: str
    value: str
    is_editable: bool = True
    relevance_tag: str = "general"

class MemoryItemCreate(MemoryItemBase):
    pass

class MemoryItemResponse(MemoryItemBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class GoalRequest(BaseModel):
    goal_prompt: str
    alpha_completion: float = 0.35 # Utility weight for completion C(P)
    beta_efficiency: float = 0.25  # Utility weight for resource efficiency R(P)
    gamma_feasibility: float = 0.25# Utility weight for feasibility F(P)
    delta_intervention: float = 0.15# Utility weight for intervention cost I(P)

class ScheduledTask(BaseModel):
    task_id: int
    title: str
    category: str
    assigned_start: str
    assigned_end: str
    duration_mins: int
    is_fixed: bool
    cognitive_load: float
    energy_cost: float
    monetary_cost: float
    priority: int

class CandidatePlanResponse(BaseModel):
    id: int
    goal_prompt: str
    plan_name: str
    tasks_layout: List[Dict[str, Any]]
    utility_score: float
    completion_score: float
    resource_efficiency: float
    feasibility_score: float
    intervention_cost: float
    explanation: str
    is_recommended: bool
    
    class Config:
        from_attributes = True

class PolicyAuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    action_type: str
    risk_level: str
    target_summary: str
    payload: Dict[str, Any]
    status: str
    user_decision_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ActionDecisionRequest(BaseModel):
    audit_id: int
    decision: str # "approve" or "reject"
