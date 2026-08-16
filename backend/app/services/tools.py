from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
import pandas as pd
from typing import Dict, Any, List, Optional

from backend.app.models.models import Transaction, Budget, RecurringPayment, AnomalyResult
from backend.app.services.analytics import get_category_spending, get_monthly_trends, get_top_merchants, calculate_health_score
from backend.app.services.predictions import run_predictions
from backend.app.services.anomalies import detect_and_log_anomalies
from backend.app.services.recurring import detect_recurring_payments

def run_total_expense(db: Session, user_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
    """Calculate the total expense in a given date range."""
    query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "DEBIT"
    )
    if start_date:
        query = query.filter(Transaction.transaction_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= date.fromisoformat(end_date))
        
    total = query.scalar() or 0.0
    return {"total_expense": round(total, 2), "start_date": start_date, "end_date": end_date}

def run_total_income(db: Session, user_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
    """Calculate the total income in a given date range."""
    query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "CREDIT"
    )
    if start_date:
        query = query.filter(Transaction.transaction_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= date.fromisoformat(end_date))
        
    total = query.scalar() or 0.0
    return {"total_income": round(total, 2), "start_date": start_date, "end_date": end_date}

def run_category_spending(db: Session, user_id: int, category: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
    """Calculate how much was spent on a specific category."""
    query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "DEBIT",
        Transaction.category.ilike(category)
    )
    if start_date:
        query = query.filter(Transaction.transaction_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= date.fromisoformat(end_date))
        
    total = query.scalar() or 0.0
    return {"category": category, "total_spent": round(total, 2), "start_date": start_date, "end_date": end_date}

def run_monthly_cashflow(db: Session, user_id: int) -> Dict[str, Any]:
    """Retrieve month-over-month income, expense, and cash flow trends."""
    trends = get_monthly_trends(user_id, db)
    return {"trends": [t.model_dump() for t in trends]}

def run_top_merchants(db: Session, user_id: int, limit: int = 5) -> Dict[str, Any]:
    """Retrieve top merchants by debit volume."""
    merchants = get_top_merchants(user_id, db, limit)
    return {"merchants": [m.model_dump() for m in merchants]}

def run_recurring_payments(db: Session, user_id: int) -> Dict[str, Any]:
    """Fetch detected recurring subscriptions and bills."""
    payments = detect_recurring_payments(user_id, db)
    return {"recurring_payments": [
        {
            "merchant": p.merchant,
            "average_amount": p.average_amount,
            "frequency_days": p.frequency_days,
            "next_expected_date": str(p.next_expected_date) if p.next_expected_date else None,
            "confidence": p.confidence
        }
        for p in payments
    ]}

def run_unusual_transactions(db: Session, user_id: int) -> Dict[str, Any]:
    """Retrieve statistical outlier spending transactions."""
    anoms = detect_and_log_anomalies(user_id, db)
    return {"unusual_transactions": [
        {
            "date": str(a.transaction.transaction_date),
            "merchant": a.transaction.merchant,
            "amount": a.transaction.amount,
            "category": a.transaction.category,
            "reason": a.reason
        }
        for a in anoms
    ]}

def run_weekend_spending(db: Session, user_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
    """Compare weekend (Sat/Sun) vs weekday spending totals."""
    query = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "DEBIT"
    )
    if start_date:
        query = query.filter(Transaction.transaction_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= date.fromisoformat(end_date))
        
    df = pd.DataFrame([{"weekend": t.weekend_indicator, "amount": t.amount} for t in query.all()])
    if df.empty:
        return {"weekend_spending": 0.0, "weekday_spending": 0.0, "weekend_ratio": 0.0}
        
    weekend_sum = df[df["weekend"] == True]["amount"].sum()
    weekday_sum = df[df["weekend"] == False]["amount"].sum()
    total = weekend_sum + weekday_sum
    
    return {
        "weekend_spending": round(float(weekend_sum), 2),
        "weekday_spending": round(float(weekday_sum), 2),
        "weekend_ratio": round(float(weekend_sum / total * 100), 2) if total > 0 else 0.0
    }

def run_budget_status(db: Session, user_id: int) -> Dict[str, Any]:
    """Retrieve active budget progress against limits."""
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    # Dynamic calculations
    today = datetime.now()
    results = []
    for b in budgets:
        # recalculate spent
        from backend.app.api.budgets import calculate_budget_spending
        spent = calculate_budget_spending(user_id, b.category, b.month, b.year, db)
        b.spent = spent
        db.commit()
        
        ratio = spent / b.amount if b.amount > 0 else 0.0
        status_label = "Safe"
        if ratio >= 1.0:
            status_label = "Exceeded"
        elif ratio >= 0.85:
            status_label = "Critical"
        elif ratio >= 0.70:
            status_label = "Warning"
            
        results.append({
            "category": b.category,
            "limit": b.amount,
            "spent": round(spent, 2),
            "remaining": round(max(0.0, b.amount - spent), 2),
            "percentage_used": round(ratio * 100, 1),
            "status": status_label
        })
    return {"budgets": results}

def run_expense_prediction(db: Session, user_id: int) -> Dict[str, Any]:
    """Retrieve predictive expense forecasting projections."""
    res = run_predictions(user_id, db)
    return {
        "predictions": [p.model_dump() for p in res.predictions],
        "explanation": res.explanation,
        "evaluation": res.evaluation_table
    }

def run_savings_rate(db: Session, user_id: int) -> Dict[str, Any]:
    """Retrieve historical savings rate performance indicators."""
    health = calculate_health_score(user_id, db)
    return {
        "savings_rate": health.factors["savings"].score,
        "income_vs_expense_evaluation": health.factors["ratio"].evaluation,
        "financial_health_score": health.overall_score
    }
