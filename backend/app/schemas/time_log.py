from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TimeLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime

class ActiveTimerResponse(BaseModel):
    id: int
    task_id: int
    task_title: str
    user_id: int
    started_at: datetime
    elapsed_seconds: int
    prior_total_seconds: int = 0
    total_elapsed_seconds: int = 0

class TaskTimeSummaryResponse(BaseModel):
    task_id: int
    total_time_seconds: int
    formatted_duration: str
    session_count: int
