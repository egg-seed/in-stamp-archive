"""Export data schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ExportSpotData(BaseModel):
    """Spot data for export."""

    id: str
    name: str
    spot_type: str
    prefecture: str
    city: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    website_url: str | None = None
    phone_number: str | None = None
    created_at: datetime
    updated_at: datetime


class ExportGoshuinData(BaseModel):
    """Goshuin record data for export."""

    id: str
    spot_id: str
    spot_name: str
    visit_date: datetime
    notes: str | None = None
    rating: int | None = None
    created_at: datetime
    updated_at: datetime


class ExportData(BaseModel):
    """Complete export data structure."""

    export_date: datetime = Field(..., description="Date of export")
    user_id: str = Field(..., description="User ID")
    spots: list[ExportSpotData] = Field(..., description="All user spots")
    goshuin_records: list[ExportGoshuinData] = Field(
        ..., description="All user goshuin records"
    )
    statistics: dict[str, Any] = Field(..., description="Summary statistics")


class ExportFormat(BaseModel):
    """Export format options."""

    format: str = Field(..., description="Export format: json, csv_spots, csv_goshuin")
    include_images: bool = Field(
        default=False, description="Include image URLs in export"
    )
