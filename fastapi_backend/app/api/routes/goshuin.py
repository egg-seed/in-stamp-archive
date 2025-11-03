"""Routes for managing goshuin records."""

from __future__ import annotations

from enum import Enum
from typing import Callable
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from fastapi_pagination.ext.sqlalchemy import apaginate
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DatabaseSession, PaginationParams
from app.models import GoshuinRecord, Spot, User
from app.schemas import (
    GoshuinCreate,
    GoshuinRead,
    GoshuinUpdate,
    PaginatedGoshuinResponse,
)

router = APIRouter(tags=["goshuin"])


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


def _goshuin_transformer() -> Callable[[list[GoshuinRecord]], list[GoshuinRead]]:
    """Return a transformer function for pagination results."""

    def transform(records: list[GoshuinRecord]) -> list[GoshuinRead]:
        return [GoshuinRead.model_validate(record) for record in records]

    return transform


async def _get_spot_for_user(spot_id: UUID, db: AsyncSession, user: User) -> Spot:
    """Return the user's spot or raise 404 if it does not exist."""

    result = await db.execute(
        select(Spot).where(Spot.id == spot_id, Spot.user_id == user.id)
    )
    spot = result.scalar_one_or_none()
    if spot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spot not found")
    return spot


async def _get_record_for_user(record_id: UUID, db: AsyncSession, user: User) -> GoshuinRecord:
    """Return the user's goshuin record or raise 404 if not found."""

    result = await db.execute(
        select(GoshuinRecord)
        .join(Spot)
        .where(
            GoshuinRecord.id == record_id,
            GoshuinRecord.user_id == user.id,
            Spot.user_id == user.id,
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goshuin record not found"
        )
    return record


@router.get("/goshuin", response_model=PaginatedGoshuinResponse)
async def list_goshuin_records(
    db: DatabaseSession,
    user: CurrentUser,
    pagination: PaginationParams,
    sort_order: SortOrder = Query(
        default=SortOrder.DESC,
        description="Sort records by visit date ascending or descending",
    ),
    spot_id: UUID | None = Query(
        default=None,
        description="Optional filter to only include records for a specific spot",
    ),
) -> PaginatedGoshuinResponse:
    """Return a paginated list of the authenticated user's goshuin records."""

    query = (
        select(GoshuinRecord)
        .join(Spot)
        .where(
            GoshuinRecord.user_id == user.id,
            Spot.user_id == user.id,
        )
    )

    if spot_id is not None:
        query = query.where(GoshuinRecord.spot_id == spot_id)

    if sort_order is SortOrder.ASC:
        query = query.order_by(GoshuinRecord.visit_date.asc())
    else:
        query = query.order_by(GoshuinRecord.visit_date.desc())

    page = await apaginate(db, query, pagination, transformer=_goshuin_transformer())

    return PaginatedGoshuinResponse(
        items=page.items,
        total=page.total,
        page=page.page,
        size=page.size,
    )


@router.post(
    "/spots/{spot_id}/goshuin",
    response_model=GoshuinRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_goshuin_record(
    spot_id: UUID,
    record_in: GoshuinCreate,
    db: DatabaseSession,
    user: CurrentUser,
) -> GoshuinRead:
    """Create a goshuin record for the authenticated user's spot."""

    spot = await _get_spot_for_user(spot_id, db, user)

    record = GoshuinRecord(
        **record_in.model_dump(),
        user_id=user.id,
        spot_id=spot.id,
    )
    db.add(record)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create goshuin record with provided data",
        ) from exc

    await db.refresh(record)
    return GoshuinRead.model_validate(record)


@router.get("/goshuin/{record_id}", response_model=GoshuinRead)
async def get_goshuin_record(
    record_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> GoshuinRead:
    """Retrieve a single goshuin record owned by the authenticated user."""

    record = await _get_record_for_user(record_id, db, user)
    return GoshuinRead.model_validate(record)


@router.patch("/goshuin/{record_id}", response_model=GoshuinRead)
async def update_goshuin_record(
    record_id: UUID,
    record_in: GoshuinUpdate,
    db: DatabaseSession,
    user: CurrentUser,
) -> GoshuinRead:
    """Update an existing goshuin record owned by the authenticated user."""

    record = await _get_record_for_user(record_id, db, user)

    update_data = record_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to update goshuin record with provided data",
        ) from exc

    await db.refresh(record)
    return GoshuinRead.model_validate(record)


@router.delete("/goshuin/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goshuin_record(
    record_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> None:
    """Delete a goshuin record owned by the authenticated user."""

    record = await _get_record_for_user(record_id, db, user)
    await db.delete(record)
    await db.commit()
    return None
