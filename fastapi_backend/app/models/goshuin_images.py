from __future__ import annotations

import enum
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, relationship

from .base import Base

if TYPE_CHECKING:
    from .goshuin_records import GoshuinRecord


class GoshuinImageType(str, enum.Enum):
    STAMP_FRONT = "stamp_front"
    STAMP_BACK = "stamp_back"
    COVER = "cover"
    OTHER = "other"


class GoshuinImage(Base):
    __tablename__ = "goshuin_images"
    __table_args__ = (
        UniqueConstraint(
            "goshuin_record_id", "display_order", name="uq_goshuin_images_display_order"
        ),
        Index("ix_goshuin_images_record_id", "goshuin_record_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    goshuin_record_id = Column(
        UUID(as_uuid=True),
        ForeignKey("goshuin_records.id", ondelete="CASCADE"),
        nullable=False,
    )
    image_url = Column(String(500), nullable=False)
    image_type = Column(Enum(GoshuinImageType, name="goshuin_image_type"), nullable=False)
    display_order = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    goshuin_record: Mapped["GoshuinRecord"] = relationship(
        "GoshuinRecord", back_populates="images"
    )
