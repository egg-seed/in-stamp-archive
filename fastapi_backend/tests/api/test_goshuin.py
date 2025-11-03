"""Tests for goshuin API endpoints."""

import pytest
from datetime import date
from uuid import uuid4
from httpx import AsyncClient

from app.models import Spot, GoshuinRecord


class TestGoshuin:
    """Test suite for goshuin endpoints."""

    @pytest.mark.asyncio
    async def test_create_goshuin_record(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test creating a new goshuin record."""
        user = authenticated_user["user"]
        
        # Create a spot first
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

        goshuin_data = {
            "visit_date": "2024-01-15",
            "acquisition_method": "in_person",
            "status": "collected",
            "notes": "Beautiful temple visit",
        }

        response = await test_client.post(
            f"/api/spots/{spot.id}/goshuin",
            json=goshuin_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 201
        data = response.json()
        assert data["spot_id"] == str(spot.id)
        assert data["visit_date"] == goshuin_data["visit_date"]
        assert data["notes"] == goshuin_data["notes"]
        assert data["acquisition_method"] == goshuin_data["acquisition_method"]
        assert data["status"] == goshuin_data["status"]
        assert "id" in data

    @pytest.mark.asyncio
    async def test_list_goshuin_records(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test listing goshuin records."""
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

        # Create goshuin records
        record1 = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
            notes="First visit",
        )
        record2 = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 2, 20),
            acquisition_method="in_person",
            status="collected",
            notes="Second visit",
        )
        db_session.add(record1)
        db_session.add(record2)
        await db_session.commit()

        response = await test_client.get(
            "/api/goshuin",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 2

    @pytest.mark.asyncio
    async def test_get_goshuin_record(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test getting a specific goshuin record."""
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

        response = await test_client.get(
            f"/api/goshuin/{record.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(record.id)
        assert data["notes"] == record.notes

    @pytest.mark.asyncio
    async def test_update_goshuin_record(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test updating a goshuin record."""
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
            notes="Original notes",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        update_data = {
            "notes": "Updated notes",
            "visit_date": "2024-01-16",
        }

        response = await test_client.patch(
            f"/api/goshuin/{record.id}",
            json=update_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == update_data["notes"]
        assert data["visit_date"] == update_data["visit_date"]

    @pytest.mark.asyncio
    async def test_delete_goshuin_record(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test deleting a goshuin record."""
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

        response = await test_client.delete(
            f"/api/goshuin/{record.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 204

        # Verify record is deleted
        get_response = await test_client.get(
            f"/api/goshuin/{record.id}",
            headers=authenticated_user["headers"],
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_nonexistent_goshuin_record(
        self, test_client: AsyncClient, authenticated_user
    ):
        """Test getting a goshuin record that doesn't exist."""
        fake_id = uuid4()
        response = await test_client.get(
            f"/api/goshuin/{fake_id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, test_client: AsyncClient):
        """Test that unauthorized requests are rejected."""
        response = await test_client.get("/api/goshuin")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_filter_by_spot(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test filtering goshuin records by spot."""
        user = authenticated_user["user"]
        
        # Create two spots
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
            name="Temple 2",
            prefecture="Kyoto",
            city="Kyoto",
            address="2-2-2 Kyoto",
            spot_type="temple",
            slug="temple-2",
            user_id=user.id,
        )
        db_session.add(spot1)
        db_session.add(spot2)
        await db_session.commit()
        await db_session.refresh(spot1)
        await db_session.refresh(spot2)

        # Create records for both spots
        record1 = GoshuinRecord(
            spot_id=spot1.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
        )
        record2 = GoshuinRecord(
            spot_id=spot2.id,
            user_id=user.id,
            visit_date=date(2024, 2, 20),
            acquisition_method="in_person",
            status="collected",
        )
        db_session.add(record1)
        db_session.add(record2)
        await db_session.commit()

        response = await test_client.get(
            f"/api/goshuin?spot_id={spot1.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        # Should only return records for spot1
        for item in data["items"]:
            assert item["spot_id"] == str(spot1.id)
