from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetime_utils import utc_now
from app.models.challenge import Challenge, ChallengeStatus
from app.schemas.challenge import ChallengeCreate, ChallengeUpdate


async def create_challenge(
    db: AsyncSession,
    challenge_in: ChallengeCreate,
    government_user_id: int,
) -> Challenge:
    """
    Create a new challenge in the database with government_user_id set from authenticated user.
    Flushes to assign an ID; caller is responsible for committing.
    """
    challenge_data = challenge_in.model_dump()
    new_challenge = Challenge(
        **challenge_data,
        government_user_id=government_user_id,
    )
    db.add(new_challenge)
    await db.flush()
    await db.refresh(new_challenge)
    return new_challenge


async def get_challenge_by_id(
    db: AsyncSession,
    challenge_id: int,
) -> Optional[Challenge]:
    """
    Fetch a single challenge by its primary key ID.
    """
    result = await db.execute(
        select(Challenge).where(Challenge.id == challenge_id)
    )
    return result.scalar_one_or_none()


async def get_challenges(
    db: AsyncSession,
    status: Optional[ChallengeStatus] = None,
    category: Optional[str] = None,
    government_user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Challenge]:
    """
    Retrieve challenges with optional filtering by status, category, or government user creator.
    """
    query = select(Challenge)

    if status is not None:
        query = query.where(Challenge.status == status)
    if category is not None:
        query = query.where(Challenge.category == category)
    if government_user_id is not None:
        query = query.where(Challenge.government_user_id == government_user_id)

    query = query.order_by(Challenge.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_challenge(
    db: AsyncSession,
    db_challenge: Challenge,
    challenge_in: ChallengeUpdate,
) -> Challenge:
    """
    Update fields of an existing challenge.
    Flushes; caller is responsible for committing.
    """
    update_data = challenge_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_challenge, field, value)

    db_challenge.updated_at = utc_now()
    await db.flush()
    await db.refresh(db_challenge)
    return db_challenge


async def delete_challenge(
    db: AsyncSession,
    db_challenge: Challenge,
) -> None:
    """
    Delete a challenge record from the database.
    Caller is responsible for committing.
    """
    await db.delete(db_challenge)
    await db.flush()
