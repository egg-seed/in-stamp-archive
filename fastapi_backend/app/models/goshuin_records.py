from __future__ import annotations

import enum
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, relationship

from .base import Base

if TYPE_CHECKING:
    from .goshuin_images import GoshuinImage
    from .spots import Spot
    from .user import User


class GoshuinStatus(str, enum.Enum):
    PLANNED = "planned"
    COLLECTED = "collected"
    MISSED = "missed"


class GoshuinAcquisitionMethod(str, enum.Enum):
    IN_PERSON = "in_person"
    BY_MAIL = "by_mail"
    EVENT = "event"
    ONLINE = "online"


class GoshuinRecord(Base):
    __tablename__ = "goshuin_records"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "spot_id", "visit_date", name="uq_goshuin_records_unique_visit"
        ),
        CheckConstraint(
            "rating IS NULL OR (rating >= 1 AND rating <= 5)",
            name="ck_goshuin_records_rating_range",
        ),
        Index("ix_goshuin_records_user_id", "user_id"),
        Index("ix_goshuin_records_spot_id", "spot_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    spot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("spots.id", ondelete="CASCADE"),
        nullable=False,
    )
    visit_date = Column(Date, nullable=False)
    acquisition_method = Column(
        Enum(GoshuinAcquisitionMethod, name="goshuin_acquisition_method"),
        nullable=False,
    )
    status = Column(Enum(GoshuinStatus, name="goshuin_status"), nullable=False)
    rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="goshuin_records")
    spot: Mapped["Spot"] = relationship("Spot", back_populates="goshuin_records")
    images: Mapped[list["GoshuinImage"]] = relationship(
        "GoshuinImage", back_populates="goshuin_record", cascade="all, delete-orphan"
    )
