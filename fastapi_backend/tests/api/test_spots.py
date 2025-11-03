"""Tests for spots API endpoints."""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from app.models import Spot


class TestSpots:
    """Test suite for spots endpoints."""

    @pytest.mark.asyncio
    async def test_create_spot(self, test_client: AsyncClient, authenticated_user):
        """Test creating a new spot."""
        spot_data = {
            "name": "Test Temple",
            "prefecture": "Tokyo",
            "city": "Shibuya",
            "address": "1-1-1 Shibuya",
            "spot_type": "temple",
            "slug": "test-temple",
        }

        response = await test_client.post(
            "/api/spots/",
            json=spot_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == spot_data["name"]
        assert data["prefecture"] == spot_data["prefecture"]
        assert data["city"] == spot_data["city"]
        assert data["address"] == spot_data["address"]
        assert data["spot_type"] == spot_data["spot_type"]
        assert data["slug"] == spot_data["slug"]
        assert "id" in data
        assert "user_id" in data

    @pytest.mark.asyncio
    async def test_list_spots(self, test_client: AsyncClient, authenticated_user, db_session):
        """Test listing spots."""
        # Create test spots
        user = authenticated_user["user"]
        spot1 = Spot(
            name="Temple 1",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="temple-1",
            user_id=user.id,
        )
        spot2 = Spot(
            name="Shrine 1",
            prefecture="Kyoto",
            city="Kyoto",
            address="2-2-2 Kyoto",
            spot_type="shrine",
            slug="shrine-1",
            user_id=user.id,
        )
        db_session.add(spot1)
        db_session.add(spot2)
        await db_session.commit()

        response = await test_client.get(
            "/api/spots/",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 2

    @pytest.mark.asyncio
    async def test_list_spots_with_filter(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test listing spots with prefecture filter."""
        user = authenticated_user["user"]
        spot1 = Spot(
            name="Temple 1",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="temple-1",
            user_id=user.id,
        )
        spot2 = Spot(
            name="Shrine 1",
            prefecture="Kyoto",
            city="Kyoto",
            address="2-2-2 Kyoto",
            spot_type="shrine",
            slug="shrine-1",
            user_id=user.id,
        )
        db_session.add(spot1)
        db_session.add(spot2)
        await db_session.commit()

        response = await test_client.get(
            "/api/spots/?prefecture=Tokyo",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        # Should only return Tokyo spots
        for item in data["items"]:
            assert item["prefecture"] == "Tokyo"

    @pytest.mark.asyncio
    async def test_get_spot(self, test_client: AsyncClient, authenticated_user, db_session):
        """Test getting a specific spot."""
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

        response = await test_client.get(
            f"/api/spots/{spot.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(spot.id)
        assert data["name"] == spot.name

    @pytest.mark.asyncio
    async def test_get_nonexistent_spot(
        self, test_client: AsyncClient, authenticated_user
    ):
        """Test getting a spot that doesn't exist."""
        fake_id = uuid4()
        response = await test_client.get(
            f"/api/spots/{fake_id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_spot(self, test_client: AsyncClient, authenticated_user, db_session):
        """Test updating a spot."""
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

        update_data = {
            "name": "Updated Temple",
            "city": "Shinjuku",
        }

        response = await test_client.patch(
            f"/api/spots/{spot.id}",
            json=update_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["city"] == update_data["city"]
        assert data["prefecture"] == spot.prefecture  # Unchanged

    @pytest.mark.asyncio
    async def test_delete_spot(self, test_client: AsyncClient, authenticated_user, db_session):
        """Test deleting a spot."""
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

        response = await test_client.delete(
            f"/api/spots/{spot.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 204

        # Verify spot is deleted
        get_response = await test_client.get(
            f"/api/spots/{spot.id}",
            headers=authenticated_user["headers"],
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, test_client: AsyncClient):
        """Test that unauthorized requests are rejected."""
        response = await test_client.get("/api/spots/")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_search_spots(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test searching spots by keyword."""
        user = authenticated_user["user"]
        spot1 = Spot(
            name="Meiji Shrine",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1 Yoyogi",
            spot_type="shrine",
            slug="meiji-shrine",
            user_id=user.id,
        )
        spot2 = Spot(
            name="Senso-ji Temple",
            prefecture="Tokyo",
            city="Taito",
            address="2-3-1 Asakusa",
            spot_type="temple",
            slug="senso-ji-temple",
            user_id=user.id,
        )
        db_session.add(spot1)
        db_session.add(spot2)
        await db_session.commit()

        response = await test_client.get(
            "/api/spots/?search=Meiji",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        # Should find the Meiji Shrine
        found = any(item["name"] == "Meiji Shrine" for item in data["items"])
        assert found
