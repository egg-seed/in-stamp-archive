"""Pydantic schemas for API payloads."""

import uuid
from typing import Any

from fastapi_users import schemas as fastapi_user_schemas
from pydantic import BaseModel
from uuid import UUID


class UserRead(fastapi_user_schemas.BaseUser[uuid.UUID]):
    """Schema returned when reading user information."""


class UserCreate(fastapi_user_schemas.BaseUserCreate):
    """Schema used when creating a user."""


class UserUpdate(fastapi_user_schemas.BaseUserUpdate):
    """Schema used when updating a user."""


class ItemBase(BaseModel):
    """Base schema for item payloads."""

    name: str
    description: str | None = None
    quantity: int | None = None


class ItemCreate(ItemBase):
    """Schema used when creating an item."""


class ItemRead(ItemBase):
    """Schema returned when reading an item."""

    id: UUID
    user_id: UUID

    model_config: dict[str, Any] = {"from_attributes": True}


from .spots import (  # noqa: E402,F401
    PaginatedSpotsResponse,
    SpotCreate,
    SpotRead,
    SpotUpdate,
)

from .goshuin import (  # noqa: E402,F401
    GoshuinCreate,
    GoshuinRead,
    GoshuinUpdate,
    PaginatedGoshuinResponse,
)


__all__ = [
    "UserRead",
    "UserCreate",
    "UserUpdate",
    "ItemBase",
    "ItemCreate",
    "ItemRead",
    "SpotCreate",
    "SpotRead",
    "SpotUpdate",
    "PaginatedSpotsResponse",
    "GoshuinCreate",
    "GoshuinRead",
    "GoshuinUpdate",
    "PaginatedGoshuinResponse",
]
