from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User, SecurityAuditLog, RecurringPayment, Transaction
from backend.app.schemas.schemas import PredictionResponse, SimulationRequest, SimulationResponse
from backend.app.services import predictions
from backend.app.services.analytics import get_dashboard_summary

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.get("/expenses", response_model=PredictionResponse)
def predict_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve expense and cash flow predictions along with evaluation metrics."""
    return predictions.run_predictions(current_user.id, db)

@router.post("/simulate", response_model=SimulationResponse)
def simulate_savings_scenario(
    payload: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate "What-If" personal finance budget reductions and subscription cancellations.
    Calculates expected savings and projects an updated financial health score.
    """
    # 1. Fetch current baseline statistics
    summary = get_dashboard_summary(current_user.id, db)
    total_income = summary.total_income
    total_expense = summary.total_expenses
    current_health_score = summary.health_score
    
    if total_income <= 0:
        total_income = 50000.0 # safe fallback baseline for empty profile simulation
        
    if total_expense <= 0:
        total_expense = 35000.0 # safe fallback baseline
        
    expected_savings = 0.0
    actions_taken = []
    
    # 2. Simulate Category Reductions
    for category, pct_reduction in payload.category_reductions.items():
        if pct_reduction <= 0:
            continue
            
        # Calculate average spending in this category for user
        cat_total = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == category,
            Transaction.transaction_type == "DEBIT"
        ).scalar() or 0.0
        
        # If user has no historical records, mock a baseline for visualization
        if cat_total == 0:
            cat_total = 8000.0 # mock standard monthly spending for that category
            
        savings = cat_total * (pct_reduction / 100.0)
        expected_savings += savings
        actions_taken.append(f"Reduced '{category}' budget by {pct_reduction}% (Saved ₹{savings:.2f})")
        
    # 3. Simulate Recurring Cancelations
    for rp_id in payload.cancel_recurring_ids:
        rp = db.query(RecurringPayment).filter(
            RecurringPayment.id == rp_id,
            RecurringPayment.user_id == current_user.id
        ).first()
        
        if rp:
            expected_savings += rp.average_amount
            actions_taken.append(f"Canceled subscription '{rp.merchant}' (Saved ₹{rp.average_amount:.2f}/mo)")
            
    # Calculate updated expense and savings rate
    updated_expense = max(0.0, total_expense - expected_savings)
    current_savings_rate = max(0.0, ((total_income - total_expense) / total_income) * 100)
    updated_savings_rate = max(0.0, ((total_income - updated_expense) / total_income) * 100)
    
    # Project updated health score
    # Savings rate has a 30% weight in the health score.
    savings_improvement = (updated_savings_rate - current_savings_rate) * 0.5
    updated_health_score = min(100.0, current_health_score + savings_improvement)
    updated_health_score = round(max(0.0, updated_health_score), 1)
    expected_savings = round(expected_savings, 2)
    
    # Build explanation summary
    if expected_savings > 0:
        actions_str = "; ".join(actions_taken)
        explanation = (
            f"Simulated actions completed: {actions_str}. "
            f"By executing these adjustments, you would reduce monthly outflows by ₹{expected_savings:.2f}. "
            f"This raises your savings rate from {current_savings_rate:.1f}% to {updated_savings_rate:.1f}%, "
            f"increasing your Projected Financial Health Score to {updated_health_score}/100."
        )
    else:
        explanation = "No adjustments simulated. Configure category reductions or cancel recurring subscriptions to simulate savings."
        
    # Comparison table payload
    comparison_table = [
        {
            "metric": "Total Expenses",
            "current": f"₹{total_expense:.2f}",
            "projected": f"₹{updated_expense:.2f}",
            "difference": f"-₹{expected_savings:.2f}"
        },
        {
            "metric": "Savings Rate",
            "current": f"{current_savings_rate:.1f}%",
            "projected": f"{updated_savings_rate:.1f}%",
            "difference": f"+{(updated_savings_rate - current_savings_rate):.1f}%"
        },
        {
            "metric": "Financial Health Score",
            "current": f"{current_health_score}/100",
            "projected": f"{updated_health_score}/100",
            "difference": f"+{(updated_health_score - current_health_score):.1f} pts"
        }
    ]
    
    # Log the simulation audit trail
    audit = SecurityAuditLog(
        user_id=current_user.id,
        action="RUN_SAVINGS_SIMULATION",
        ip_address="127.0.0.1",
        status="SUCCESS"
    )
    db.add(audit)
    db.commit()
    
    return SimulationResponse(
        expected_savings=expected_savings,
        current_health_score=current_health_score,
        updated_health_score=updated_health_score,
        explanation=explanation,
        comparison_table=comparison_table
    )
