"""Schemas for spot related API payloads."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SpotBase(BaseModel):
    """Shared attributes for tourist spots."""

    name: str = Field(..., description="Human readable spot name")
    description: str | None = Field(
        default=None, description="Optional description of the spot"
    )
    prefecture: str | None = Field(
        default=None, description="Japanese prefecture where the spot is located"
    )
    spot_type: str = Field(..., description="Type of spot: shrine, temple, museum, or other")
    slug: str = Field(..., description="URL-friendly unique identifier")
    city: str | None = Field(default=None, description="City where the spot is located")
    website_url: str | None = Field(default=None, description="Official website URL")
    phone_number: str | None = Field(default=None, description="Contact phone number")
    address: str | None = Field(default=None, description="Street address of the spot")
    latitude: float | None = Field(
        default=None, description="Latitude coordinate for the spot"
    )
    longitude: float | None = Field(
        default=None, description="Longitude coordinate for the spot"
    )


class SpotCreate(SpotBase):
    """Payload for creating a new spot."""


class SpotUpdate(BaseModel):
    """Payload for partially updating an existing spot."""

    name: str | None = Field(default=None, description="Updated spot name")
    description: str | None = Field(
        default=None, description="Updated description of the spot"
    )
    prefecture: str | None = Field(
        default=None, description="Updated prefecture where the spot is located"
    )
    spot_type: str | None = Field(
        default=None, description="Updated type of spot"
    )
    slug: str | None = Field(
        default=None, description="Updated URL-friendly identifier"
    )
    city: str | None = Field(default=None, description="Updated city")
    website_url: str | None = Field(default=None, description="Updated website URL")
    phone_number: str | None = Field(default=None, description="Updated phone number")
    address: str | None = Field(
        default=None, description="Updated street address of the spot"
    )
    latitude: float | None = Field(
        default=None, description="Updated latitude coordinate"
    )
    longitude: float | None = Field(
        default=None, description="Updated longitude coordinate"
    )


class SpotRead(SpotBase):
    """Response schema returned for a spot."""

    id: UUID
    user_id: UUID

    model_config: dict[str, Any] = {"from_attributes": True}


class PaginatedSpotsResponse(BaseModel):
    """Standard paginated response for spot collections."""

    items: list[SpotRead]
    total: int
    page: int
    size: int

    model_config: dict[str, Any] = {"from_attributes": True}
