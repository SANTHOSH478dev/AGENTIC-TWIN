from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User, Budget, Transaction
from backend.app.schemas.schemas import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budgets", tags=["budgets"])

def calculate_budget_spending(user_id: int, category: str, month: int, year: int, db: Session) -> float:
    """Calculate total debit spending for a specific category, month, and year from transaction tables."""
    # Build date boundary for month
    start_date = datetime(year, month, 1).date()
    if month == 12:
        end_date = datetime(year + 1, 1, 1).date()
    else:
        end_date = datetime(year, month + 1, 1).date()
        
    query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "DEBIT",
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date < end_date
    )
    
    if category.lower() not in ["overall", "all"]:
        query = query.filter(Transaction.category == category)
        
    return query.scalar() or 0.0

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all user budgets, updating their spent totals dynamically from transaction ledger."""
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    for b in budgets:
        b.spent = calculate_budget_spending(current_user.id, b.category, b.month, b.year, db)
    db.commit()
    return budgets

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a category-specific or overall budget."""
    # Check if budget already exists for the category and month
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A budget for {budget_in.category} in period {budget_in.month}/{budget_in.year} already exists."
        )
        
    spent = calculate_budget_spending(current_user.id, budget_in.category, budget_in.month, budget_in.year, db)
    
    db_budget = Budget(
        user_id=current_user.id,
        category=budget_in.category,
        amount=budget_in.amount,
        spent=spent,
        month=budget_in.month,
        year=budget_in.year
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.patch("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    amount: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modify the limit amount of an existing budget."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
        
    budget.amount = amount
    # Recalculate spent
    budget.spent = calculate_budget_spending(current_user.id, budget.category, budget.month, budget.year, db)
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a budget configuration."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    db.delete(budget)
    db.commit()
    return None
