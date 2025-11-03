"""Routes for managing tourist spots."""

from __future__ import annotations

from typing import Callable
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from fastapi_pagination.ext.sqlalchemy import apaginate
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DatabaseSession, PaginationParams
from app.models import Spot, User
from app.schemas import PaginatedSpotsResponse, SpotCreate, SpotRead, SpotUpdate

router = APIRouter(tags=["spots"])


def _spot_transformer() -> Callable[[list[Spot]], list[SpotRead]]:
    """Return a transformer function for pagination results."""

    def transform(spots: list[Spot]) -> list[SpotRead]:
        return [SpotRead.model_validate(spot) for spot in spots]

    return transform


async def _get_spot_for_user(
    spot_id: UUID, db: AsyncSession, user: User
) -> Spot:
    result = await db.execute(
        select(Spot).where(Spot.id == spot_id, Spot.user_id == user.id)
    )
    spot = result.scalar_one_or_none()
    if spot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spot not found")
    return spot


@router.get("/", response_model=PaginatedSpotsResponse)
async def list_spots(
    db: DatabaseSession,
    user: CurrentUser,
    pagination: PaginationParams,
    prefecture: str | None = Query(
        default=None, description="Filter spots by prefecture"
    ),
    category: str | None = Query(
        default=None, description="Filter spots by category"
    ),
    keyword: str | None = Query(
        default=None, description="Filter spots by keyword in name, description or address"
    ),
) -> PaginatedSpotsResponse:
    """Return a paginated list of the authenticated user's spots with optional filters."""

    query = select(Spot).where(Spot.user_id == user.id)

    if prefecture:
        query = query.where(Spot.prefecture == prefecture)
    if category:
        query = query.where(Spot.category == category)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.where(
            or_(
                Spot.name.ilike(pattern),
                Spot.description.ilike(pattern),
                Spot.address.ilike(pattern),
            )
        )

    page = await apaginate(db, query, pagination, transformer=_spot_transformer())

    return PaginatedSpotsResponse(
        items=page.items,
        total=page.total,
        page=page.page,
        size=page.size,
    )


@router.post("/", response_model=SpotRead, status_code=status.HTTP_201_CREATED)
async def create_spot(
    spot_in: SpotCreate,
    db: DatabaseSession,
    user: CurrentUser,
) -> SpotRead:
    """Create a new spot owned by the authenticated user."""

    spot = Spot(**spot_in.model_dump(), user_id=user.id)
    db.add(spot)
    await db.commit()
    await db.refresh(spot)
    return SpotRead.model_validate(spot)


@router.get("/{spot_id}", response_model=SpotRead)
async def get_spot(
    spot_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> SpotRead:
    """Retrieve a single spot owned by the authenticated user."""

    spot = await _get_spot_for_user(spot_id, db, user)
    return SpotRead.model_validate(spot)


@router.patch("/{spot_id}", response_model=SpotRead)
async def update_spot(
    spot_id: UUID,
    spot_in: SpotUpdate,
    db: DatabaseSession,
    user: CurrentUser,
) -> SpotRead:
    """Update an existing spot owned by the authenticated user."""

    spot = await _get_spot_for_user(spot_id, db, user)

    update_data = spot_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(spot, field, value)

    await db.commit()
    await db.refresh(spot)
    return SpotRead.model_validate(spot)


@router.delete("/{spot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spot(
    spot_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> None:
    """Delete a spot owned by the authenticated user."""

    spot = await _get_spot_for_user(spot_id, db, user)
    await db.delete(spot)
    await db.commit()
    return None
