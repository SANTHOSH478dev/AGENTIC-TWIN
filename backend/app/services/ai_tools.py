import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.pdt_models import (
    TaskItemModel, TwinStateModel, PredictionForecastModel,
    MemoryItemModel, ReminderModel, AutomationRuleModel, PolicyAuditLogModel
)
from backend.app.services.twin_engine import PersonalTwinEngine
from backend.app.services.predictor import PredictiveConflictEngine
from backend.app.services.memory_service import MemoryService
from backend.app.services.agentic_planner import AgenticPlannerEngine
from backend.app.services.policy_engine import PolicyConsentEngine

class AIToolRegistry:
    """
    Stage 4 Agentic Tool Registry
    Exposes executable system functions to the LLM agent.
    """

    @staticmethod
    def get_tool_definitions() -> List[Dict[str, Any]]:
        return [
            {
                "name": "get_current_time",
                "description": "Returns current system date and time",
                "parameters": {}
            },
            {
                "name": "get_twin_state",
                "description": "Returns live Personal Digital Twin state (time, attention, energy, budget, mobility, digital workload)",
                "parameters": {}
            },
            {
                "name": "list_tasks",
                "description": "Lists all scheduled commitments, meetings, focus sessions, and tasks",
                "parameters": {}
            },
            {
                "name": "create_task",
                "description": "Schedules a new task or meeting commitment into the twin database",
                "parameters": {
                    "title": "Task title",
                    "category": "Work, Focus, Meeting, Fitness, Personal",
                    "start_time": "HH:MM",
                    "end_time": "HH:MM",
                    "cognitive_load": "1-10 float",
                    "energy_cost": "1-10 float",
                    "monetary_cost": "float $",
                    "is_fixed": "boolean"
                }
            },
            {
                "name": "update_task_time",
                "description": "Reschedules/moves an existing task or meeting to a new time slot",
                "parameters": {
                    "task_title": "Task or meeting name",
                    "new_start_time": "HH:MM",
                    "new_end_time": "HH:MM (optional)"
                }
            },
            {
                "name": "delete_task",
                "description": "Deletes a task by ID or title",
                "parameters": {
                    "task_title": "Title of task to delete"
                }
            },
            {
                "name": "create_reminder",
                "description": "Schedules a one-time or recurring task reminder",
                "parameters": {
                    "task_name": "Reminder task description",
                    "scheduled_time": "Time or date-time string (e.g. 19:00 or tomorrow 8 AM)",
                    "is_recurring": "boolean",
                    "recurrence_pattern": "daily, weekly, mon_wed_fri (optional)"
                }
            },
            {
                "name": "list_reminders",
                "description": "Lists all active user reminders",
                "parameters": {}
            },
            {
                "name": "create_automation_rule",
                "description": "Creates a background automation rule (e.g., if cognitive load > 80%, trigger break)",
                "parameters": {
                    "title": "Automation rule name",
                    "trigger_type": "time, cognitive_threshold, budget_threshold",
                    "condition_expression": "Expression rule statement",
                    "action_type": "suggest_break, optimize_schedule, notify_user"
                }
            },
            {
                "name": "optimize_schedule",
                "description": "Triggers multi-resource agentic planner to optimize schedule and generate candidate plans U(P)",
                "parameters": {
                    "goal_prompt": "Daily optimization target prompt"
                }
            },
            {
                "name": "save_user_memory",
                "description": "Saves a user preference rule, habit, or project fact into long-term personal memory",
                "parameters": {
                    "key": "Preference key name",
                    "value": "Preference rule statement",
                    "tag": "focus, mobility, energy, finance, history"
                }
            },
            {
                "name": "get_user_memories",
                "description": "Retrieves stored long-term personal preferences and memory rules",
                "parameters": {}
            }
        ]

    @staticmethod
    def execute_tool(name: str, args: Dict[str, Any], db: Session, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Executes named tool deterministically against system models.
        """
        if name == "get_current_time":
            now = datetime.datetime.now()
            return {"current_time": now.strftime("%Y-%m-%d %H:%M:%S"), "day_of_week": now.strftime("%A")}

        elif name == "get_twin_state":
            twin = PersonalTwinEngine.synchronize_twin_state(db, user_id)
            return {
                "total_time_capacity_mins": twin.total_time_capacity_mins,
                "attention_capacity": twin.attention_capacity,
                "current_attention_load": twin.current_attention_load,
                "daily_budget_limit": twin.daily_budget_limit,
                "current_budget_spent": twin.current_budget_spent,
                "energy_capacity": twin.energy_capacity,
                "current_energy_level": twin.current_energy_level,
                "default_travel_buffer_mins": twin.default_travel_buffer_mins,
                "digital_workload_demand": twin.digital_workload_demand
            }

        elif name == "list_tasks":
            tasks = db.query(TaskItemModel).filter(TaskItemModel.user_id == user_id).order_by(TaskItemModel.start_time).all()
            return {
                "tasks": [
                    {
                        "id": t.id,
                        "title": t.title,
                        "category": t.category,
                        "start_time": t.start_time,
                        "end_time": t.end_time,
                        "duration_mins": t.duration_mins,
                        "is_fixed": t.is_fixed,
                        "cognitive_load": t.cognitive_load,
                        "energy_cost": t.energy_cost,
                        "monetary_cost": t.monetary_cost,
                        "status": t.status
                    } for t in tasks
                ]
            }

        elif name == "create_task":
            title = args.get("title", "New Session")
            start_t = args.get("start_time", "14:00")
            end_t = args.get("end_time", "15:00")
            task = TaskItemModel(
                user_id=user_id,
                title=title,
                category=args.get("category", "Work"),
                start_time=start_t,
                end_time=end_t,
                duration_mins=args.get("duration_mins", 60),
                cognitive_load=float(args.get("cognitive_load", 5.0)),
                energy_cost=float(args.get("energy_cost", 4.0)),
                monetary_cost=float(args.get("monetary_cost", 0.0)),
                is_fixed=bool(args.get("is_fixed", False)),
                status="pending"
            )
            db.add(task)
            db.commit()
            db.refresh(task)

            # Audit log
            PolicyConsentEngine.create_action_request(
                db, "task_insert", "Assisted", f"AI Agent scheduled '{title}' ({start_t}-{end_t})", {"task_id": task.id}
            )
            PersonalTwinEngine.synchronize_twin_state(db, user_id)
            return {"success": True, "created_task": title, "start_time": start_t}

        elif name == "update_task_time":
            task_title = args.get("task_title", "")
            new_start = args.get("new_start_time", "17:30")
            
            task = None
            if task_title:
                task = db.query(TaskItemModel).filter(
                    TaskItemModel.user_id == user_id,
                    TaskItemModel.title.ilike(f"%{task_title}%")
                ).first()
            if not task:
                task = db.query(TaskItemModel).filter(TaskItemModel.user_id == user_id).first()

            if task:
                old_t = task.start_time
                task.start_time = new_start
                task.status = "rescheduled"
                db.commit()

                PolicyConsentEngine.create_action_request(
                    db, "reschedule_event", "Assisted",
                    f"AI Agent rescheduled '{task.title}' from {old_t} to {new_start}",
                    {"task": task.title, "new_time": new_start}
                )
                PersonalTwinEngine.synchronize_twin_state(db, user_id)
                return {"success": True, "task": task.title, "old_start_time": old_t, "new_start_time": new_start}
            return {"success": False, "error": "Task not found"}

        elif name == "delete_task":
            task_title = args.get("task_title", "")
            task = db.query(TaskItemModel).filter(
                TaskItemModel.user_id == user_id,
                TaskItemModel.title.ilike(f"%{task_title}%")
            ).first()
            if task:
                t_name = task.title
                db.delete(task)
                db.commit()
                PersonalTwinEngine.synchronize_twin_state(db, user_id)
                return {"success": True, "deleted_task": t_name}
            return {"success": False, "error": "Task not found"}

        elif name == "create_reminder":
            task_name = args.get("task_name", "General Reminder")
            sched_time = args.get("scheduled_time", "19:00")
            is_rec = bool(args.get("is_recurring", False))
            pattern = args.get("recurrence_pattern", "daily" if is_rec else None)

            rem = ReminderModel(
                user_id=user_id,
                task_name=task_name,
                scheduled_time=sched_time,
                is_recurring=is_rec,
                recurrence_pattern=pattern,
                status="active"
            )
            db.add(rem)
            db.commit()
            db.refresh(rem)
            return {"success": True, "reminder": task_name, "scheduled_time": sched_time, "is_recurring": is_rec}

        elif name == "list_reminders":
            rems = db.query(ReminderModel).filter(ReminderModel.user_id == user_id, ReminderModel.status == "active").all()
            return {
                "reminders": [
                    {"id": r.id, "task_name": r.task_name, "scheduled_time": r.scheduled_time, "is_recurring": r.is_recurring}
                    for r in rems
                ]
            }

        elif name == "create_automation_rule":
            title = args.get("title", "Rule")
            trig = args.get("trigger_type", "cognitive_threshold")
            cond = args.get("condition_expression", "cognitive_load > 80")
            act = args.get("action_type", "suggest_break")

            rule = AutomationRuleModel(
                user_id=user_id,
                title=title,
                trigger_type=trig,
                condition_expression=cond,
                action_type=act,
                is_active=True
            )
            db.add(rule)
            db.commit()
            return {"success": True, "automation_rule": title}

        elif name == "optimize_schedule":
            prompt = args.get("goal_prompt", "Optimize schedule for deep work")
            candidates = AgenticPlannerEngine.generate_candidate_plans(db, prompt)
            best = max(candidates, key=lambda c: c.utility_score)
            return {
                "success": True,
                "recommended_plan": best.plan_name,
                "utility_score": best.utility_score,
                "explanation": best.explanation
            }

        elif name == "save_user_memory":
            key = args.get("key", "user_preference")
            val = args.get("value", "")
            tag = args.get("tag", "general")
            mem = MemoryService.add_memory(db, "preference", key, val, tag)
            return {"success": True, "memory_key": mem.key, "memory_value": mem.value}

        elif name == "get_user_memories":
            mems = MemoryService.get_all_memories(db)
            return {"memories": [{"key": m.key, "value": m.value, "tag": m.relevance_tag} for m in mems]}

        return {"error": f"Tool '{name}' not found"}
