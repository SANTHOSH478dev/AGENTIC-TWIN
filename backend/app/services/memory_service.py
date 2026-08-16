from typing import List
from sqlalchemy.orm import Session
from backend.app.models.pdt_models import MemoryItemModel

class MemoryService:
    """
    Stage 3: Memory Subsystem
    Manages stable editable preferences, rules, and historical episodic logs.
    """

    DEFAULT_PREFERENCES = [
        {
            "type": "preference",
            "key": "deep_work_window",
            "value": "Preferred high-cognitive focus period: 09:00 - 12:30",
            "relevance_tag": "focus"
        },
        {
            "type": "preference",
            "key": "travel_buffer_rule",
            "value": "Always maintain a minimum 15-minute buffer before offsite mobility tasks",
            "relevance_tag": "mobility"
        },
        {
            "type": "rule",
            "key": "budget_cap",
            "value": "Maximum allowed daily operational expense: $100.00",
            "relevance_tag": "finance"
        },
        {
            "type": "rule",
            "key": "evening_rest_boundary",
            "value": "Do not schedule high-cognitive tasks (load >= 7) after 20:00",
            "relevance_tag": "energy"
        },
        {
            "type": "episodic",
            "key": "past_outcome_reschedule",
            "value": "User accepted moving flexible gym session to 17:30 when meeting overlapped",
            "relevance_tag": "history"
        }
    ]

    @staticmethod
    def seed_default_memories_if_empty(db: Session) -> List[MemoryItemModel]:
        count = db.query(MemoryItemModel).count()
        if count == 0:
            for item in MemoryService.DEFAULT_PREFERENCES:
                mem = MemoryItemModel(
                    type=item["type"],
                    key=item["key"],
                    value=item["value"],
                    relevance_tag=item["relevance_tag"],
                    is_editable=True
                )
                db.add(mem)
            db.commit()
        return db.query(MemoryItemModel).all()

    @staticmethod
    def get_all_memories(db: Session) -> List[MemoryItemModel]:
        MemoryService.seed_default_memories_if_empty(db)
        return db.query(MemoryItemModel).all()

    @staticmethod
    def add_memory(db: Session, memory_type: str, key: str, value: str, tag: str = "general") -> MemoryItemModel:
        mem = MemoryItemModel(
            type=memory_type,
            key=key,
            value=value,
            relevance_tag=tag,
            is_editable=True
        )
        db.add(mem)
        db.commit()
        db.refresh(mem)
        return mem

    @staticmethod
    def update_memory(db: Session, memory_id: int, value: str) -> MemoryItemModel:
        mem = db.query(MemoryItemModel).filter(MemoryItemModel.id == memory_id).first()
        if mem and mem.is_editable:
            mem.value = value
            db.commit()
            db.refresh(mem)
        return mem

    @staticmethod
    def delete_memory(db: Session, memory_id: int) -> bool:
        mem = db.query(MemoryItemModel).filter(MemoryItemModel.id == memory_id).first()
        if mem and mem.is_editable:
            db.delete(mem)
            db.commit()
            return True
        return False
