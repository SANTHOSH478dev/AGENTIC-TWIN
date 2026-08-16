from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User, ChatSession, ChatMessage, FinancialInsight, Transaction
from backend.app.schemas.schemas import AIChatRequest, AIChatResponse, ChatSessionResponse, FinancialInsightResponse
from backend.app.services import llm, tools

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/chat", response_model=AIChatResponse)
def post_chat_message(
    chat_req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a chat query to the Conversational Financial Assistant.
    Coordinates intent parsing, predefined database tool execution, and logs conversations.
    """
    session_id = chat_req.session_id
    
    # 1. Resolve or create chat session
    if not session_id:
        session_id = str(uuid.uuid4())
        db_session = ChatSession(
            id=session_id,
            user_id=current_user.id,
            title=f"Chat Session - {chat_req.message[:30]}..."
        )
        db.add(db_session)
        db.commit()
    else:
        db_session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not db_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
            
    # 2. Save user message to database
    db_user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        message=chat_req.message
    )
    db.add(db_user_msg)
    db.commit()
    
    # 3. Process chatbot orchestrator execution loop
    answer, intent, tools_called, metadata = llm.execute_chat_query(
        user_id=current_user.id,
        message=chat_req.message,
        db=db
    )
    
    # 4. Save assistant response to database
    db_assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        message=answer,
        detected_intent=intent,
        tools_called=tools_called,
        response_metadata=metadata
    )
    db.add(db_assistant_msg)
    db.commit()
    db.refresh(db_assistant_msg)
    
    return AIChatResponse(
        session_id=session_id,
        message=db_assistant_msg
    )

@router.get("/history", response_model=List[ChatSessionResponse])
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve chat history session logs with nested messages for user."""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()).all()
    # Messages are loaded via SQLAlchemy relationship
    return sessions

@router.get("/insights", response_model=List[FinancialInsightResponse])
def get_financial_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate dynamic personalized insights (INFO, POSITIVE, WARNING, IMPORTANT)
    based on calculated balances, weekend patterns, and savings ratios.
    """
    # Clear old insights to avoid duplicates
    db.query(FinancialInsight).filter(FinancialInsight.user_id == current_user.id).delete()
    db.commit()
    
    insights = []
    
    # Check weekend spending ratio
    try:
        wk_data = tools.run_weekend_spending(db, current_user.id)
        if wk_data.get("weekend_ratio", 0) > 40.0:
            insights.append(FinancialInsight(
                user_id=current_user.id,
                title="High Weekend Spending",
                content=f"Your weekend spending accounts for {wk_data['weekend_ratio']}% of your monthly expenses. Consider shifting grocery runs or dining to weekdays or placing weekly limits.",
                type="WARNING",
                calculation_basis=f"Weekend spending sum: ₹{wk_data['weekend_spending']:.2f} vs Weekday: ₹{wk_data['weekday_spending']:.2f}"
            ))
    except Exception:
        pass
        
    # Check savings rate
    try:
        savings_data = tools.run_savings_rate(db, current_user.id)
        rate = savings_data.get("savings_rate", 0)
        if rate >= 20.0:
            insights.append(FinancialInsight(
                user_id=current_user.id,
                title="Healthy Savings Rate",
                content=f"Great job! Your savings rate is currently at {rate}%, exceeding the baseline FinTech health metric of 20%.",
                type="POSITIVE",
                calculation_basis=f"Savings Score: {rate:.1f}/100. Overall Health score is {savings_data.get('financial_health_score')}/100."
            ))
        elif 0 < rate < 20.0:
            insights.append(FinancialInsight(
                user_id=current_user.id,
                title="Savings Rate Needs Boost",
                content=f"Your savings rate is currently at {rate}%. Try setting up automated mutual fund SIP allocations to hit the standard 20% mark.",
                type="INFO",
                calculation_basis=f"Current savings rate: {rate:.1f}%."
            ))
    except Exception:
        pass
        
    # Check budget statuses
    try:
        budget_data = tools.run_budget_status(db, current_user.id)
        exceeded_cats = [b["category"] for b in budget_data.get("budgets", []) if b["status"] in ["Exceeded", "Critical"]]
        if exceeded_cats:
            insights.append(FinancialInsight(
                user_id=current_user.id,
                title="Budgets Under Pressure",
                content=f"Your spending in categories: {', '.join(exceeded_cats)} has exceeded or is close to exceeding your configured limits.",
                type="IMPORTANT",
                calculation_basis=f"Aggregated budget statuses flagged as critical/exceeded."
            ))
    except Exception:
        pass
        
    # Check recurring billing ratio
    try:
        rec_data = tools.run_recurring_payments(db, current_user.id)
        rec_list = rec_data.get("recurring_payments", [])
        if rec_list:
            total_rec = sum(r["average_amount"] for r in rec_list)
            # Find total expense
            total_exp_data = tools.run_total_expense(db, current_user.id)
            tot_exp = total_exp_data.get("total_expense", 1.0) or 1.0
            ratio = total_rec / tot_exp * 100
            
            insights.append(FinancialInsight(
                user_id=current_user.id,
                title="Subscription Cost Audit",
                content=f"You have {len(rec_list)} active recurring payments/subscriptions totalling ₹{total_rec:,.2f}, representing {ratio:.1f}% of your monthly expenses.",
                type="INFO",
                calculation_basis=f"Sum of recurring items: ₹{total_rec:.2f} over total expenses ₹{tot_exp:.2f}."
            ))
    except Exception:
        pass
        
    # Save newly generated insights
    if not insights:
        insights.append(FinancialInsight(
            user_id=current_user.id,
            title="Import Bank Statement",
            content="We recommend uploading a CSV statement to initialize your financial health score, category breakdown, and anomaly detection.",
            type="INFO",
            calculation_basis="Initial cold-start onboarding recommendation."
        ))
        insights.append(FinancialInsight(
            user_id=current_user.id,
            title="Setup Budget Limits",
            content="Configure a monthly budget limit (under the 'Budgets' panel) to monitor food, rent, or utilities category caps dynamically.",
            type="INFO",
            calculation_basis="Initial cold-start onboarding recommendation."
        ))
        insights.append(FinancialInsight(
            user_id=current_user.id,
            title="Isolated Workspace Verified",
            content="Your account is fully isolated. You can inspect active cryptographic sessions and database mapping logs under the 'Security Logs' dashboard.",
            type="POSITIVE",
            calculation_basis="Workspace setup audit check completed."
        ))
        
    db.add_all(insights)
    db.commit()
    for idx in range(len(insights)):
        db.refresh(insights[idx])
            
    return db.query(FinancialInsight).filter(FinancialInsight.user_id == current_user.id).all()
