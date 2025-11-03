"""Routes for managing goshuin record images."""

from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DatabaseSession
from app.models import GoshuinImage, GoshuinImageType, GoshuinRecord, Spot, User
from app.schemas import (
    GoshuinImageMetadataUpdate,
    GoshuinImageRead,
    ImageReorderRequest,
    ImageUploadResponse,
)

router = APIRouter(tags=["goshuin-images"])


async def _get_record_for_user(
    record_id: UUID, db: AsyncSession, user: User
) -> GoshuinRecord:
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


async def _get_goshuin_image_for_user(
    record_id: UUID, image_id: UUID, db: AsyncSession, user: User
) -> GoshuinImage:
    result = await db.execute(
        select(GoshuinImage)
        .join(GoshuinRecord)
        .join(Spot)
        .where(
            GoshuinImage.id == image_id,
            GoshuinImage.goshuin_record_id == record_id,
            GoshuinRecord.user_id == user.id,
            Spot.user_id == user.id,
        )
    )
    image = result.scalar_one_or_none()
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goshuin image not found"
        )
    return image


async def _normalize_record_display_order(db: AsyncSession, record_id: UUID) -> None:
    images_result = await db.execute(
        select(GoshuinImage)
        .where(GoshuinImage.goshuin_record_id == record_id)
        .order_by(GoshuinImage.display_order.asc(), GoshuinImage.created_at.asc())
    )
    for index, image in enumerate(images_result.scalars().all()):
        image.display_order = index


@router.get("/{record_id}/images", response_model=list[GoshuinImageRead])
async def list_goshuin_images(
    record_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> list[GoshuinImageRead]:
    await _get_record_for_user(record_id, db, user)
    result = await db.execute(
        select(GoshuinImage)
        .where(GoshuinImage.goshuin_record_id == record_id)
        .order_by(GoshuinImage.display_order.asc(), GoshuinImage.created_at.asc())
    )
    images = result.scalars().all()
    return [GoshuinImageRead.model_validate(image) for image in images]


@router.post(
    "/{record_id}/images/uploads",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_goshuin_image_upload(
    record_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> ImageUploadResponse:
    record = await _get_record_for_user(record_id, db, user)

    image_id = uuid4()
    upload_path = (
        f"uploads/goshuin/{user.id}/{record.spot_id}/{record.id}/{image_id}"
    )

    async with db.begin():
        max_order_result = await db.execute(
            select(func.max(GoshuinImage.display_order)).where(
                GoshuinImage.goshuin_record_id == record.id
            )
        )
        max_order = max_order_result.scalar()
        display_order = 0 if max_order is None else max_order + 1

        image = GoshuinImage(
            id=image_id,
            goshuin_record_id=record.id,
            image_url=upload_path,
            image_type=GoshuinImageType.OTHER,
            display_order=display_order,
        )
        db.add(image)

    return ImageUploadResponse(image_id=image_id, upload_url=upload_path, form_fields={})


@router.patch("/{record_id}/images/{image_id}", response_model=GoshuinImageRead)
async def update_goshuin_image_metadata(
    record_id: UUID,
    image_id: UUID,
    metadata: GoshuinImageMetadataUpdate,
    db: DatabaseSession,
    user: CurrentUser,
) -> GoshuinImageRead:
    image = await _get_goshuin_image_for_user(record_id, image_id, db, user)
    update_data = metadata.model_dump(exclude_unset=True)

    if not update_data:
        return GoshuinImageRead.model_validate(image)

    async with db.begin():
        for field, value in update_data.items():
            setattr(image, field, value)
        db.add(image)

    await db.refresh(image)
    return GoshuinImageRead.model_validate(image)


@router.delete("/{record_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goshuin_image(
    record_id: UUID,
    image_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> None:
    image = await _get_goshuin_image_for_user(record_id, image_id, db, user)

    async with db.begin():
        await db.delete(image)
        await db.flush()
        await _normalize_record_display_order(db, record_id)

    return None


@router.post("/{record_id}/images/reorder", response_model=list[GoshuinImageRead])
async def reorder_goshuin_images(
    record_id: UUID,
    reorder: ImageReorderRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> list[GoshuinImageRead]:
    await _get_record_for_user(record_id, db, user)

    if len(reorder.image_ids) != len(set(reorder.image_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate image IDs provided",
        )

    result = await db.execute(
        select(GoshuinImage)
        .where(GoshuinImage.goshuin_record_id == record_id)
        .order_by(GoshuinImage.display_order.asc(), GoshuinImage.created_at.asc())
    )
    images = result.scalars().all()
    existing_ids = {image.id for image in images}

    if existing_ids != set(reorder.image_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided image IDs do not match goshuin images",
        )

    image_map = {image.id: image for image in images}

    async with db.begin():
        for index, image_id in enumerate(reorder.image_ids):
            image_map[image_id].display_order = index

    ordered = sorted(image_map.values(), key=lambda img: img.display_order)
    return [GoshuinImageRead.model_validate(image) for image in ordered]
