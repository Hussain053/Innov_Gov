import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.datetime_utils import utc_now
from app.core.permissions import require_admin, require_government
from app.crud import challenge as crud_challenge
from app.crud import pilot as crud_pilot
from app.models.activity_log import ActivityAction
from app.models.challenge import ChallengeStatus
from app.models.notification import NotificationType
from app.models.pilot import PilotStatus
from app.models.user import User, UserRole
from app.schemas.challenge import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeUpdate,
)
from app.schemas.decision import GovernmentDecisionCreate, GovernmentDecisionEnum, GovernmentDecisionResponse
from app.services.activity import record_activity
from app.services.notifications import crud_notification

router = APIRouter(prefix="/challenges", tags=["Challenges"])

# Enforce valid state transitions for challenge status
VALID_CHALLENGE_TRANSITIONS = {
    ChallengeStatus.DRAFT: {ChallengeStatus.OPEN},
    ChallengeStatus.OPEN: {ChallengeStatus.CLOSED, ChallengeStatus.IN_REVIEW},
    ChallengeStatus.CLOSED: {ChallengeStatus.IN_REVIEW},
    ChallengeStatus.IN_REVIEW: {ChallengeStatus.AWARDED, ChallengeStatus.COMPLETED},
    ChallengeStatus.AWARDED: {ChallengeStatus.COMPLETED},
    ChallengeStatus.COMPLETED: set(),
}


def _tokens(text: Optional[str]) -> set[str]:
    if not text:
        return set()
    return {
        token.lower()
        for token in re.findall(r"[a-z0-9]{3,}", text.lower())
        if token.lower() not in {"the", "with", "from", "this", "that", "into", "over", "under", "must", "for", "and", "will", "using", "such", "have", "been"}
    }


async def _attach_assigned_evaluator_metadata(db: AsyncSession, challenge) -> None:
    requirements = dict(challenge.requirements or {})
    if requirements.get("assigned_evaluator"):
        return

    evaluator_result = await db.execute(
        select(User).where(User.role == UserRole.EVALUATOR, User.is_active.is_(True))
    )
    evaluators = list(evaluator_result.scalars().all())

    if not evaluators:
        return

    challenge_text = " ".join(
        filter(
            None,
            [
                challenge.title,
                challenge.description,
                challenge.problem_statement,
                challenge.category,
                challenge.location,
            ],
        )
    )
    challenge_tokens = _tokens(challenge_text)

    scored_evaluators = []
    for evaluator in evaluators:
        evaluator_text = " ".join(
            filter(
                None,
                [
                    evaluator.name,
                    evaluator.organization,
                    evaluator.email,
                ],
            )
        )
        evaluator_tokens = _tokens(evaluator_text)
        overlap = len(challenge_tokens & evaluator_tokens)

        score = overlap * 12

        if challenge.category and challenge.category.lower() in (evaluator.organization or "").lower():
            score += 25
        if challenge.location and challenge.location.lower() in (evaluator.organization or "").lower():
            score += 20
        if evaluator.organization:
            score += 10
        if evaluator.is_active:
            score += 10

        scored_evaluators.append((min(score, 100), evaluator))

    if not scored_evaluators:
        return

    best_evaluator = max(scored_evaluators, key=lambda item: item[0])[1]
    requirements["assigned_evaluator"] = {
        "id": best_evaluator.id,
        "name": best_evaluator.name,
        "organization": best_evaluator.organization,
        "email": best_evaluator.email,
        "match_score": min(max(round(max(scored_evaluators, key=lambda item: item[0])[0], 0), 0), 100),
        "reason": "Best available evaluator match based on challenge domain, department context, and active evaluator profile.",
    }
    challenge.requirements = requirements


