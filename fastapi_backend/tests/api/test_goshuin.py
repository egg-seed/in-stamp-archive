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

    @pytest.mark.asyncio
    async def test_sort_by_visit_date_asc(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test sorting goshuin records by visit date ascending."""
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

        # Create records with different dates
        record1 = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 3, 15),
            acquisition_method="in_person",
            status="collected",
        )
        record2 = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 10),
            acquisition_method="in_person",
            status="collected",
        )
        db_session.add(record1)
        db_session.add(record2)
        await db_session.commit()

        response = await test_client.get(
            "/api/goshuin?sort_order=asc",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        # First item should be earliest date
        assert items[0]["visit_date"] == "2024-01-10"

    @pytest.mark.asyncio
    async def test_sort_by_visit_date_desc(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test sorting goshuin records by visit date descending."""
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

        # Create records with different dates
        record1 = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 1, 10),
            acquisition_method="in_person",
            status="collected",
        )
        record2 = GoshuinRecord(
            spot_id=spot.id,
            user_id=user.id,
            visit_date=date(2024, 3, 15),
            acquisition_method="in_person",
            status="collected",
        )
        db_session.add(record1)
        db_session.add(record2)
        await db_session.commit()

        response = await test_client.get(
            "/api/goshuin?sort_order=desc",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        # First item should be latest date
        assert items[0]["visit_date"] == "2024-03-15"

    @pytest.mark.asyncio
    async def test_create_with_rating_and_cost(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test creating goshuin record with rating and cost."""
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

        goshuin_data = {
            "visit_date": "2024-01-15",
            "acquisition_method": "in_person",
            "status": "collected",
            "rating": 5,
            "cost": 500,
            "notes": "Amazing temple",
        }

        response = await test_client.post(
            f"/api/spots/{spot.id}/goshuin",
            json=goshuin_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 5
        assert data["cost"] == 500

    @pytest.mark.asyncio
    async def test_partial_update(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test partial update of goshuin record."""
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
            rating=3,
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        # Update only rating
        update_data = {"rating": 5}

        response = await test_client.patch(
            f"/api/goshuin/{record.id}",
            json=update_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 5
        # Other fields should remain unchanged
        assert data["notes"] == "Original notes"
        assert data["visit_date"] == "2024-01-15"

    @pytest.mark.asyncio
    async def test_access_other_user_record(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test that users cannot access other users' goshuin records."""
        # Create another user's spot and record
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

        record = GoshuinRecord(
            spot_id=spot.id,
            user_id=other_user_id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
        )
        db_session.add(record)
        await db_session.commit()
        await db_session.refresh(record)

        # Try to access with authenticated user
        response = await test_client.get(
            f"/api/goshuin/{record.id}",
            headers=authenticated_user["headers"],
        )

        # Should be forbidden or not found
        assert response.status_code in [403, 404]

    @pytest.mark.asyncio
    async def test_create_with_invalid_spot(
        self, test_client: AsyncClient, authenticated_user
    ):
        """Test creating goshuin record with non-existent spot."""
        fake_spot_id = uuid4()

        goshuin_data = {
            "visit_date": "2024-01-15",
            "acquisition_method": "in_person",
            "status": "collected",
        }

        response = await test_client.post(
            f"/api/spots/{fake_spot_id}/goshuin",
            json=goshuin_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 404
