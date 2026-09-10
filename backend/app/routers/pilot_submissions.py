from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_startup
from app.crud import pilot as crud_pilot
from app.crud import pilot_submission as crud_pilot_submission
from app.models.activity_log import ActivityAction
from app.models.pilot import PilotStatus
from app.models.pilot_submission import PilotSubmissionStatus
from app.models.user import User, UserRole
from app.schemas.pilot_submission import (
    PilotSubmissionCreate,
    PilotSubmissionResponse,
    PilotSubmissionUpdate,
)
from app.services.activity import record_activity
from app.services.notifications import (
    notify_submission_submitted,
    notify_submission_under_evaluation,
)

router = APIRouter(prefix="/pilot-submissions", tags=["Pilot Submissions"])


@router.post(
    "",
    response_model=PilotSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_pilot_submission(
    submission_in: PilotSubmissionCreate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new pilot submission in DRAFT status.
    - STARTUP only.
    - Pilot must exist and belong to the authenticated startup (pilot.startup_id == current_user.id).
    - Pilot status must be IN_PROGRESS.
    - Only 1 submission allowed per pilot (returns HTTP 409 if duplicate).
    """
    pilot = await crud_pilot.get_pilot_by_id(db, submission_in.pilot_id)
    if not pilot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot not found",
        )

    if pilot.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create submissions for your own assigned pilots",
        )

    if pilot.status != PilotStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Submissions can only be created when Pilot status is IN_PROGRESS (current status: '{pilot.status.value}')",
        )

    existing = await crud_pilot_submission.get_submission_by_pilot_id(db, submission_in.pilot_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission already exists for this pilot project",
        )

    try:
        submission = await crud_pilot_submission.create_pilot_submission(
            db=db,
            submission_in=submission_in,
            startup_id=current_user.id,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission already exists for this pilot project",
        )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.SUBMISSION_CREATED,
        resource_type="pilot_submission",
        resource_id=submission.id,
        description=f"Pilot submission created for pilot ID {pilot.id}.",
    )
    await db.commit()
    await db.refresh(submission)
    return submission


@router.get(
    "",
    response_model=List[PilotSubmissionResponse],
)
async def list_pilot_submissions(
    pilot_id: Optional[int] = Query(None, description="Filter by pilot ID"),
    status_filter: Optional[PilotSubmissionStatus] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve pilot submissions filtered according to user role:
    - STARTUP: Only submissions belonging to startup's pilots.
    - GOVERNMENT: Only submissions for government user's challenges.
    - EVALUATOR: Read-only access to submitted/evaluated submissions.
    - ADMIN: Sees all.
    """
    return await crud_pilot_submission.get_submissions_for_user(
        db=db,
        current_user=current_user,
        pilot_id=pilot_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{submission_id}",
    response_model=PilotSubmissionResponse,
)
async def get_pilot_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a single pilot submission with role authorization checks.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if current_user.role == UserRole.STARTUP and submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this submission",
        )

    if current_user.role == UserRole.GOVERNMENT and submission.pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view submissions for this challenge",
        )

    if current_user.role == UserRole.EVALUATOR and submission.status == PilotSubmissionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Evaluators cannot view draft pilot submissions",
        )

    return submission


@router.put(
    "/{submission_id}",
    response_model=PilotSubmissionResponse,
)
async def update_pilot_submission(
    submission_id: int,
    submission_in: PilotSubmissionUpdate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a DRAFT pilot submission.
    - STARTUP only for its own submission.
    - Only DRAFT submissions can be edited.
    - Cannot modify pilot_id, startup_id, or status.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own submissions",
        )

    if submission.status != PilotSubmissionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only DRAFT submissions can be edited (current status: '{submission.status.value}')",
        )

    return await crud_pilot_submission.update_pilot_submission(
        db=db,
        db_submission=submission,
        submission_in=submission_in,
    )


@router.post(
    "/{submission_id}/submit",
    response_model=PilotSubmissionResponse,
)
async def submit_pilot_submission(
    submission_id: int,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a DRAFT pilot submission.
    - STARTUP only for its own submission.
    - Changes status DRAFT -> SUBMITTED.
    - Sets submitted_at timestamp.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own pilot submissions",
        )

    if submission.status != PilotSubmissionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only DRAFT submissions can be submitted (current status: '{submission.status.value}')",
        )

    if submission.pilot.status != PilotStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submissions can only be submitted while the pilot project is IN_PROGRESS",
        )

    challenge_title = submission.pilot.challenge.title
    government_user_id = submission.pilot.challenge.government_user_id

    updated = await crud_pilot_submission.update_submission_status(
        db=db,
        db_submission=submission,
        new_status=PilotSubmissionStatus.SUBMITTED,
    )

    await notify_submission_submitted(
        db=db,
        government_user_id=government_user_id,
        challenge_title=challenge_title,
        submission_id=submission.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.SUBMISSION_SUBMITTED,
        resource_type="pilot_submission",
        resource_id=submission.id,
        description=f"Pilot submission submitted for challenge '{challenge_title}'.",
    )
    await db.commit()
    await db.refresh(updated)
    return updated