@router.post(
    "",
    response_model=ChallengeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_challenge(
    challenge_in: ChallengeCreate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new public procurement challenge.
    - Restricted to GOVERNMENT and ADMIN users.
    - Assigns government_user_id automatically from the authenticated user.
    - Initial default status is DRAFT unless specified.
    """
    challenge = await crud_challenge.create_challenge(
        db=db,
        challenge_in=challenge_in,
        government_user_id=current_user.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.CHALLENGE_CREATED,
        resource_type="challenge",
        resource_id=challenge.id,
        description=f"Challenge '{challenge.title}' created.",
    )
    await db.commit()
    await db.refresh(challenge)
    return challenge


@router.get(
    "",
    response_model=List[ChallengeResponse],
)
async def list_challenges(
    status: Optional[ChallengeStatus] = Query(None, description="Filter challenges by status"),
    category: Optional[str] = Query(None, description="Filter challenges by category"),
    government_user_id: Optional[int] = Query(None, description="Filter by creator government user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all challenges.
    - Accessible to all authenticated users (STARTUP, GOVERNMENT, EVALUATOR, ADMIN).
    - Supports optional filtering by status, category, and government creator.
    """
    return await crud_challenge.get_challenges(
        db=db,
        status=status,
        category=category,
        government_user_id=government_user_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{challenge_id}",
    response_model=ChallengeResponse,
)
async def get_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a specific challenge by ID.
    - Accessible to all authenticated users.
    """
    challenge = await crud_challenge.get_challenge_by_id(db, challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )
    return challenge


@router.put(
    "/{challenge_id}",
    response_model=ChallengeResponse,
)
async def update_challenge(
    challenge_id: int,
    challenge_in: ChallengeUpdate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing challenge.
    - Restricted to GOVERNMENT and ADMIN users.
    - Government users can modify ONLY challenges they created.
    - Enforces valid status transitions (prevents invalid jumps like DRAFT -> AWARDED).
    """
    challenge = await crud_challenge.get_challenge_by_id(db, challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if current_user.role != UserRole.ADMIN and challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this challenge",
        )

    old_status = challenge.status
    update_data = challenge_in.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] is not None and update_data["status"] != old_status:
        target_status = update_data["status"]
        allowed_targets = VALID_CHALLENGE_TRANSITIONS.get(old_status, set())
        if target_status not in allowed_targets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid challenge status transition from '{old_status.value}' to '{target_status.value}'",
            )

    updated = await crud_challenge.update_challenge(
        db=db,
        db_challenge=challenge,
        challenge_in=challenge_in,
    )

    if updated.status == ChallengeStatus.OPEN:
        await _attach_assigned_evaluator_metadata(db, updated)

    if "status" in update_data and update_data["status"] != old_status:
        action = ActivityAction.CHALLENGE_STATUS_CHANGED
        desc = f"Challenge '{updated.title}' status changed from '{old_status.value}' to '{updated.status.value}'."
    else:
        action = ActivityAction.CHALLENGE_UPDATED
        desc = f"Challenge '{updated.title}' updated."

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=action,
        resource_type="challenge",
        resource_id=updated.id,
        description=desc,
    )
    await db.commit()
    await db.refresh(updated)
    return updated


@router.post(
    "/{challenge_id}/decision",
    response_model=GovernmentDecisionResponse,
)
async def make_government_decision(
    challenge_id: int,
    decision_in: GovernmentDecisionCreate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Record explicit final government procurement decision for a challenge & pilot.
    - Restricted to GOVERNMENT owner of challenge or ADMIN.
    - Evaluators CANNOT make final decisions.
    - Enforces that pilot belongs to this challenge.
    - Records decision in activity log and notifies the startup.
    """
    challenge = await crud_challenge.get_challenge_by_id(db, challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if current_user.role != UserRole.ADMIN and challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to make procurement decisions for this challenge",
        )

    pilot = await crud_pilot.get_pilot_by_id(db, decision_in.pilot_id)
    if not pilot or pilot.challenge_id != challenge_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot project not found for this challenge",
        )

    if decision_in.decision == GovernmentDecisionEnum.AWARDED:
        challenge.status = ChallengeStatus.AWARDED
        pilot.status = PilotStatus.COMPLETED
        n_type = NotificationType.CONTRACT_AWARDED
        title = "Procurement Award Decision"
        msg = f"Government has officially awarded the procurement decision for challenge '{challenge.title}' to your startup!"
    else:
        n_type = NotificationType.APPLICATION_REJECTED
        title = "Procurement Final Decision"
        msg = f"Government final procurement decision for challenge '{challenge.title}' has concluded."

    challenge.updated_at = utc_now()
    pilot.updated_at = utc_now()

    # Record notification
    await crud_notification.create_notification(
        db=db,
        user_id=pilot.startup_id,
        notification_type=n_type,
        title=title,
        message=msg,
        resource_type="challenge",
        resource_id=challenge_id,
    )

    # Record activity log
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.CHALLENGE_STATUS_CHANGED,
        resource_type="challenge",
        resource_id=challenge_id,
        description=f"Government final procurement decision '{decision_in.decision.value}' recorded for challenge '{challenge.title}' (Pilot ID {pilot.id}).",
        metadata={"decision": decision_in.decision.value, "notes": decision_in.notes},
    )

    await db.commit()

    return GovernmentDecisionResponse(
        challenge_id=challenge_id,
        pilot_id=pilot.id,
        decision=decision_in.decision,
        notes=decision_in.notes,
        decided_at=utc_now(),
    )


@router.delete(
    "/{challenge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_challenge(
    challenge_id: int,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a challenge.
    - Restricted to GOVERNMENT and ADMIN users.
    - Government users can delete ONLY challenges they created.
    """
    challenge = await crud_challenge.get_challenge_by_id(db, challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if current_user.role != UserRole.ADMIN and challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this challenge",
        )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.CHALLENGE_DELETED,
        resource_type="challenge",
        resource_id=challenge.id,
        description=f"Challenge '{challenge.title}' deleted.",
    )
    await crud_challenge.delete_challenge(db=db, db_challenge=challenge)
    await db.commit()
    return None
