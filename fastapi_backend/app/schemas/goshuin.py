"""Schemas for goshuin record API payloads."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models import GoshuinAcquisitionMethod, GoshuinStatus


class GoshuinBase(BaseModel):
    """Shared attributes for goshuin records."""

    visit_date: date = Field(..., description="Date the goshuin was (planned to be) visited")
    acquisition_method: GoshuinAcquisitionMethod = Field(
        ..., description="How the goshuin was obtained"
    )
    status: GoshuinStatus = Field(..., description="Current collection status of the goshuin")
    rating: int | None = Field(
        default=None,
        ge=1,
        le=5,
        description="Optional rating from 1 (lowest) to 5 (highest)",
    )
    notes: str | None = Field(
        default=None,
        description="Optional markdown notes about the visit or goshuin",
    )

    @field_validator("visit_date")
    @classmethod
    def validate_visit_date(cls, value: date) -> date:
        """Ensure the visit date is not in the future."""

        if value > datetime.utcnow().date():
            raise ValueError("visit_date cannot be in the future")
        return value


class GoshuinCreate(GoshuinBase):
    """Payload for creating a goshuin record."""


class GoshuinUpdate(BaseModel):
    """Payload for partially updating a goshuin record."""

    visit_date: date | None = Field(
        default=None, description="Updated date the goshuin was (planned to be) visited"
    )
    acquisition_method: GoshuinAcquisitionMethod | None = Field(
        default=None, description="Updated acquisition method"
    )
    status: GoshuinStatus | None = Field(
        default=None, description="Updated collection status of the goshuin"
    )
    rating: int | None = Field(
        default=None,
        ge=1,
        le=5,
        description="Updated rating from 1 (lowest) to 5 (highest)",
    )
    notes: str | None = Field(
        default=None,
        description="Updated markdown notes about the visit or goshuin",
    )

    @field_validator("visit_date")
    @classmethod
    def validate_visit_date(cls, value: date | None) -> date | None:
        """Ensure the visit date is not in the future when provided."""

        if value is None:
            return value
        if value > datetime.utcnow().date():
            raise ValueError("visit_date cannot be in the future")
        return value


class GoshuinRead(GoshuinBase):
    """Response schema returned for a goshuin record."""

    id: UUID
    user_id: UUID
    spot_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config: dict[str, Any] = {"from_attributes": True}


class PaginatedGoshuinResponse(BaseModel):
    """Standard paginated response for goshuin record collections."""

    items: list[GoshuinRead]
    total: int
    page: int
    size: int

    model_config: dict[str, Any] = {"from_attributes": True}


__all__ = [
    "GoshuinCreate",
    "GoshuinRead",
    "GoshuinUpdate",
    "PaginatedGoshuinResponse",
]
