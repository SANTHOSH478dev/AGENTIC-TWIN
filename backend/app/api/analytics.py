from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User
from backend.app.schemas.schemas import DashboardSummaryResponse, CategorySpending, MerchantSpending, MonthlyTrend, HealthScoreResponse
from backend.app.services import analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve top-level KPI dashboard metrics."""
    return analytics.get_dashboard_summary(current_user.id, db)

@router.get("/categories", response_model=List[CategorySpending])
def get_categories(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve aggregated debits category wise."""
    return analytics.get_category_spending(current_user.id, db, start_date, end_date)

@router.get("/merchants", response_model=List[MerchantSpending])
def get_merchants(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve top spending merchant lists."""
    return analytics.get_top_merchants(current_user.id, db, limit)

@router.get("/trends", response_model=List[MonthlyTrend])
def get_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve monthly credit-debit-cashflow trends."""
    return analytics.get_monthly_trends(current_user.id, db)

@router.get("/health-score", response_model=HealthScoreResponse)
def get_health_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate and retrieve detailed Financial Health Score reports."""
    return analytics.calculate_health_score(current_user.id, db)
