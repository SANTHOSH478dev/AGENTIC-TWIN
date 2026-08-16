from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User
from backend.app.schemas.schemas import RecurringPaymentResponse
from backend.app.services import recurring

router = APIRouter(prefix="/recurring-payments", tags=["recurring-payments"])

@router.get("", response_model=List[RecurringPaymentResponse])
def get_recurring_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve recurring billings and subscription patterns detected for user."""
    return recurring.detect_recurring_payments(current_user.id, db)
