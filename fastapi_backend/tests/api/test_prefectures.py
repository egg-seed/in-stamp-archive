"""Tests for prefecture statistics API endpoints."""

import pytest
from datetime import date
from uuid import uuid4
from httpx import AsyncClient

from app.models import Spot, GoshuinRecord


class TestPrefectureStatistics:
    """Test suite for prefecture statistics endpoints."""

    @pytest.mark.asyncio
    async def test_get_prefecture_statistics_empty(
        self, test_client: AsyncClient, authenticated_user
    ):
        """Test getting prefecture statistics with no data."""
        response = await test_client.get(
            "/api/prefectures/stats",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["by_prefecture"] == []
        assert data["total_prefectures"] == 0
        assert data["total_spots"] == 0
        assert data["total_goshuin"] == 0

    @pytest.mark.asyncio
    async def test_get_prefecture_statistics_with_spots(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test getting prefecture statistics with spots but no goshuin."""
        user = authenticated_user["user"]

        # Create spots in different prefectures
        spot1 = Spot(
            name="Tokyo Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="tokyo-temple",
            user_id=user.id,
        )
        spot2 = Spot(
            name="Kyoto Shrine",
            prefecture="Kyoto",
            city="Kyoto",
            address="2-2-2 Kyoto",
            spot_type="shrine",
            slug="kyoto-shrine",
            user_id=user.id,
        )
        spot3 = Spot(
            name="Another Tokyo Spot",
            prefecture="Tokyo",
            city="Shinjuku",
            address="3-3-3 Shinjuku",
            spot_type="temple",
            slug="tokyo-temple-2",
            user_id=user.id,
        )
        db_session.add_all([spot1, spot2, spot3])
        await db_session.commit()

        response = await test_client.get(
            "/api/prefectures/stats",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_prefectures"] == 2
        assert data["total_spots"] == 3
        assert data["total_goshuin"] == 0

        # Check prefecture breakdown
        prefectures = {item["prefecture"]: item for item in data["by_prefecture"]}
        assert "Tokyo" in prefectures
        assert "Kyoto" in prefectures
        assert prefectures["Tokyo"]["spot_count"] == 2
        assert prefectures["Tokyo"]["goshuin_count"] == 0
        assert prefectures["Kyoto"]["spot_count"] == 1
        assert prefectures["Kyoto"]["goshuin_count"] == 0

    @pytest.mark.asyncio
    async def test_get_prefecture_statistics_with_goshuin(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test getting prefecture statistics with spots and goshuin records."""
        user = authenticated_user["user"]

        # Create spots
        spot1 = Spot(
            name="Tokyo Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="tokyo-temple",
            user_id=user.id,
        )
        spot2 = Spot(
            name="Kyoto Shrine",
            prefecture="Kyoto",
            city="Kyoto",
            address="2-2-2 Kyoto",
            spot_type="shrine",
            slug="kyoto-shrine",
            user_id=user.id,
        )
        db_session.add_all([spot1, spot2])
        await db_session.commit()
        await db_session.refresh(spot1)
        await db_session.refresh(spot2)

        # Create goshuin records
        record1 = GoshuinRecord(
            spot_id=spot1.id,
            user_id=user.id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
        )
        record2 = GoshuinRecord(
            spot_id=spot1.id,
            user_id=user.id,
            visit_date=date(2024, 2, 20),
            acquisition_method="in_person",
            status="collected",
        )
        record3 = GoshuinRecord(
            spot_id=spot2.id,
            user_id=user.id,
            visit_date=date(2024, 3, 10),
            acquisition_method="in_person",
            status="collected",
        )
        db_session.add_all([record1, record2, record3])
        await db_session.commit()

        response = await test_client.get(
            "/api/prefectures/stats",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_prefectures"] == 2
        assert data["total_spots"] == 2
        assert data["total_goshuin"] == 3

        # Check prefecture breakdown
        prefectures = {item["prefecture"]: item for item in data["by_prefecture"]}
        assert prefectures["Tokyo"]["spot_count"] == 1
        assert prefectures["Tokyo"]["goshuin_count"] == 2
        assert prefectures["Kyoto"]["spot_count"] == 1
        assert prefectures["Kyoto"]["goshuin_count"] == 1

    @pytest.mark.asyncio
    async def test_get_prefecture_statistics_sorted_by_name(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test that prefecture statistics are sorted alphabetically."""
        user = authenticated_user["user"]

        # Create spots in different prefectures (not in alphabetical order)
        prefectures_data = [
            ("Osaka", "osaka-shrine"),
            ("Tokyo", "tokyo-temple"),
            ("Aichi", "aichi-temple"),
            ("Kyoto", "kyoto-shrine"),
        ]

        for prefecture, slug in prefectures_data:
            spot = Spot(
                name=f"{prefecture} Spot",
                prefecture=prefecture,
                city=prefecture,
                address=f"1-1-1 {prefecture}",
                spot_type="temple",
                slug=slug,
                user_id=user.id,
            )
            db_session.add(spot)
        await db_session.commit()

        response = await test_client.get(
            "/api/prefectures/stats",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()

        # Check that prefectures are sorted alphabetically
        prefecture_names = [item["prefecture"] for item in data["by_prefecture"]]
        assert prefecture_names == ["Aichi", "Kyoto", "Osaka", "Tokyo"]

    @pytest.mark.asyncio
    async def test_get_prefecture_statistics_user_isolation(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test that prefecture statistics only show current user's data."""
        user = authenticated_user["user"]
        other_user_id = uuid4()

        # Create spot for authenticated user
        user_spot = Spot(
            name="User Tokyo Temple",
            prefecture="Tokyo",
            city="Shibuya",
            address="1-1-1 Shibuya",
            spot_type="temple",
            slug="user-tokyo-temple",
            user_id=user.id,
        )
        db_session.add(user_spot)
        await db_session.commit()
        await db_session.refresh(user_spot)

        # Create spot for other user
        other_spot = Spot(
            name="Other Tokyo Temple",
            prefecture="Tokyo",
            city="Shinjuku",
            address="2-2-2 Shinjuku",
            spot_type="temple",
            slug="other-tokyo-temple",
            user_id=other_user_id,
        )
        db_session.add(other_spot)
        await db_session.commit()
        await db_session.refresh(other_spot)

        # Create goshuin for other user
        other_record = GoshuinRecord(
            spot_id=other_spot.id,
            user_id=other_user_id,
            visit_date=date(2024, 1, 15),
            acquisition_method="in_person",
            status="collected",
        )
        db_session.add(other_record)
        await db_session.commit()

        response = await test_client.get(
            "/api/prefectures/stats",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()

        # Should only see authenticated user's data
        assert data["total_prefectures"] == 1
        assert data["total_spots"] == 1
        assert data["total_goshuin"] == 0

        prefectures = {item["prefecture"]: item for item in data["by_prefecture"]}
        assert prefectures["Tokyo"]["spot_count"] == 1
        assert prefectures["Tokyo"]["goshuin_count"] == 0

    @pytest.mark.asyncio
    async def test_get_prefecture_statistics_unauthorized(
        self, test_client: AsyncClient
    ):
        """Test that unauthorized requests are rejected."""
        response = await test_client.get("/api/prefectures/stats")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_prefecture_statistics_multiple_prefectures(
        self, test_client: AsyncClient, authenticated_user, db_session
    ):
        """Test comprehensive statistics across multiple prefectures."""
        user = authenticated_user["user"]

        # Create spots across 5 prefectures
        prefectures = ["Tokyo", "Kyoto", "Osaka", "Nara", "Hiroshima"]
        spots = []
        for i, prefecture in enumerate(prefectures):
            spot = Spot(
                name=f"{prefecture} Temple {i}",
                prefecture=prefecture,
                city=prefecture,
                address=f"{i}-{i}-{i} {prefecture}",
                spot_type="temple",
                slug=f"{prefecture.lower()}-temple-{i}",
                user_id=user.id,
            )
            db_session.add(spot)
            spots.append(spot)

        await db_session.commit()
        for spot in spots:
            await db_session.refresh(spot)

        # Add varying numbers of goshuin records
        # Tokyo: 3 records, Kyoto: 2 records, Osaka: 1 record, Nara: 0 records, Hiroshima: 0 records
        goshuin_counts = [3, 2, 1, 0, 0]
        for spot, count in zip(spots, goshuin_counts):
            for j in range(count):
                record = GoshuinRecord(
                    spot_id=spot.id,
                    user_id=user.id,
                    visit_date=date(2024, 1, j + 1),
                    acquisition_method="in_person",
                    status="collected",
                )
                db_session.add(record)
        await db_session.commit()

        response = await test_client.get(
            "/api/prefectures/stats",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_prefectures"] == 5
        assert data["total_spots"] == 5
        assert data["total_goshuin"] == 6

        # Verify individual prefecture stats
        prefectures_dict = {item["prefecture"]: item for item in data["by_prefecture"]}
        assert prefectures_dict["Tokyo"]["goshuin_count"] == 3
        assert prefectures_dict["Kyoto"]["goshuin_count"] == 2
        assert prefectures_dict["Osaka"]["goshuin_count"] == 1
        assert prefectures_dict["Nara"]["goshuin_count"] == 0
        assert prefectures_dict["Hiroshima"]["goshuin_count"] == 0
