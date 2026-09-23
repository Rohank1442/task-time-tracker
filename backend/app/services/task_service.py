from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.task import Task
from app.models.time_log import TimeLog
from app.schemas.task import TaskResponse

def compute_task_total_time(db: Session, task_id: int) -> int:
    """
    Computes total elapsed seconds spent on a task.
    Includes both completed time logs and ongoing active time logs.
    """
    # 1. Sum completed duration_seconds
    completed_duration = db.query(func.coalesce(func.sum(TimeLog.duration_seconds), 0))\
        .filter(TimeLog.task_id == task_id, TimeLog.ended_at.isnot(None))\
        .scalar()
    
    # 2. Check for active (running) timer on this task
    active_log = db.query(TimeLog).filter(TimeLog.task_id == task_id, TimeLog.ended_at.is_(None)).first()
    active_seconds = 0
    if active_log:
        now = datetime.now(timezone.utc)
        started = active_log.started_at
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        active_seconds = int((now - started).total_seconds())
        if active_seconds < 0:
            active_seconds = 0

    return int(completed_duration) + active_seconds

def build_task_response(db: Session, task: Task) -> TaskResponse:
    """Constructs a TaskResponse schema with total_time_seconds computed dynamically."""
    total_seconds = compute_task_total_time(db, task.id)
    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        status=task.status,
        total_time_seconds=total_seconds,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at
    )
