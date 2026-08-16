import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TwinStateModel(Base):
    __tablename__ = "twin_state"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user", index=True)
    
    # Dynamic Multi-Resource Parameters
    total_time_capacity_mins = Column(Integer, default=840)  # e.g., 14 working hours
    attention_capacity = Column(Float, default=100.0)        # Max cognitive energy
    current_attention_load = Column(Float, default=35.0)     # Current cognitive demand
    
    daily_budget_limit = Column(Float, default=100.0)      # Daily monetary budget
    current_budget_spent = Column(Float, default=24.50)     # Current spend today
    
    energy_capacity = Column(Float, default=100.0)           # Physical stamina pool
    current_energy_level = Column(Float, default=82.0)      # Current stamina
    
    default_travel_buffer_mins = Column(Integer, default=15) # Mobility travel buffer
    digital_workload_demand = Column(Float, default=40.0)   # Screen time / unread queue (0-100)
    
    last_synchronized_at = Column(DateTime, default=datetime.datetime.utcnow)

class TaskItemModel(Base):
    __tablename__ = "task_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user", index=True)
    
    title = Column(String, nullable=False)
    category = Column(String, default="Work") # Work, Focus, Meeting, Fitness, Personal, Travel
    start_time = Column(String, nullable=False) # e.g. "09:00"
    end_time = Column(String, nullable=False)   # e.g. "10:30"
    duration_mins = Column(Integer, default=90)
    
    is_fixed = Column(Boolean, default=False) # True = fixed commitment; False = flexible task
    cognitive_load = Column(Float, default=5.0) # 1-10
    energy_cost = Column(Float, default=4.0)    # 1-10
    monetary_cost = Column(Float, default=0.0) # $ cost
    mobility_req = Column(Boolean, default=False)
    location = Column(String, default="Office")
    priority = Column(Integer, default=3) # 1 (Lowest) to 5 (Highest)
    status = Column(String, default="pending") # pending, in_progress, completed, rescheduled, cancelled

class PredictionForecastModel(Base):
    __tablename__ = "prediction_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    conflict_type = Column(String, nullable=False) # time_overlap, attention_overload, budget_exceeded, energy_depletion, travel_buffer_failure
    severity = Column(String, default="medium") # high, medium, low
    affected_tasks = Column(JSON, default=[]) # List of task titles/IDs
    description = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.85) # 0.0 - 1.0
    suggested_resolution = Column(Text, nullable=True)

class MemoryItemModel(Base):
    __tablename__ = "memory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, default="preference") # preference, rule, episodic, knowledge
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    is_editable = Column(Boolean, default=True)
    relevance_tag = Column(String, default="general")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CandidatePlanModel(Base):
    __tablename__ = "candidate_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    goal_prompt = Column(Text, nullable=False)
    plan_name = Column(String, nullable=False) # e.g. Plan A, Plan B, Plan C
    tasks_layout = Column(JSON, nullable=False) # List of scheduled tasks
    
    utility_score = Column(Float, default=0.0)
    completion_score = Column(Float, default=0.0)  # C(P)
    resource_efficiency = Column(Float, default=0.0)# R(P)
    feasibility_score = Column(Float, default=0.0)  # F(P)
    intervention_cost = Column(Float, default=0.0)  # I(P)
    
    explanation = Column(Text, nullable=False)
    is_recommended = Column(Boolean, default=False)

class PolicyAuditLogModel(Base):
    __tablename__ = "policy_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    action_type = Column(String, nullable=False) # reschedule_event, budget_allocation, buffer_adjustment, task_insert
    risk_level = Column(String, default="Assisted") # Advisory, Assisted, Authorized
    target_summary = Column(Text, nullable=False)
    payload = Column(JSON, default={})
    status = Column(String, default="pending_user_consent") # pending_user_consent, approved, rejected, auto_executed
    user_decision_at = Column(DateTime, nullable=True)

class ConversationMessageModel(Base):
    __tablename__ = "conversation_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, default="default_session", index=True)
    sender = Column(String, nullable=False) # "user" or "assistant"
    text = Column(Text, nullable=False)
    tool_calls = Column(JSON, default=[]) # List of tool calls executed
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ReminderModel(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user", index=True)
    task_name = Column(String, nullable=False)
    scheduled_time = Column(String, nullable=False)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True) # "daily", "weekly", "mon_wed_fri"
    status = Column(String, default="active") # active, triggered, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AutomationRuleModel(Base):
    __tablename__ = "automation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user", index=True)
    title = Column(String, nullable=False)
    trigger_type = Column(String, nullable=False) # "time", "cognitive_threshold", "budget_threshold"
    condition_expression = Column(Text, nullable=False)
    action_type = Column(String, nullable=False)
    action_payload = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
