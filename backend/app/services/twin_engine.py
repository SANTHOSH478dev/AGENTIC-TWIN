import datetime
from sqlalchemy.orm import Session
from backend.app.models.pdt_models import TwinStateModel, TaskItemModel

class PersonalTwinEngine:
    """
    Stage 2: Personal Twin Layer Engine
    Maintains dynamic multi-resource representation across:
    - Time availability
    - Cognitive Attention demand
    - Daily Budget
    - Physical Energy / Stamina
    - Mobility & Travel Buffer
    - Digital Workload
    """
    
    @staticmethod
    def get_or_create_twin(db: Session, user_id: str = "default_user") -> TwinStateModel:
        twin = db.query(TwinStateModel).filter(TwinStateModel.user_id == user_id).first()
        if not twin:
            twin = TwinStateModel(
                user_id=user_id,
                total_time_capacity_mins=840, # 14 hours active day
                attention_capacity=100.0,
                current_attention_load=35.0,
                daily_budget_limit=100.0,
                current_budget_spent=24.50,
                energy_capacity=100.0,
                current_energy_level=82.0,
                default_travel_buffer_mins=15,
                digital_workload_demand=40.0
            )
            db.add(twin)
            db.commit()
            db.refresh(twin)
        return twin

    @staticmethod
    def synchronize_twin_state(db: Session, user_id: str = "default_user") -> TwinStateModel:
        """
        Recalculates twin state resource utilization from current schedule of tasks.
        """
        twin = PersonalTwinEngine.get_or_create_twin(db, user_id)
        tasks = db.query(TaskItemModel).filter(TaskItemModel.user_id == user_id).all()

        total_scheduled_mins = 0
        total_cognitive_load = 0.0
        total_energy_cost = 0.0
        total_spent = 0.0
        travel_tasks_count = 0

        for t in tasks:
            if t.status in ["pending", "in_progress", "completed"]:
                total_scheduled_mins += t.duration_mins
                total_cognitive_load += (t.cognitive_load * (t.duration_mins / 60.0))
                total_energy_cost += (t.energy_cost * (t.duration_mins / 60.0))
                total_spent += t.monetary_cost
                if t.mobility_req:
                    travel_tasks_count += 1

        # Scale values to 0-100 metrics
        twin.current_budget_spent = round(total_spent, 2)
        twin.current_attention_load = min(100.0, round(total_cognitive_load * 8.0, 1))
        
        # Energy depletes as physical/cognitive exertion accumulates
        depletion = (total_energy_cost * 6.5)
        twin.current_energy_level = max(10.0, round(100.0 - depletion, 1))
        
        # Adjust travel buffer if multiple travel tasks exist
        twin.default_travel_buffer_mins = 20 if travel_tasks_count > 2 else 15
        twin.digital_workload_demand = min(100.0, round(30.0 + (len(tasks) * 3.5), 1))
        twin.last_synchronized_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(twin)
        return twin
