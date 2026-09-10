from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_startup
from app.crud import startup as crud_startup
from app.models.user import User
from app.schemas.startup import StartupProfileResponse, StartupProfileUpdate

router = APIRouter(prefix="/startups", tags=["Startup Profiles"])


@router.get(
    "/me",
    response_model=StartupProfileResponse,
)
async def get_my_startup_profile(
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the authenticated user's startup profile.
    - STARTUP role required.
    - Returns 404 if profile has not been created yet.
    """
    profile = await crud_startup.get_startup_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup profile not found for the current user",
        )
    return profile


@router.put(
    "/me",
    response_model=StartupProfileResponse,
)
async def update_my_startup_profile(
    profile_in: StartupProfileUpdate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or update the authenticated user's startup profile.
    - STARTUP role required.
    - User ID derived strictly from JWT authentication token (current_user.id).
    """
    return await crud_startup.update_or_create_startup_profile(
        db=db,
        user_id=current_user.id,
        profile_in=profile_in,
    )


@router.get(
    "/{startup_id}",
    response_model=StartupProfileResponse,
)
async def get_startup_profile(
    startup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    View a startup profile by ID.
    - Accessible to all authenticated roles (STARTUP, GOVERNMENT, EVALUATOR, ADMIN).
    - Checks both profile primary key ID and user ID for convenience.
    - Returns safe profile data only (no credentials or user auth details).
    """
    profile = await crud_startup.get_startup_profile_by_id(db, startup_id)
    if not profile:
        profile = await crud_startup.get_startup_profile_by_user_id(db, startup_id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup profile not found",
        )
    return profile
