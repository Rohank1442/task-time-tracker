from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.time_log import TimeLog
from app.schemas.summary import DailySummaryResponse
from app.services.task_service import build_task_response
from app.api.timer import format_seconds_to_human

router = APIRouter(prefix="/dashboard", tags=["Dashboard Summary"])

@router.get("/daily-summary", response_model=DailySummaryResponse)
def get_daily_summary(
    date_str: Optional[str] = Query(None, alias="date", description="Date string YYYY-MM-DD, defaults to today"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns daily productivity metrics for the authenticated user for a specific date (defaults to today).
    Includes total tracked time today, tasks worked on today, completed tasks, in-progress tasks, and pending tasks.
    """
    now = datetime.now(timezone.utc)
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            target_date = now.date()
    else:
        target_date = now.date()

    start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0, tzinfo=timezone.utc)
    end_of_day = start_of_day + timedelta(days=1)

    # 1. Fetch time logs created or active during target day
    time_logs_today = db.query(TimeLog).filter(
        TimeLog.user_id == current_user.id,
        TimeLog.started_at >= start_of_day,
        TimeLog.started_at < end_of_day
    ).all()

    total_time_seconds = 0
    worked_on_task_ids = set()

    for log in time_logs_today:
        worked_on_task_ids.add(log.task_id)
        if log.duration_seconds is not None:
            total_time_seconds += log.duration_seconds
        elif log.ended_at is None:
            # currently active timer running today
            started = log.started_at
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            total_time_seconds += max(0, int((now - started).total_seconds()))

    # 2. Fetch tasks worked on today
    tasks_worked_on = []
    if worked_on_task_ids:
        raw_tasks = db.query(Task).filter(Task.id.in_(worked_on_task_ids), Task.user_id == current_user.id).all()
        tasks_worked_on = [build_task_response(db, t) for t in raw_tasks]

    # 3. All user tasks by status
    user_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    
    completed_tasks = [
        build_task_response(db, t) for t in user_tasks 
        if t.status == TaskStatus.COMPLETED and t.completed_at and (
            t.completed_at.tzinfo is None and t.completed_at.replace(tzinfo=timezone.utc).date() == target_date or
            t.completed_at.tzinfo is not None and t.completed_at.date() == target_date
        )
    ]
    
    pending_tasks = [build_task_response(db, t) for t in user_tasks if t.status == TaskStatus.PENDING]
    in_progress_tasks = [build_task_response(db, t) for t in user_tasks if t.status == TaskStatus.IN_PROGRESS]

    return DailySummaryResponse(
        date=target_date.strftime("%Y-%m-%d"),
        total_time_seconds=total_time_seconds,
        formatted_total_time=format_seconds_to_human(total_time_seconds),
        tasks_worked_on=tasks_worked_on,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        completed_count=len(completed_tasks),
        worked_on_count=len(tasks_worked_on)
    )
