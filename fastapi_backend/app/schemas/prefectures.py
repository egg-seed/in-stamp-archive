"""Schemas for prefecture statistics API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PrefectureStats(BaseModel):
    """Statistics for a single prefecture."""

    prefecture: str = Field(..., description="Prefecture name")
    spot_count: int = Field(..., description="Total number of spots in this prefecture")
    goshuin_count: int = Field(..., description="Total number of goshuin records for this prefecture")


class PrefectureStatsResponse(BaseModel):
    """Response schema for prefecture statistics."""

    by_prefecture: list[PrefectureStats] = Field(..., description="Statistics grouped by prefecture")
    total_prefectures: int = Field(..., description="Total number of prefectures with data")
    total_spots: int = Field(..., description="Total number of spots across all prefectures")
    total_goshuin: int = Field(..., description="Total number of goshuin records across all prefectures")
