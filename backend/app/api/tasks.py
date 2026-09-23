from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.time_log import TimeLog
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse
from app.services.task_service import build_task_response

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new task owned by the authenticated user."""
    completed_at = datetime.now(timezone.utc) if task_in.status == TaskStatus.COMPLETED else None
    
    task = Task(
        user_id=current_user.id,
        title=task_in.title.strip(),
        description=task_in.description.strip() if task_in.description else None,
        status=task_in.status or TaskStatus.PENDING,
        completed_at=completed_at
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return build_task_response(db, task)

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all tasks for the authenticated user, with optional status filtering."""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    
    tasks = query.order_by(Task.created_at.desc()).all()
    return [build_task_response(db, t) for t in tasks]

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gets a specific task by ID. Enforces strict user isolation (IDOR protection)."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return build_task_response(db, task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates a task title, description, or status for the authenticated user."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if task_in.title is not None:
        task.title = task_in.title.strip()
    if task_in.description is not None:
        task.description = task_in.description.strip() if task_in.description else None
    
    if task_in.status is not None:
        old_status = task.status
        task.status = task_in.status
        if task_in.status == TaskStatus.COMPLETED and old_status != TaskStatus.COMPLETED:
            task.completed_at = datetime.now(timezone.utc)
            # Stop any active timer if task is completed
            active_log = db.query(TimeLog).filter(TimeLog.task_id == task.id, TimeLog.ended_at.is_(None)).first()
            if active_log:
                now = datetime.now(timezone.utc)
                active_log.ended_at = now
                started = active_log.started_at
                if started.tzinfo is None:
                    started = started.replace(tzinfo=timezone.utc)
                active_log.duration_seconds = max(0, int((now - started).total_seconds()))

        elif task_in.status != TaskStatus.COMPLETED:
            task.completed_at = None

    db.commit()
    db.refresh(task)
    return build_task_response(db, task)

@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    status_in: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates only the status of a task."""
    task_update = TaskUpdate(status=status_in.status)
    return update_task(task_id=task_id, task_in=task_update, current_user=current_user, db=db)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a task and its associated time logs for the authenticated user."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db.delete(task)
    db.commit()
    return None
