"""Routes for prefecture statistics."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DatabaseSession
from app.models import GoshuinRecord, Spot, User
from app.schemas import PrefectureStats, PrefectureStatsResponse

router = APIRouter(tags=["prefectures"])


@router.get("/stats", response_model=PrefectureStatsResponse)
async def get_prefecture_statistics(
    db: DatabaseSession,
    user: CurrentUser,
) -> PrefectureStatsResponse:
    """Get aggregated statistics grouped by prefecture for the current user.

    Returns spot counts and goshuin record counts for each prefecture
    where the user has activity.
    """
    # Query to get spot counts by prefecture
    spot_stats_query = (
        select(
            Spot.prefecture,
            func.count(Spot.id).label("spot_count")
        )
        .where(Spot.user_id == user.id)
        .group_by(Spot.prefecture)
    )
    spot_stats_result = await db.execute(spot_stats_query)
    spot_stats = {row.prefecture: row.spot_count for row in spot_stats_result}

    # Query to get goshuin counts by prefecture (via spot relationship)
    goshuin_stats_query = (
        select(
            Spot.prefecture,
            func.count(GoshuinRecord.id).label("goshuin_count")
        )
        .join(GoshuinRecord, GoshuinRecord.spot_id == Spot.id)
        .where(
            Spot.user_id == user.id,
            GoshuinRecord.user_id == user.id
        )
        .group_by(Spot.prefecture)
    )
    goshuin_stats_result = await db.execute(goshuin_stats_query)
    goshuin_stats = {row.prefecture: row.goshuin_count for row in goshuin_stats_result}

    # Combine statistics for all prefectures
    all_prefectures = set(spot_stats.keys()) | set(goshuin_stats.keys())

    prefecture_list = [
        PrefectureStats(
            prefecture=prefecture,
            spot_count=spot_stats.get(prefecture, 0),
            goshuin_count=goshuin_stats.get(prefecture, 0)
        )
        for prefecture in sorted(all_prefectures)
    ]

    # Calculate totals
    total_spots = sum(stats.spot_count for stats in prefecture_list)
    total_goshuin = sum(stats.goshuin_count for stats in prefecture_list)

    return PrefectureStatsResponse(
        by_prefecture=prefecture_list,
        total_prefectures=len(prefecture_list),
        total_spots=total_spots,
        total_goshuin=total_goshuin
    )
