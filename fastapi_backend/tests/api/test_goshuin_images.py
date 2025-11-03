"""Tests for goshuin images API endpoints."""

import pytest
from io import BytesIO
from datetime import date
from uuid import uuid4
from httpx import AsyncClient
from PIL import Image

from app.models import Spot, GoshuinRecord, GoshuinImage


class TestGoshuinImages:
    """Test suite for goshuin images endpoints."""

    @pytest.mark.asyncio
    async def test_list_goshuin_images(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test listing goshuin images."""
        user = authenticated_user["user"]
        
        # Create a spot
        spot = Spot(
            name="Test Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="test-temple",
            user_id=user.id,
        )
        db_session.add(spot)
        await db_session.commit()
        await db_session.refresh(spot)

        # Create a goshuin record
        record = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
            notes="Test visit",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        # Create goshuin images
        image1 = GoshuinImage(
            goshuin_record_id=record.id,
            image_url="https://example.com/goshuin1.jpg",
            image_type="stamp_front",
            display_order=0,
        )
        image2 = GoshuinImage(
            goshuin_record_id=record.id,
            image_url="https://example.com/goshuin2.jpg",
            image_type="stamp_back",
            display_order=1,
        )
        db_session.add(image1)
        db_session.add(image2)
        await db_session.commit()

        response = await test_client.get(
            f"/api/goshuin/{record.id}/images",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["image_url"] == "https://example.com/goshuin1.jpg"
        assert data[1]["image_url"] == "https://example.com/goshuin2.jpg"

    @pytest.mark.asyncio
    async def test_upload_goshuin_image(
        self, test_client: AsyncClient, authenticated_user, db_session, mock_storage
    ):
        """Test uploading a goshuin image."""
        user = authenticated_user["user"]
        
        spot = Spot(
            name="Test Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="test-temple",
            user_id=user.id,
        )
        db_session.add(spot)
        await db_session.commit()
        await db_session.refresh(spot)

        record = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
            notes="Test visit",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        # Create a test image
        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        response = await test_client.post(
            f"/api/goshuin/{record.id}/images/uploads",
            headers=authenticated_user["headers"],
            files={"file": ("goshuin.jpg", img_bytes, "image/jpeg")},
        )

        assert response.status_code == 201
        data = response.json()
        assert "image_id" in data
        assert "image_url" in data
        assert "thumbnail_url" in data
        assert data["image_url"].startswith("https://mock-storage.example.com/")

    @pytest.mark.asyncio
    async def test_update_goshuin_image_metadata(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test updating goshuin image metadata."""
        user = authenticated_user["user"]
        
        spot = Spot(
            name="Test Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="test-temple",
            user_id=user.id,
        )
        db_session.add(spot)
        await db_session.commit()
        await db_session.refresh(spot)

        record = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
            notes="Test visit",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        image = GoshuinImage(
            goshuin_record_id=record.id,
            image_url="https://example.com/goshuin1.jpg",
            image_type="stamp_front",
            display_order=0,
        )
        db_session.add(image)
        await db_session.commit()
        await db_session.refresh(image)

        update_data = {
            "image_type": "stamp_back",
        }

        response = await test_client.patch(
            f"/api/goshuin/{record.id}/images/{image.id}",
            json=update_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["image_type"] == "stamp_back"

    @pytest.mark.asyncio
    async def test_delete_goshuin_image(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test deleting a goshuin image."""
        user = authenticated_user["user"]
        
        spot = Spot(
            name="Test Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="test-temple",
            user_id=user.id,
        )
        db_session.add(spot)
        await db_session.commit()
        await db_session.refresh(spot)

        record = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
            notes="Test visit",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        image = GoshuinImage(
            goshuin_record_id=record.id,
            image_url="https://example.com/goshuin1.jpg",
            image_type="stamp_front",
            display_order=0,
        )
        db_session.add(image)
        await db_session.commit()
        await db_session.refresh(image)

        response = await test_client.delete(
            f"/api/goshuin/{record.id}/images/{image.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = await test_client.get(
            f"/api/goshuin/{record.id}/images",
            headers=authenticated_user["headers"],
        )
        assert get_response.status_code == 200
        assert len(get_response.json()) == 0

    @pytest.mark.asyncio
    async def test_reorder_goshuin_images(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test reordering goshuin images."""
        user = authenticated_user["user"]
        
        spot = Spot(
            name="Test Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="test-temple",
            user_id=user.id,
        )
        db_session.add(spot)
        await db_session.commit()
        await db_session.refresh(spot)

        record = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
            notes="Test visit",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        image1 = GoshuinImage(
            goshuin_record_id=record.id,
            image_url="https://example.com/goshuin1.jpg",
            image_type="stamp_front",
            display_order=0,
        )
        image2 = GoshuinImage(
            goshuin_record_id=record.id,
            image_url="https://example.com/goshuin2.jpg",
            image_type="stamp_back",
            display_order=1,
        )
        db_session.add(image1)
        db_session.add(image2)
        await db_session.commit()
        await db_session.refresh(image1)
        await db_session.refresh(image2)

        # Reorder: swap image1 and image2
        reorder_data = {
            "image_ids": [str(image2.id), str(image1.id)]
        }

        response = await test_client.post(
            f"/api/goshuin/{record.id}/images/reorder",
            json=reorder_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["id"] == str(image2.id)
        assert data[0]["display_order"] == 0
        assert data[1]["id"] == str(image1.id)
        assert data[1]["display_order"] == 1

    @pytest.mark.asyncio
    async def test_unauthorized_access_to_goshuin_images(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test that unauthorized users cannot access goshuin images."""
        user = authenticated_user["user"]
        
        spot = Spot(
            name="Test Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="test-temple",
            user_id=user.id,
        )
        db_session.add(spot)
        await db_session.commit()
        await db_session.refresh(spot)

        record = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
            notes="Test visit",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        # Try to access without authentication
        response = await test_client.get(f"/api/goshuin/{record.id}/images")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_nonexistent_goshuin_record_images(
        self, test_client: AsyncClient, authenticated_user
    ):
        """Test getting images for a non-existent goshuin record."""
        fake_record_id = uuid4()
        
        response = await test_client.get(
            f"/api/goshuin/{fake_record_id}/images",
            headers=authenticated_user["headers"],
        )
        
        assert response.status_code == 404
