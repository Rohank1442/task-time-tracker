from pydantic import BaseModel
from typing import List
from app.schemas.task import TaskResponse

class DailySummaryResponse(BaseModel):
    date: str
    total_time_seconds: int
    formatted_total_time: str
    tasks_worked_on: List[TaskResponse]
    completed_tasks: List[TaskResponse]
    pending_tasks: List[TaskResponse]
    in_progress_tasks: List[TaskResponse]
    completed_count: int
    worked_on_count: int
