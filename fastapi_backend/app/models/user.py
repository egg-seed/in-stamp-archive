from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy.orm import Mapped, relationship

from .base import Base

if TYPE_CHECKING:
    from .goshuin_records import GoshuinRecord
    from .item import Item


class User(SQLAlchemyBaseUserTableUUID, Base):
    """Application user model."""

    items: Mapped[list["Item"]] = relationship(
        "Item", back_populates="user", cascade="all, delete-orphan"
    )
    goshuin_records: Mapped[list["GoshuinRecord"]] = relationship(
        "GoshuinRecord", back_populates="user", cascade="all, delete-orphan"
    )
