from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, JSON, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    uploads = relationship("BankUpload", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("FinancialInsight", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    tool_logs = relationship("AIToolLog", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("PredictionResult", back_populates="user", cascade="all, delete-orphan")
    recurring_payments = relationship("RecurringPayment", back_populates="user", cascade="all, delete-orphan")
    corrections = relationship("UserCategoryCorrection", back_populates="user", cascade="all, delete-orphan")
    training_logs = relationship("ModelTrainingLog", back_populates="user", cascade="all, delete-orphan")
    security_logs = relationship("SecurityAuditLog", back_populates="user", cascade="all, delete-orphan")

class BankUpload(Base):
    __tablename__ = "bank_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False) # In bytes
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    duplicate_rows = Column(Integer, default=0)
    rejected_rows = Column(Integer, default=0)
    processing_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="uploads")
    transactions = relationship("Transaction", back_populates="upload", cascade="all, delete-orphan")

class TransactionCategory(Base):
    __tablename__ = "transaction_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    upload_id = Column(Integer, ForeignKey("bank_uploads.id", ondelete="SET NULL"), nullable=True, index=True)
    
    transaction_date = Column(Date, nullable=False, index=True)
    raw_description = Column(String, nullable=False)
    clean_description = Column(String, nullable=True)
    amount = Column(Float, nullable=False) # Positive value
    balance = Column(Float, nullable=True) # Running balance
    transaction_type = Column(String, nullable=False, index=True) # "DEBIT" or "CREDIT"
    
    category = Column(String, nullable=False, default="Other", index=True)
    confidence = Column(Float, default=1.0)
    classification_method = Column(String, nullable=False, default="rule") # "rule", "ml", "manual"
    model_version = Column(String, nullable=True)
    
    weekend_indicator = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    merchant = Column(String, nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    upload = relationship("BankUpload", back_populates="transactions")
    anomalies = relationship("AnomalyResult", back_populates="transaction", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_user_date", "user_id", "transaction_date"),
        Index("idx_user_category", "user_id", "category"),
    )

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String, nullable=False) # Overall budget is marked as "All" or "Overall"
    amount = Column(Float, nullable=False)
    spent = Column(Float, default=0.0)
    month = Column(Integer, nullable=False) # 1-12
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    
    __table_args__ = (
        Index("idx_user_budget_period", "user_id", "category", "month", "year"),
    )

class FinancialInsight(Base):
    __tablename__ = "financial_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, nullable=False) # "INFO", "POSITIVE", "WARNING", "IMPORTANT"
    calculation_basis = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="insights")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, index=True) # UUID string preferred
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False) # "user" or "assistant"
    message = Column(Text, nullable=False)
    detected_intent = Column(String, nullable=True)
    tools_called = Column(JSON, nullable=True) # Log of tools execution details
    response_metadata = Column(JSON, nullable=True) # Explainability info (calculation basis)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")

class AIToolLog(Base):
    __tablename__ = "ai_tool_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String, nullable=True)
    tool_name = Column(String, nullable=False)
    arguments = Column(JSON, nullable=True)
    result_summary = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tool_logs")

class PredictionResult(Base):
    __tablename__ = "prediction_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_date = Column(Date, nullable=False) # Date prediction was run
    target_month = Column(Integer, nullable=False)
    target_year = Column(Integer, nullable=False)
    predicted_income = Column(Float, nullable=True)
    predicted_expense = Column(Float, nullable=False)
    predicted_cashflow = Column(Float, nullable=True)
    confidence_interval_lower = Column(Float, nullable=True)
    confidence_interval_upper = Column(Float, nullable=True)
    metrics_json = Column(JSON, nullable=True) # MAE, RMSE, MAPE of evaluation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="predictions")

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    anomaly_score = Column(Float, nullable=False) # e.g. Z-score deviation or isolation score
    reason = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    transaction = relationship("Transaction", back_populates="anomalies")

class RecurringPayment(Base):
    __tablename__ = "recurring_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant = Column(String, nullable=False)
    average_amount = Column(Float, nullable=False)
    frequency_days = Column(Integer, nullable=False) # Average interval in days
    next_expected_date = Column(Date, nullable=True)
    confidence = Column(Float, nullable=False) # between 0.0 and 1.0
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="recurring_payments")

class UserCategoryCorrection(Base):
    __tablename__ = "user_category_corrections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, nullable=False) # ID of transaction corrected
    raw_description = Column(String, nullable=False)
    original_category = Column(String, nullable=False)
    corrected_category = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="corrections")

class ModelTrainingLog(Base):
    __tablename__ = "model_training_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    records_count = Column(Integer, nullable=False)
    accuracy_score = Column(Float, nullable=False)
    model_version = Column(String, nullable=False)
    status = Column(String, nullable=False, default="SUCCESS") # SUCCESS or FAILED
    
    # Relationships
    user = relationship("User", back_populates="training_logs")

class SecurityAuditLog(Base):
    __tablename__ = "security_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False) # LOGIN, UPLOAD, RETRAIN, ACCESS, SIMULATE
    ip_address = Column(String, nullable=True, default="127.0.0.1")
    status = Column(String, nullable=False, default="SUCCESS") # SUCCESS or WARN
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="security_logs")
