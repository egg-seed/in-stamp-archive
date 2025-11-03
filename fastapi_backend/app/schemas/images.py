"""Schemas for managing spot and goshuin images."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import GoshuinImageType, SpotImageType


class ImageUploadResponse(BaseModel):
    """Information returned when initiating an image upload."""

    image_id: UUID
    upload_url: str
    form_fields: dict[str, str] = Field(default_factory=dict)


class ImageReorderRequest(BaseModel):
    """Request payload containing the desired order of images."""

    image_ids: list[UUID]


class SpotImageMetadataUpdate(BaseModel):
    """Editable metadata for a spot image."""

    image_url: str | None = None
    image_type: SpotImageType | None = None
    is_primary: bool | None = None


class GoshuinImageMetadataUpdate(BaseModel):
    """Editable metadata for a goshuin image."""

    image_url: str | None = None
    image_type: GoshuinImageType | None = None


class SpotImageRead(BaseModel):
    """Serialized spot image payload."""

    id: UUID
    image_url: str
    image_type: SpotImageType
    is_primary: bool
    display_order: int

    model_config: dict[str, Any] = {"from_attributes": True}


class GoshuinImageRead(BaseModel):
    """Serialized goshuin image payload."""

    id: UUID
    image_url: str
    image_type: GoshuinImageType
    display_order: int

    model_config: dict[str, Any] = {"from_attributes": True}
