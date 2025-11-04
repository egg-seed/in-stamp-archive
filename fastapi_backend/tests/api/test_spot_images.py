"""Tests for spot images API endpoints."""

import pytest
from io import BytesIO
from uuid import uuid4
from httpx import AsyncClient
from PIL import Image

from app.models import Spot, SpotImage


class TestSpotImages:
    """Test suite for spot images endpoints."""

    @pytest.mark.asyncio
    async def test_list_spot_images(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test listing spot images."""
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

        # Create spot images
        image1 = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image1.jpg",
            image_type="exterior",
            is_primary=True,
            display_order=0,
        )
        image2 = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image2.jpg",
            image_type="interior",
            is_primary=False,
            display_order=1,
        )
        db_session.add(image1)
        db_session.add(image2)
        await db_session.commit()

        response = await test_client.get(
            f"/api/spots/{spot.id}/images",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["image_url"] == "https://example.com/image1.jpg"
        assert data[0]["is_primary"] is True
        assert data[1]["image_url"] == "https://example.com/image2.jpg"
        assert data[1]["is_primary"] is False

    @pytest.mark.asyncio
    async def test_upload_spot_image(
        self, test_client: AsyncClient, authenticated_user, db_session, mock_storage
    ):
        """Test uploading a spot image."""
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

        # Create a test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        response = await test_client.post(
            f"/api/spots/{spot.id}/images/uploads",
            headers=authenticated_user["headers"],
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
        )

        assert response.status_code == 201
        data = response.json()
        assert "image_id" in data
        assert "image_url" in data
        assert "thumbnail_url" in data
        assert data["image_url"].startswith("https://mock-storage.example.com/")

    @pytest.mark.asyncio
    async def test_update_spot_image_metadata(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test updating spot image metadata."""
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

        image = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image1.jpg",
            image_type="exterior",
            is_primary=True,
            display_order=0,
        )
        db_session.add(image)
        await db_session.commit()
        await db_session.refresh(image)

        update_data = {
            "image_type": "interior",
            "is_primary": False,
        }

        response = await test_client.patch(
            f"/api/spots/{spot.id}/images/{image.id}",
            json=update_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["image_type"] == "interior"
        assert data["is_primary"] is False

    @pytest.mark.asyncio
    async def test_delete_spot_image(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test deleting a spot image."""
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

        image = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image1.jpg",
            image_type="exterior",
            is_primary=True,
            display_order=0,
        )
        db_session.add(image)
        await db_session.commit()
        await db_session.refresh(image)

        response = await test_client.delete(
            f"/api/spots/{spot.id}/images/{image.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = await test_client.get(
            f"/api/spots/{spot.id}/images",
            headers=authenticated_user["headers"],
        )
        assert get_response.status_code == 200
        assert len(get_response.json()) == 0

    @pytest.mark.asyncio
    async def test_reorder_spot_images(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test reordering spot images."""
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

        image1 = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image1.jpg",
            image_type="exterior",
            is_primary=True,
            display_order=0,
        )
        image2 = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image2.jpg",
            image_type="interior",
            is_primary=False,
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
            f"/api/spots/{spot.id}/images/reorder",
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
    async def test_unauthorized_access_to_spot_images(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test that unauthorized users cannot access spot images."""
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

        # Try to access without authentication
        response = await test_client.get(f"/api/spots/{spot.id}/images")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_nonexistent_spot_images(
        self, test_client: AsyncClient, authenticated_user
    ):
        """Test getting images for a non-existent spot."""
        fake_spot_id = uuid4()

        response = await test_client.get(
            f"/api/spots/{fake_spot_id}/images",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_upload_multiple_spot_images(
        self, test_client: AsyncClient, authenticated_user, db_session, mock_storage
    ):
        """Test uploading multiple spot images sequentially."""
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

        # Upload first image
        img1 = Image.new('RGB', (100, 100), color='red')
        img1_bytes = BytesIO()
        img1.save(img1_bytes, format='JPEG')
        img1_bytes.seek(0)

        response1 = await test_client.post(
            f"/api/spots/{spot.id}/images/uploads",
            headers=authenticated_user["headers"],
            files={"file": ("test1.jpg", img1_bytes, "image/jpeg")},
        )
        assert response1.status_code == 201
        data1 = response1.json()
        assert "image_id" in data1

        # Upload second image
        img2 = Image.new('RGB', (100, 100), color='blue')
        img2_bytes = BytesIO()
        img2.save(img2_bytes, format='JPEG')
        img2_bytes.seek(0)

        response2 = await test_client.post(
            f"/api/spots/{spot.id}/images/uploads",
            headers=authenticated_user["headers"],
            files={"file": ("test2.jpg", img2_bytes, "image/jpeg")},
        )
        assert response2.status_code == 201
        data2 = response2.json()
        assert "image_id" in data2
        assert data1["image_id"] != data2["image_id"]

        # Verify both images exist
        list_response = await test_client.get(
            f"/api/spots/{spot.id}/images",
            headers=authenticated_user["headers"],
        )
        assert list_response.status_code == 200
        images = list_response.json()
        assert len(images) == 2

    @pytest.mark.asyncio
    async def test_first_image_becomes_primary(
        self, test_client: AsyncClient, authenticated_user, db_session, mock_storage
    ):
        """Test that the first uploaded image is automatically set as primary."""
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

        # Upload first image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        response = await test_client.post(
            f"/api/spots/{spot.id}/images/uploads",
            headers=authenticated_user["headers"],
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
        )
        assert response.status_code == 201

        # Verify it's set as primary
        list_response = await test_client.get(
            f"/api/spots/{spot.id}/images",
            headers=authenticated_user["headers"],
        )
        assert list_response.status_code == 200
        images = list_response.json()
        assert len(images) == 1
        assert images[0]["is_primary"] is True

    @pytest.mark.asyncio
    async def test_upload_invalid_image_format(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test uploading an invalid image format."""
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

        # Create a text file pretending to be an image
        text_data = BytesIO(b"This is not an image")

        response = await test_client.post(
            f"/api/spots/{spot.id}/images/uploads",
            headers=authenticated_user["headers"],
            files={"file": ("test.jpg", text_data, "image/jpeg")},
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_change_primary_image(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test changing the primary image unsets other images."""
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

        # Create two images, first one is primary
        image1 = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image1.jpg",
            image_type="exterior",
            is_primary=True,
            display_order=0,
        )
        image2 = SpotImage(
            spot_id=spot.id,
            image_url="https://example.com/image2.jpg",
            image_type="interior",
            is_primary=False,
            display_order=1,
        )
        db_session.add(image1)
        db_session.add(image2)
        await db_session.commit()
        await db_session.refresh(image1)
        await db_session.refresh(image2)

        # Set image2 as primary
        update_data = {"is_primary": True}
        response = await test_client.patch(
            f"/api/spots/{spot.id}/images/{image2.id}",
            json=update_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200

        # Verify image1 is no longer primary
        list_response = await test_client.get(
            f"/api/spots/{spot.id}/images",
            headers=authenticated_user["headers"],
        )
        images = list_response.json()
        primary_images = [img for img in images if img["is_primary"]]
        assert len(primary_images) == 1
        assert primary_images[0]["id"] == str(image2.id)

    @pytest.mark.asyncio
    async def test_reorder_with_invalid_image_ids(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test reordering with non-existent image IDs."""
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

        # Try to reorder with fake image IDs
        reorder_data = {
            "image_ids": [str(uuid4()), str(uuid4())]
        }

        response = await test_client.post(
            f"/api/spots/{spot.id}/images/reorder",
            json=reorder_data,
            headers=authenticated_user["headers"],
        )

        # Should return error or empty result
        assert response.status_code in [400, 404]

    @pytest.mark.asyncio
    async def test_access_other_user_spot_images(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test that users cannot access other users' spot images."""
        # Create another user's spot
        other_user_id = uuid4()
        spot = Spot(
            name="Other User Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="other-temple",
            user_id=other_user_id,
        )
        db_session.add(spot)
        await db_session.commit()
        await db_session.refresh(spot)

        # Try to access with authenticated user
        response = await test_client.get(
            f"/api/spots/{spot.id}/images",
            headers=authenticated_user["headers"],
        )

        # Should be forbidden or not found
        assert response.status_code in [403, 404]
