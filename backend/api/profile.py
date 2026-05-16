from fastapi import APIRouter, Depends
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from database import get_db
from models.user import User
from schemas.user import ProfileUpdate, UserResponse

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = dict(current_user.profile or {})
    patch = body.model_dump(exclude_none=True)
    updated.update(patch)

    await db.execute(update(User).where(User.id == current_user.id).values(profile=updated))
    await db.commit()
    await db.refresh(current_user)
    return current_user
