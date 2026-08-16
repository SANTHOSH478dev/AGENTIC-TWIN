from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User
from backend.app.services.reports import generate_financial_pdf_report

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/monthly")
def get_monthly_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compile and download a printable PDF report of the user's monthly financial analytics."""
    # Build report file path in temp/scratch space
    report_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "scratch")
    os.makedirs(report_dir, exist_ok=True)
    
    file_path = os.path.join(report_dir, f"cashflow_ai_report_{current_user.id}.pdf")
    
    try:
        generate_financial_pdf_report(current_user.id, db, file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile PDF report: {str(e)}"
        )
        
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Compiled PDF report file not found on disk."
        )
        
    return FileResponse(
        path=file_path,
        filename=f"CashFlow_AI_Financial_Report_{current_user.full_name or 'User'}.pdf",
        media_type="application/pdf"
    )
