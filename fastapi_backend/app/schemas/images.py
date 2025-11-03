"""Schemas for managing spot and goshuin images."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.models import GoshuinImageType, SpotImageType


class ImageGPSMetadata(BaseModel):
    """GPS coordinates parsed from EXIF metadata."""

    latitude: float | None = None
    longitude: float | None = None

    model_config: dict[str, Any] = {"from_attributes": True}


class ImageExifMetadata(BaseModel):
    """Relevant EXIF metadata returned after an upload."""

    make: str | None = None
    model: str | None = None
    datetime_original: datetime | None = None
    datetime_digitized: datetime | None = None
    exposure_time: str | None = None
    f_number: float | None = None
    iso_speed: int | None = None
    focal_length: float | None = None
    gps: ImageGPSMetadata | None = None

    model_config: dict[str, Any] = {"from_attributes": True}


class ImageUploadResponse(BaseModel):
    """Information returned after successfully uploading an image."""

    image_id: UUID
    image_url: str
    thumbnail_url: str | None = None
    metadata: ImageExifMetadata | None = None


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
