"""Routes for managing spot images."""

from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DatabaseSession
from app.models import Spot, SpotImage, SpotImageType, User
from app.schemas import (
    ImageReorderRequest,
    ImageUploadResponse,
    SpotImageMetadataUpdate,
    SpotImageRead,
)

router = APIRouter(tags=["spot-images"])


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


async def _get_spot_image_for_user(
    spot_id: UUID, image_id: UUID, db: AsyncSession, user: User
) -> SpotImage:
    result = await db.execute(
        select(SpotImage)
        .join(Spot)
        .where(
            SpotImage.id == image_id,
            SpotImage.spot_id == spot_id,
            Spot.user_id == user.id,
        )
    )
    image = result.scalar_one_or_none()
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Spot image not found"
        )
    return image


async def _normalize_spot_display_order(db: AsyncSession, spot_id: UUID) -> None:
    images_result = await db.execute(
        select(SpotImage)
        .where(SpotImage.spot_id == spot_id)
        .order_by(SpotImage.display_order.asc(), SpotImage.created_at.asc())
    )
    for index, image in enumerate(images_result.scalars().all()):
        image.display_order = index


@router.get("/{spot_id}/images", response_model=list[SpotImageRead])
async def list_spot_images(
    spot_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> list[SpotImageRead]:
    await _get_spot_for_user(spot_id, db, user)
    result = await db.execute(
        select(SpotImage)
        .where(SpotImage.spot_id == spot_id)
        .order_by(SpotImage.display_order.asc(), SpotImage.created_at.asc())
    )
    images = result.scalars().all()
    return [SpotImageRead.model_validate(image) for image in images]


@router.post(
    "/{spot_id}/images/uploads",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_spot_image_upload(
    spot_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> ImageUploadResponse:
    spot = await _get_spot_for_user(spot_id, db, user)

    image_id = uuid4()
    upload_path = f"uploads/spots/{user.id}/{spot.id}/{image_id}"

    async with db.begin():
        max_order_result = await db.execute(
            select(func.max(SpotImage.display_order)).where(SpotImage.spot_id == spot.id)
        )
        max_order = max_order_result.scalar()
        display_order = 0 if max_order is None else max_order + 1

        primary_exists_result = await db.execute(
            select(SpotImage.id)
            .where(SpotImage.spot_id == spot.id, SpotImage.is_primary.is_(True))
            .limit(1)
        )
        has_primary = primary_exists_result.scalar_one_or_none() is not None

        image = SpotImage(
            id=image_id,
            spot_id=spot.id,
            image_url=upload_path,
            image_type=SpotImageType.OTHER,
            is_primary=not has_primary,
            display_order=display_order,
        )
        db.add(image)

    return ImageUploadResponse(image_id=image_id, upload_url=upload_path, form_fields={})


@router.patch("/{spot_id}/images/{image_id}", response_model=SpotImageRead)
async def update_spot_image_metadata(
    spot_id: UUID,
    image_id: UUID,
    metadata: SpotImageMetadataUpdate,
    db: DatabaseSession,
    user: CurrentUser,
) -> SpotImageRead:
    image = await _get_spot_image_for_user(spot_id, image_id, db, user)
    update_data = metadata.model_dump(exclude_unset=True)

    if not update_data:
        return SpotImageRead.model_validate(image)

    async with db.begin():
        if update_data.get("is_primary"):
            await db.execute(
                update(SpotImage)
                .where(SpotImage.spot_id == image.spot_id, SpotImage.id != image.id)
                .values(is_primary=False)
            )

        for field, value in update_data.items():
            setattr(image, field, value)

        db.add(image)

    await db.refresh(image)
    return SpotImageRead.model_validate(image)


@router.delete("/{spot_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spot_image(
    spot_id: UUID,
    image_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> None:
    image = await _get_spot_image_for_user(spot_id, image_id, db, user)

    async with db.begin():
        was_primary = image.is_primary
        await db.delete(image)
        await db.flush()

        if was_primary:
            next_primary_result = await db.execute(
                select(SpotImage)
                .where(SpotImage.spot_id == spot_id)
                .order_by(SpotImage.display_order.asc(), SpotImage.created_at.asc())
                .limit(1)
            )
            next_primary = next_primary_result.scalar_one_or_none()
            if next_primary is not None:
                next_primary.is_primary = True

        await _normalize_spot_display_order(db, spot_id)

    return None


@router.post("/{spot_id}/images/reorder", response_model=list[SpotImageRead])
async def reorder_spot_images(
    spot_id: UUID,
    reorder: ImageReorderRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> list[SpotImageRead]:
    await _get_spot_for_user(spot_id, db, user)

    if len(reorder.image_ids) != len(set(reorder.image_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate image IDs provided",
        )

    result = await db.execute(
        select(SpotImage)
        .where(SpotImage.spot_id == spot_id)
        .order_by(SpotImage.display_order.asc(), SpotImage.created_at.asc())
    )
    images = result.scalars().all()
    existing_ids = {image.id for image in images}

    if existing_ids != set(reorder.image_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided image IDs do not match spot images",
        )

    image_map = {image.id: image for image in images}

    async with db.begin():
        for index, image_id in enumerate(reorder.image_ids):
            image_map[image_id].display_order = index

    ordered = sorted(image_map.values(), key=lambda img: img.display_order)
    return [SpotImageRead.model_validate(image) for image in ordered]
