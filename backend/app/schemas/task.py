from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.task import TaskStatus

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Non-empty task title")
    description: Optional[str] = Field(None, max_length=2000, description="Optional task description")
    status: Optional[TaskStatus] = TaskStatus.PENDING

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    total_time_seconds: int = 0
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

class EnhanceTaskRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Raw natural language task description")

class EnhanceTaskResponse(BaseModel):
    title: str
    description: str
    ai_enhanced: bool = True
