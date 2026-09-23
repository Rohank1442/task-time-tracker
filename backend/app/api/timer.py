from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.time_log import TimeLog
from app.schemas.time_log import TimeLogResponse, ActiveTimerResponse, TaskTimeSummaryResponse

router = APIRouter(tags=["Timer & Time Logs"])

def format_seconds_to_human(total_seconds: int) -> str:
    """Formats duration in seconds into a human readable string (e.g. '2h 15m 30s')."""
    if total_seconds <= 0:
        return "0s"
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0 or hours > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{seconds}s")
    return " ".join(parts)

@router.post("/tasks/{task_id}/timer/start", response_model=TimeLogResponse, status_code=status.HTTP_201_CREATED)
def start_timer(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Starts a real-time tracking session for a task.
    Enforces ONE active timer per user (returns 409 Conflict if another timer is running).
    Automatically transitions PENDING tasks to IN_PROGRESS.
    """
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start time tracking on a completed task. Please reopen the task first."
        )

    # Check if ANY active timer exists for this user
    existing_active = db.query(TimeLog).filter(
        TimeLog.user_id == current_user.id,
        TimeLog.ended_at.is_(None)
    ).first()

    if existing_active:
        if existing_active.task_id == task_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Timer is already running for this task."
            )
        active_task = db.query(Task).filter(Task.id == existing_active.task_id).first()
        active_title = active_task.title if active_task else f"Task #{existing_active.task_id}"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Another task ('{active_title}') is currently being tracked. Stop it before starting a new timer."
        )

    # Transition PENDING to IN_PROGRESS
    if task.status == TaskStatus.PENDING:
        task.status = TaskStatus.IN_PROGRESS
        db.add(task)

    now = datetime.now(timezone.utc)
    new_log = TimeLog(
        task_id=task.id,
        user_id=current_user.id,
        started_at=now,
        ended_at=None,
        duration_seconds=None
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.post("/tasks/{task_id}/timer/stop", response_model=TimeLogResponse)
def stop_timer(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stops the active timer for the specified task, calculates final duration in seconds,
    and returns the completed time log.
    """
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    active_log = db.query(TimeLog).filter(
        TimeLog.task_id == task_id,
        TimeLog.user_id == current_user.id,
        TimeLog.ended_at.is_(None)
    ).first()

    if not active_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active timer found for this task"
        )

    now = datetime.now(timezone.utc)
    active_log.ended_at = now
    
    started = active_log.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    
    duration = int((now - started).total_seconds())
    active_log.duration_seconds = max(0, duration)

    db.commit()
    db.refresh(active_log)
    return active_log

@router.get("/timer/active", response_model=Optional[ActiveTimerResponse])
def get_active_timer(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the currently active running timer for the authenticated user, if any.
    Allows frontend to reconstruct timer state across page refreshes and navigations.
    """
    active_log = db.query(TimeLog).filter(
        TimeLog.user_id == current_user.id,
        TimeLog.ended_at.is_(None)
    ).first()

    if not active_log:
        return None

    task = db.query(Task).filter(Task.id == active_log.task_id).first()
    task_title = task.title if task else "Unknown Task"

    now = datetime.now(timezone.utc)
    started = active_log.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    
    elapsed = max(0, int((now - started).total_seconds()))

    return ActiveTimerResponse(
        id=active_log.id,
        task_id=active_log.task_id,
        task_title=task_title,
        user_id=current_user.id,
        started_at=started,
        elapsed_seconds=elapsed
    )

@router.get("/time-logs", response_model=List[TimeLogResponse])
def get_all_time_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all time logs for the authenticated user."""
    return db.query(TimeLog).filter(TimeLog.user_id == current_user.id).order_by(TimeLog.started_at.desc()).all()

@router.get("/tasks/{task_id}/time-logs", response_model=List[TimeLogResponse])
def get_task_time_logs(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists time logs for a specific task owned by the authenticated user."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return db.query(TimeLog).filter(
        TimeLog.task_id == task_id,
        TimeLog.user_id == current_user.id
    ).order_by(TimeLog.started_at.desc()).all()

@router.get("/tasks/{task_id}/time-summary", response_model=TaskTimeSummaryResponse)
def get_task_time_summary(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns summary of time spent on a task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    logs = db.query(TimeLog).filter(
        TimeLog.task_id == task_id,
        TimeLog.user_id == current_user.id
    ).all()

    total_seconds = 0
    now = datetime.now(timezone.utc)
    for log in logs:
        if log.duration_seconds is not None:
            total_seconds += log.duration_seconds
        elif log.ended_at is None:
            started = log.started_at
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            total_seconds += max(0, int((now - started).total_seconds()))

    return TaskTimeSummaryResponse(
        task_id=task_id,
        total_time_seconds=total_seconds,
        formatted_duration=format_seconds_to_human(total_seconds),
        session_count=len(logs)
    )
