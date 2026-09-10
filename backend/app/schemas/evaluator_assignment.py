from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.evaluator_assignment import AssignmentStatus


class EvaluatorAssignmentCreate(BaseModel):
    pilot_submission_id: int
    evaluator_id: int


class EvaluatorAssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus


class EvaluatorAssignmentResponse(BaseModel):
    id: int
    pilot_submission_id: int
    evaluator_id: int
    status: AssignmentStatus
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
