import re
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.schemas import pdt_schemas
from backend.app.models import pdt_models
from backend.app.services.twin_engine import PersonalTwinEngine
from backend.app.services.predictor import PredictiveConflictEngine
from backend.app.services.memory_service import MemoryService
from backend.app.services.agentic_planner import AgenticPlannerEngine
from backend.app.services.policy_engine import PolicyConsentEngine
from backend.app.services.ablation_service import AblationBenchmarkService
from backend.app.services.universal_ai_agent import UniversalAIAgent
from backend.app.services.ai_tools import AIToolRegistry

router = APIRouter(prefix="/pdt", tags=["Personal Digital Twin"])

# --- AUTH SCHEMAS ---
class UserRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    token: str

class VoiceCommandRequest(BaseModel):
    voice_query: str
    session_id: Optional[str] = "default_session"

class VoiceCommandResponse(BaseModel):
    voice_query: str
    voice_response: str
    action_taken: Optional[str] = None
    action_details: Optional[Dict[str, Any]] = None

class RemindersResponse(BaseModel):
    id: int
    task_name: str
    scheduled_time: str
    is_recurring: bool
    status: str

# --- AUTH ENDPOINTS ---
@router.post("/auth/register", response_model=UserResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(pdt_models.UserModel).filter(pdt_models.UserModel.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    hashed = f"hashed_{req.password}"
    user = pdt_models.UserModel(email=req.email, full_name=req.full_name, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = f"pdt_token_{user.id}_{user.email}"
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name, token=token)

@router.post("/auth/login", response_model=UserResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(pdt_models.UserModel).filter(pdt_models.UserModel.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = f"pdt_token_{user.id}_{user.email}"
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name, token=token)

# --- UNIVERSAL CHATGPT-LIKE AI AGENT VOICE & CHAT ENDPOINT ---
@router.post("/voice/command", response_model=VoiceCommandResponse)
def process_voice_command(req: VoiceCommandRequest, db: Session = Depends(get_db)):
    query = req.voice_query.strip()
    session_id = req.session_id or "default_session"

    # Delegate to Universal General-Purpose AI Agent
    agent_res = UniversalAIAgent.process_query(
        db=db,
        user_query=query,
        session_id=session_id
    )

    action_name = agent_res.get("action_taken", "universal_ai_response")

    return VoiceCommandResponse(
        voice_query=query,
        voice_response=agent_res["response"],
        action_taken=action_name,
        action_details={"executed_tools": agent_res.get("executed_tools", [])}
    )

@router.post("/assistant/chat")
def process_chat(req: VoiceCommandRequest, db: Session = Depends(get_db)):
    return UniversalAIAgent.process_query(db, req.voice_query, req.session_id or "default_session")

# --- CONVERSATION HISTORY & CLEAR ENDPOINTS ---
@router.get("/conversation/history")
def get_conversation_history(session_id: str = "default_session", db: Session = Depends(get_db)):
    msgs = db.query(pdt_models.ConversationMessageModel).filter(
        pdt_models.ConversationMessageModel.session_id == session_id
    ).order_by(pdt_models.ConversationMessageModel.timestamp.asc()).all()
    return [
        {
            "id": m.id,
            "sender": m.sender,
            "text": m.text,
            "tool_calls": m.tool_calls,
            "time": m.timestamp.strftime("%H:%M")
        } for m in msgs
    ]

@router.post("/conversation/clear")
def clear_conversation_history(session_id: str = "default_session", db: Session = Depends(get_db)):
    db.query(pdt_models.ConversationMessageModel).filter(
        pdt_models.ConversationMessageModel.session_id == session_id
    ).delete()
    db.commit()
    return {"message": "Conversation history cleared successfully"}

# --- REMINDERS & AUTOMATIONS ENDPOINTS ---
@router.get("/reminders", response_model=List[RemindersResponse])
def get_reminders(db: Session = Depends(get_db)):
    return db.query(pdt_models.ReminderModel).all()

@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    rem = db.query(pdt_models.ReminderModel).filter(pdt_models.ReminderModel.id == reminder_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(rem)
    db.commit()
    return {"message": "Reminder deleted successfully"}

# --- SEED DEFAULT TASKS ---
def seed_default_tasks_if_empty(db: Session):
    count = db.query(pdt_models.TaskItemModel).count()
    if count == 0:
        sample_tasks = [
            pdt_models.TaskItemModel(
                title="Deep Work: Project Architecture & Code Review",
                category="Focus",
                start_time="09:00",
                end_time="11:00",
                duration_mins=120,
                is_fixed=True,
                cognitive_load=8.5,
                energy_cost=6.0,
                monetary_cost=0.0,
                mobility_req=False,
                location="Office Desk",
                priority=5,
                status="pending"
            ),
            pdt_models.TaskItemModel(
                title="Client Strategy Meeting",
                category="Meeting",
                start_time="11:15",
                end_time="12:15",
                duration_mins=60,
                is_fixed=True,
                cognitive_load=7.0,
                energy_cost=5.0,
                monetary_cost=0.0,
                mobility_req=False,
                location="Conference Room A",
                priority=4,
                status="pending"
            ),
            pdt_models.TaskItemModel(
                title="Networking Team Lunch",
                category="Personal",
                start_time="12:30",
                end_time="13:30",
                duration_mins=60,
                is_fixed=False,
                cognitive_load=3.0,
                energy_cost=2.0,
                monetary_cost=18.50,
                mobility_req=True,
                location="Downtown Cafe",
                priority=3,
                status="pending"
            ),
            pdt_models.TaskItemModel(
                title="Offsite Vendor Review & Onsite Audit",
                category="Meeting",
                start_time="13:45",
                end_time="15:00",
                duration_mins=75,
                is_fixed=False,
                cognitive_load=6.5,
                energy_cost=5.5,
                monetary_cost=12.00,
                mobility_req=True,
                location="Westside Office",
                priority=4,
                status="pending"
            ),
            pdt_models.TaskItemModel(
                title="Gym Fitness Workout",
                category="Fitness",
                start_time="16:00",
                end_time="17:00",
                duration_mins=60,
                is_fixed=False,
                cognitive_load=2.0,
                energy_cost=8.0,
                monetary_cost=0.0,
                mobility_req=True,
                location="Fitness Center",
                priority=2,
                status="pending"
            )
        ]
        for t in sample_tasks:
            db.add(t)
        db.commit()
        PersonalTwinEngine.synchronize_twin_state(db)

# --- TWIN STATE ENDPOINTS ---
@router.get("/state", response_model=pdt_schemas.TwinStateResponse)
def get_twin_state(db: Session = Depends(get_db)):
    seed_default_tasks_if_empty(db)
    return PersonalTwinEngine.synchronize_twin_state(db)

@router.put("/state", response_model=pdt_schemas.TwinStateResponse)
def update_twin_state(update_data: pdt_schemas.TwinStateBase, db: Session = Depends(get_db)):
    twin = PersonalTwinEngine.get_or_create_twin(db)
    for field, val in update_data.model_dump().items():
        setattr(twin, field, val)
    db.commit()
    db.refresh(twin)
    return twin

# --- TASKS & COMMITMENTS ENDPOINTS ---
@router.get("/tasks", response_model=List[pdt_schemas.TaskItemResponse])
def get_tasks(db: Session = Depends(get_db)):
    seed_default_tasks_if_empty(db)
    return db.query(pdt_models.TaskItemModel).order_by(pdt_models.TaskItemModel.start_time).all()

@router.post("/tasks", response_model=pdt_schemas.TaskItemResponse)
def create_task(task_in: pdt_schemas.TaskItemCreate, db: Session = Depends(get_db)):
    task = pdt_models.TaskItemModel(**task_in.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    PersonalTwinEngine.synchronize_twin_state(db)
    return task

@router.put("/tasks/{task_id}", response_model=pdt_schemas.TaskItemResponse)
def update_task(task_id: int, task_in: pdt_schemas.TaskItemCreate, db: Session = Depends(get_db)):
    task = db.query(pdt_models.TaskItemModel).filter(pdt_models.TaskItemModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for k, v in task_in.model_dump().items():
        setattr(task, k, v)
    db.commit()
    db.refresh(task)
    PersonalTwinEngine.synchronize_twin_state(db)
    return task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(pdt_models.TaskItemModel).filter(pdt_models.TaskItemModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    PersonalTwinEngine.synchronize_twin_state(db)
    return {"message": "Task deleted successfully"}

# --- PREDICTIVE CONFLICT FORECASTING ENDPOINTS ---
@router.get("/predict", response_model=List[pdt_schemas.PredictionForecastResponse])
def get_conflict_predictions(db: Session = Depends(get_db)):
    seed_default_tasks_if_empty(db)
    return PredictiveConflictEngine.forecast_conflicts(db)

# --- AGENTIC PLANNER & UTILITY OPTIMIZER ENDPOINTS ---
@router.post("/planner/generate", response_model=List[pdt_schemas.CandidatePlanResponse])
def generate_candidate_plans(req: pdt_schemas.GoalRequest, db: Session = Depends(get_db)):
    seed_default_tasks_if_empty(db)
    return AgenticPlannerEngine.generate_candidate_plans(
        db=db,
        goal_prompt=req.goal_prompt,
        alpha=req.alpha_completion,
        beta=req.beta_efficiency,
        gamma=req.gamma_feasibility,
        delta=req.delta_intervention
    )

# --- POLICY, CONSENT & AUDIT ENDPOINTS ---
@router.get("/policy/audit", response_model=List[pdt_schemas.PolicyAuditLogResponse])
def get_policy_audit_logs(db: Session = Depends(get_db)):
    return PolicyConsentEngine.get_audit_logs(db)

@router.post("/policy/decision", response_model=pdt_schemas.PolicyAuditLogResponse)
def handle_action_decision(req: pdt_schemas.ActionDecisionRequest, db: Session = Depends(get_db)):
    try:
        return PolicyConsentEngine.handle_user_decision(db, req.audit_id, req.decision)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# --- MEMORY & PREFERENCES ENDPOINTS ---
@router.get("/memory", response_model=List[pdt_schemas.MemoryItemResponse])
def get_memories(db: Session = Depends(get_db)):
    return MemoryService.get_all_memories(db)

@router.post("/memory", response_model=pdt_schemas.MemoryItemResponse)
def add_memory(mem_in: pdt_schemas.MemoryItemCreate, db: Session = Depends(get_db)):
    return MemoryService.add_memory(db, mem_in.type, mem_in.key, mem_in.value, mem_in.relevance_tag)

@router.delete("/memory/{memory_id}")
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    success = MemoryService.delete_memory(db, memory_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete memory or memory not found")
    return {"message": "Memory deleted successfully"}

# --- EXPERIMENTAL ABLATION BENCHMARK ENDPOINTS ---
@router.get("/ablation/scenarios")
def get_benchmark_scenarios():
    return AblationBenchmarkService.get_benchmark_scenarios()

@router.post("/ablation/run")
def run_ablation_benchmark(scenario_id: str = "ALL"):
    return AblationBenchmarkService.run_benchmark_suite(scenario_id)
