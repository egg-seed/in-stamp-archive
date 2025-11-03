"""Tests for the export and import API endpoints."""

from __future__ import annotations

from datetime import date
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.models import (
    GoshuinAcquisitionMethod,
    GoshuinImage,
    GoshuinImageType,
    GoshuinRecord,
    GoshuinStatus,
    Spot,
    SpotImage,
    SpotImageType,
    SpotType,
)


@pytest.mark.asyncio
async def test_json_export_import_round_trip(
    test_client: AsyncClient, authenticated_user, db_session
) -> None:
    """Exporting and importing JSON should preserve user data."""

    user = authenticated_user["user"]

    spot = Spot(
        id=uuid4(),
        user_id=user.id,
        slug="test-spot",
        name="Test Spot",
        spot_type=SpotType.TEMPLE,
        prefecture="Tokyo",
        city="Shibuya",
        address="1-2-3",
        description="Test description",
    )

    spot_image = SpotImage(
        id=uuid4(),
        spot_id=spot.id,
        image_url="https://example.com/spot.jpg",
        image_type=SpotImageType.EXTERIOR,
        is_primary=True,
        display_order=1,
    )

    goshuin_record = GoshuinRecord(
        id=uuid4(),
        spot_id=spot.id,
        user_id=user.id,
        visit_date=date(2023, 1, 20),
        acquisition_method=GoshuinAcquisitionMethod.IN_PERSON,
        status=GoshuinStatus.COLLECTED,
        rating=5,
        notes="Memorable visit",
    )

    goshuin_image = GoshuinImage(
        id=uuid4(),
        goshuin_record_id=goshuin_record.id,
        image_url="https://example.com/goshuin.jpg",
        image_type=GoshuinImageType.STAMP_FRONT,
        display_order=1,
    )

    db_session.add(spot)
    db_session.add(spot_image)
    db_session.add(goshuin_record)
    db_session.add(goshuin_image)
    await db_session.commit()

    response = await test_client.get(
        "/api/export/json", headers=authenticated_user["headers"]
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["spots"]
    assert payload["pdf_document"]
    assert payload["spots"][0]["goshuin_records"][0]["notes"] == "Memorable visit"

    await db_session.execute(delete(GoshuinImage))
    await db_session.execute(delete(GoshuinRecord))
    await db_session.execute(delete(SpotImage))
    await db_session.execute(delete(Spot))
    await db_session.commit()

    import_response = await test_client.post(
        "/api/export/json",
        json=payload,
        headers=authenticated_user["headers"],
    )

    assert import_response.status_code == 201
    counts = import_response.json()
    assert counts["spots"] == 1
    assert counts["goshuin_records"] == 1
    assert counts["spot_images"] == 1
    assert counts["goshuin_images"] == 1

    restored_spots = (
        await db_session.execute(select(Spot).where(Spot.user_id == user.id))
    ).scalars().all()
    assert len(restored_spots) == 1

    restored_records = (
        await db_session.execute(select(GoshuinRecord).where(GoshuinRecord.user_id == user.id))
    ).scalars().all()
    assert len(restored_records) == 1
    assert restored_records[0].notes == "Memorable visit"

