from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User, SecurityAuditLog
from backend.app.schemas.schemas import SecurityAuditLogResponse

router = APIRouter(prefix="/security", tags=["security-audit"])

@router.get("/logs", response_model=List[SecurityAuditLogResponse])
def get_security_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve secure activity logs, sessions, and audits for the user's workspace."""
    # Write access log
    audit = SecurityAuditLog(
        user_id=current_user.id,
        action="ACCESS_SECURITY_AUDIT",
        ip_address="127.0.0.1",
        status="SUCCESS"
    )
    db.add(audit)
    db.commit()

    return db.query(SecurityAuditLog).filter(SecurityAuditLog.user_id == current_user.id).order_by(SecurityAuditLog.timestamp.desc()).limit(100).all()
