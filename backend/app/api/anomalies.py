from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User
from backend.app.schemas.schemas import AnomalyResponse
from backend.app.services import anomalies

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

@router.get("", response_model=List[AnomalyResponse])
def get_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Scan and retrieve unusual/outlier transaction events for the user."""
    return anomalies.detect_and_log_anomalies(current_user.id, db)
