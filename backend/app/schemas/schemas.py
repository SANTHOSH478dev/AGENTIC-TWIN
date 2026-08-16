from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import List, Optional, Dict, Any

# Authentication & User
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Bank Uploads
class BankUploadResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    total_rows: int
    valid_rows: int
    duplicate_rows: int
    rejected_rows: int
    processing_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True

# Transactions
class TransactionResponse(BaseModel):
    id: int
    transaction_date: date
    raw_description: str
    clean_description: Optional[str] = None
    amount: float
    balance: Optional[float] = None
    transaction_type: str
    category: str
    confidence: float
    classification_method: str
    weekend_indicator: bool
    is_recurring: bool
    merchant: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionUpdateCategory(BaseModel):
    category: str

# Budgets
class BudgetBase(BaseModel):
    category: str
    amount: float
    month: int
    year: int

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    spent: float
    created_at: datetime

    class Config:
        from_attributes = True

# Anomalies
class AnomalyResponse(BaseModel):
    id: int
    transaction_id: int
    anomaly_score: float
    reason: str
    transaction: TransactionResponse
    created_at: datetime

    class Config:
        from_attributes = True

# Recurring Payments
class RecurringPaymentResponse(BaseModel):
    id: int
    merchant: str
    average_amount: float
    frequency_days: int
    next_expected_date: Optional[date] = None
    confidence: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# AI Insights
class FinancialInsightResponse(BaseModel):
    id: int
    title: str
    content: str
    type: str
    calculation_basis: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# AI Chat
class AIChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    message: str
    detected_intent: Optional[str] = None
    tools_called: Optional[List[Dict[str, Any]]] = None
    response_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AIChatResponse(BaseModel):
    session_id: str
    message: ChatMessageResponse

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    messages: Optional[List[ChatMessageResponse]] = None

    class Config:
        from_attributes = True

# Predictions
class PredictionItem(BaseModel):
    target_month: int
    target_year: int
    predicted_expense: float
    predicted_income: Optional[float] = None
    predicted_cashflow: Optional[float] = None

class PredictionResponse(BaseModel):
    predictions: List[PredictionItem]
    model_metrics: Dict[str, Any]
    evaluation_table: List[Dict[str, Any]]
    explanation: str

# Analytics
class DashboardSummaryResponse(BaseModel):
    current_balance: float
    total_income: float
    total_expenses: float
    net_cash_flow: float
    savings_rate: float
    avg_daily_spending: float
    highest_spending_category: str
    predicted_next_month_expense: float
    health_score: float

class CategorySpending(BaseModel):
    category: str
    amount: float
    percentage: float

class MerchantSpending(BaseModel):
    merchant: str
    amount: float
    count: int

class MonthlyTrend(BaseModel):
    month_name: str
    income: float
    expense: float
    net_cash_flow: float

# Financial Health Score
class FactorScore(BaseModel):
    score: float
    max_score: float
    evaluation: str

class HealthScoreResponse(BaseModel):
    overall_score: float
    score_category: str
    factors: Dict[str, FactorScore]
    explanation: str
    improvement_areas: List[str]

# ML Retraining & Monitoring
class ModelTrainingLogResponse(BaseModel):
    id: int
    trained_at: datetime
    records_count: int
    accuracy_score: float
    model_version: str
    status: str

    class Config:
        from_attributes = True

class RetrainResponse(BaseModel):
    message: str
    status: str
    accuracy_score: float
    records_count: int
    model_version: str

# Security Audit Logs
class SecurityAuditLogResponse(BaseModel):
    id: int
    action: str
    ip_address: Optional[str] = "127.0.0.1"
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

# What-If Scenario Simulation
class SimulationRequest(BaseModel):
    category_reductions: Dict[str, float] = Field(default_factory=dict) # e.g. {"Food & Dining": 20.0, "Shopping": 10.0} (percentages)
    cancel_recurring_ids: List[int] = Field(default_factory=list) # IDs of recurring payment records to simulate canceling

class SimulationResponse(BaseModel):
    expected_savings: float
    current_health_score: float
    updated_health_score: float
    explanation: str
    comparison_table: List[Dict[str, Any]]

