import datetime
from typing import List
from sqlalchemy.orm import Session
from backend.app.models.pdt_models import PolicyAuditLogModel, TaskItemModel
from backend.app.services.twin_engine import PersonalTwinEngine

class PolicyConsentEngine:
    """
    Stage 5: Policy and Consent Layer
    Separates language-model reasoning from external action execution.
    Classifies operations into 3 Risk Tiers:
    1. Advisory: Informational suggestions
    2. Assisted: Confirmation-gated (Requires 1-click user consent)
    3. Authorized: Pre-approved low-risk execution
    """

    @staticmethod
    def seed_initial_audit_logs_if_empty(db: Session) -> List[PolicyAuditLogModel]:
        count = db.query(PolicyAuditLogModel).count()
        if count == 0:
            sample_logs = [
                PolicyAuditLogModel(
                    action_type="reschedule_event",
                    risk_level="Assisted",
                    target_summary="Reschedule 'Gym Workout' to 17:30 to eliminate meeting overlap",
                    payload={"task": "Gym Workout", "old_time": "16:00", "new_time": "17:30"},
                    status="pending_user_consent"
                ),
                PolicyAuditLogModel(
                    action_type="budget_allocation",
                    risk_level="Assisted",
                    target_summary="Approve $18.50 expense for Client Lunch Meeting",
                    payload={"task": "Client Lunch", "amount": 18.50},
                    status="pending_user_consent"
                ),
                PolicyAuditLogModel(
                    action_type="buffer_adjustment",
                    risk_level="Authorized",
                    target_summary="Increase mobility travel buffer from 15 mins to 20 mins due to high congestion",
                    payload={"buffer_mins": 20},
                    status="auto_executed",
                    user_decision_at=datetime.datetime.utcnow()
                ),
                PolicyAuditLogModel(
                    action_type="tradeoff_advisory",
                    risk_level="Advisory",
                    target_summary="Advisory: 3 hours of high cognitive focus detected today. Rest recommended.",
                    payload={"cognitive_hours": 3.0},
                    status="auto_executed",
                    user_decision_at=datetime.datetime.utcnow()
                )
            ]
            for log in sample_logs:
                db.add(log)
            db.commit()
        return db.query(PolicyAuditLogModel).all()

    @staticmethod
    def get_audit_logs(db: Session) -> List[PolicyAuditLogModel]:
        PolicyConsentEngine.seed_initial_audit_logs_if_empty(db)
        return db.query(PolicyAuditLogModel).order_by(PolicyAuditLogModel.timestamp.desc()).all()

    @staticmethod
    def create_action_request(
        db: Session,
        action_type: str,
        risk_level: str,
        target_summary: str,
        payload: dict
    ) -> PolicyAuditLogModel:
        status = "auto_executed" if risk_level in ["Advisory", "Authorized"] else "pending_user_consent"
        audit = PolicyAuditLogModel(
            action_type=action_type,
            risk_level=risk_level,
            target_summary=target_summary,
            payload=payload,
            status=status,
            user_decision_at=datetime.datetime.utcnow() if status == "auto_executed" else None
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

    @staticmethod
    def handle_user_decision(db: Session, audit_id: int, decision: str) -> PolicyAuditLogModel:
        audit = db.query(PolicyAuditLogModel).filter(PolicyAuditLogModel.id == audit_id).first()
        if not audit:
            raise ValueError("Audit record not found")

        audit.user_decision_at = datetime.datetime.utcnow()
        if decision.lower() == "approve":
            audit.status = "approved"
            # Execute actual action in Stage 6
            PolicyConsentEngine._execute_approved_action(db, audit)
        else:
            audit.status = "rejected"

        db.commit()
        db.refresh(audit)
        
        # Synchronize twin state after action execution/rejection
        PersonalTwinEngine.synchronize_twin_state(db)
        return audit

    @staticmethod
    def _execute_approved_action(db: Session, audit: PolicyAuditLogModel):
        payload = audit.payload or {}
        if audit.action_type == "reschedule_event":
            task_name = payload.get("task")
            new_time = payload.get("new_time")
            if task_name and new_time:
                task = db.query(TaskItemModel).filter(TaskItemModel.title == task_name).first()
                if task:
                    task.start_time = new_time
                    task.status = "rescheduled"
        elif audit.action_type == "budget_allocation":
            amount = payload.get("amount", 0.0)
            twin = PersonalTwinEngine.get_or_create_twin(db)
            twin.current_budget_spent = round(twin.current_budget_spent + amount, 2)
