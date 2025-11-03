from __future__ import annotations

import enum
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, relationship

from .base import Base

if TYPE_CHECKING:
    from .goshuin_records import GoshuinRecord


class SpotType(str, enum.Enum):
    SHRINE = "shrine"
    TEMPLE = "temple"
    MUSEUM = "museum"
    OTHER = "other"


class Spot(Base):
    __tablename__ = "spots"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_spots_slug"),
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="ck_spots_latitude_range"),
        CheckConstraint(
            "longitude >= -180 AND longitude <= 180",
            name="ck_spots_longitude_range",
        ),
        Index("ix_spots_prefecture", "prefecture"),
        Index("ix_spots_spot_type", "spot_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    slug = Column(String(120), nullable=False)
    name = Column(String(255), nullable=False)
    spot_type = Column(Enum(SpotType, name="spot_type"), nullable=False)
    prefecture = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    website_url = Column(String(255), nullable=True)
    phone_number = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    goshuin_records: Mapped[list["GoshuinRecord"]] = relationship(
        "GoshuinRecord", back_populates="spot", cascade="all, delete-orphan"
    )
    images: Mapped[list["SpotImage"]] = relationship(
        "SpotImage", back_populates="spot", cascade="all, delete-orphan"
    )


class SpotImageType(str, enum.Enum):
    EXTERIOR = "exterior"
    INTERIOR = "interior"
    MAP = "map"
    OTHER = "other"


class SpotImage(Base):
    __tablename__ = "spot_images"
    __table_args__ = (
        UniqueConstraint(
            "spot_id", "display_order", name="uq_spot_images_spot_id_display_order"
        ),
        Index("ix_spot_images_spot_id", "spot_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    spot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("spots.id", ondelete="CASCADE"),
        nullable=False,
    )
    image_url = Column(String(500), nullable=False)
    image_type = Column(Enum(SpotImageType, name="spot_image_type"), nullable=False)
    is_primary = Column(Boolean, nullable=False, server_default="false")
    display_order = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    spot: Mapped["Spot"] = relationship("Spot", back_populates="images")
