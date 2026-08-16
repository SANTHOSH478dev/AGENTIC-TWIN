import datetime
from typing import List
from sqlalchemy.orm import Session
from backend.app.models.pdt_models import TaskItemModel, TwinStateModel, PredictionForecastModel
from backend.app.services.twin_engine import PersonalTwinEngine

class PredictiveConflictEngine:
    """
    Stage 3: Prediction Layer
    Forecasts near-term resource bottlenecks and conflict risks:
    1. Time Overlaps
    2. Attention / Cognitive Overload
    3. Daily Budget Exceeded
    4. Physical Energy Exhaustion Point
    5. Travel Buffer Deficiency
    """

    @staticmethod
    def forecast_conflicts(db: Session, user_id: str = "default_user") -> List[PredictionForecastModel]:
        # Synchronize twin state first
        twin = PersonalTwinEngine.synchronize_twin_state(db, user_id)
        tasks = db.query(TaskItemModel).filter(
            TaskItemModel.user_id == user_id,
            TaskItemModel.status.in_(["pending", "in_progress"])
        ).order_by(TaskItemModel.start_time).all()

        # Clear old automated predictions
        db.query(PredictionForecastModel).delete()
        db.commit()

        predictions = []

        # Helper to convert "HH:MM" to minutes from midnight
        def to_mins(time_str: str) -> int:
            try:
                parts = time_str.split(":")
                return int(parts[0]) * 60 + int(parts[1])
            except Exception:
                return 540 # default 9 AM

        # 1. Forecast Time Overlaps & Travel Buffer Failures
        for i in range(len(tasks)):
            t1 = tasks[i]
            t1_start = to_mins(t1.start_time)
            t1_end = to_mins(t1.end_time)

            for j in range(i + 1, len(tasks)):
                t2 = tasks[j]
                t2_start = to_mins(t2.start_time)
                t2_end = to_mins(t2.end_time)

                # Direct overlap check
                if t1_start < t2_end and t2_start < t1_end:
                    pred = PredictionForecastModel(
                        conflict_type="time_overlap",
                        severity="high" if (t1.is_fixed and t2.is_fixed) else "medium",
                        affected_tasks=[t1.title, t2.title],
                        description=f"Schedule conflict between '{t1.title}' ({t1.start_time}-{t1.end_time}) and '{t2.title}' ({t2.start_time}-{t2.end_time}).",
                        confidence_score=0.95,
                        suggested_resolution=f"Shift flexible task '{t2.title if not t2.is_fixed else t1.title}' to an open slot after {t1.end_time}."
                    )
                    predictions.append(pred)
                
                # Travel buffer deficiency check
                elif t1.mobility_req or t2.mobility_req:
                    gap = t2_start - t1_end
                    required_buffer = twin.default_travel_buffer_mins
                    if 0 <= gap < required_buffer:
                        pred = PredictionForecastModel(
                            conflict_type="travel_buffer_failure",
                            severity="medium",
                            affected_tasks=[t1.title, t2.title],
                            description=f"Insufficient travel buffer ({gap} mins available vs {required_buffer} mins required) between '{t1.title}' and '{t2.title}'.",
                            confidence_score=0.88,
                            suggested_resolution=f"Insert a {required_buffer}-minute mobility buffer between tasks."
                        )
                        predictions.append(pred)

        # 2. Forecast Cognitive Attention Overload
        high_cognitive_duration = sum(
            t.duration_mins for t in tasks if t.cognitive_load >= 7.0
        )
        if high_cognitive_duration > 180: # More than 3 hours of intense focus without buffer
            pred = PredictionForecastModel(
                conflict_type="attention_overload",
                severity="high" if high_cognitive_duration > 240 else "medium",
                affected_tasks=[t.title for t in tasks if t.cognitive_load >= 7.0],
                description=f"High cognitive attention demand forecasted ({high_cognitive_duration} mins of high-focus work). Risk of mental fatigue.",
                confidence_score=0.90,
                suggested_resolution="Interleave a 20-minute low-cognitive rest/walk buffer between focus sessions."
            )
            predictions.append(pred)

        # 3. Forecast Daily Budget Exceeded
        if twin.current_budget_spent > twin.daily_budget_limit:
            overrun = round(twin.current_budget_spent - twin.daily_budget_limit, 2)
            pred = PredictionForecastModel(
                conflict_type="budget_exceeded",
                severity="high",
                affected_tasks=[t.title for t in tasks if t.monetary_cost > 0],
                description=f"Daily budget limit of ${twin.daily_budget_limit:.2f} exceeded by ${overrun:.2f} (Total: ${twin.current_budget_spent:.2f}).",
                confidence_score=0.99,
                suggested_resolution="Review optional monetary expenses or reallocate funds from secondary tasks."
            )
            predictions.append(pred)

        # 4. Forecast Energy Depletion
        if twin.current_energy_level < 25.0:
            pred = PredictionForecastModel(
                conflict_type="energy_depletion",
                severity="medium",
                affected_tasks=[t.title for t in tasks if t.energy_cost >= 6.0],
                description=f"Physical energy level critically low ({twin.current_energy_level}% remaining).",
                confidence_score=0.85,
                suggested_resolution="Defer high-energy physical tasks to tomorrow or schedule recovery break."
            )
            predictions.append(pred)

        # Persist predictions
        for p in predictions:
            db.add(p)
        db.commit()

        return predictions
