from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.crud import activity as crud_activity
from app.models.user import User
from app.schemas.activity import ActivityLogResponse

router = APIRouter(prefix="/activity", tags=["Activity Log"])


@router.get(
    "",
    response_model=List[ActivityLogResponse],
)
async def list_activity(
    resource_type: Optional[str] = Query(None, description="Filter by resource type (e.g. 'challenge', 'application')"),
    resource_id: Optional[int] = Query(None, description="Filter by resource ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve activity/audit log entries for the authenticated user.

    Role-based visibility:
    - STARTUP: Activity performed by the startup user themselves.
    - GOVERNMENT: Activity performed by the government user themselves.
    - EVALUATOR: Activity performed by the evaluator themselves.
    - ADMIN: All system-wide activity.

    Only state-changing business events are recorded (no GET requests).
    Sensitive details are not included in activity descriptions.
    """
    return await crud_activity.get_activity_logs_for_user(
        db=db,
        current_user=current_user,
        resource_type=resource_type,
        resource_id=resource_id,
        skip=skip,
        limit=limit,
    )
