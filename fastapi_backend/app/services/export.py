"""Services for exporting and importing user owned archival data."""

from __future__ import annotations

import csv
import io
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, AsyncGenerator
from uuid import UUID

import json
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    GoshuinImage,
    GoshuinImageType,
    GoshuinRecord,
    GoshuinStatus,
    GoshuinAcquisitionMethod,
    Spot,
    SpotImage,
    SpotImageType,
    SpotType,
    User,
)


class ExportedSpotImage(BaseModel):
    """Serialized representation of a spot image."""

    id: UUID
    image_url: str
    image_type: SpotImageType
    is_primary: bool
    display_order: int
    created_at: datetime

    model_config: dict[str, Any] = {"from_attributes": True}


class ExportedGoshuinImage(BaseModel):
    """Serialized representation of a goshuin image."""

    id: UUID
    image_url: str
    image_type: GoshuinImageType
    display_order: int
    created_at: datetime

    model_config: dict[str, Any] = {"from_attributes": True}


class ExportedGoshuinRecord(BaseModel):
    """Serialized representation of a goshuin record."""

    id: UUID
    user_id: UUID
    spot_id: UUID
    visit_date: date
    acquisition_method: GoshuinAcquisitionMethod
    status: GoshuinStatus
    rating: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    images: list[ExportedGoshuinImage] = Field(default_factory=list)

    model_config: dict[str, Any] = {"from_attributes": True}


class ExportedSpot(BaseModel):
    """Serialized representation of a spot and its goshuin records."""

    id: UUID
    user_id: UUID
    slug: str
    name: str
    spot_type: SpotType
    prefecture: str
    city: str | None
    address: str | None
    latitude: float | None
    longitude: float | None
    description: str | None
    website_url: str | None
    phone_number: str | None
    created_at: datetime
    updated_at: datetime
    images: list[ExportedSpotImage] = Field(default_factory=list)
    goshuin_records: list[ExportedGoshuinRecord] = Field(default_factory=list)

    model_config: dict[str, Any] = {"from_attributes": True}


class ReactPdfImage(BaseModel):
    """Lightweight structure understood by react-pdf generators."""

    url: str
    image_type: str
    order: int


class ReactPdfRecord(BaseModel):
    """React-PDF friendly record section payload."""

    visit_date: date
    acquisition_method: str
    status: str
    rating: int | None
    notes: str | None
    images: list[ReactPdfImage] = Field(default_factory=list)


class ReactPdfSpotSection(BaseModel):
    """Collection of goshuin records grouped under a spot."""

    title: str
    subtitle: str | None = None
    records: list[ReactPdfRecord] = Field(default_factory=list)


class ExportUserMetadata(BaseModel):
    """Minimal metadata about the owner included in export payloads."""

    id: UUID
    email: str


class ExportBundle(BaseModel):
    """Top level payload returned by export operations."""

    version: str = Field(default="1.0")
    generated_at: datetime
    user: ExportUserMetadata
    spots: list[ExportedSpot] = Field(default_factory=list)
    pdf_document: list[ReactPdfSpotSection] = Field(default_factory=list)


@dataclass(slots=True)
class ImportResult:
    """Summary of imported objects."""

    spots: int
    goshuin_records: int
    spot_images: int
    goshuin_images: int

    def as_dict(self) -> dict[str, int]:
        """Return a JSON serialisable dictionary representation."""

        return {
            "spots": self.spots,
            "goshuin_records": self.goshuin_records,
            "spot_images": self.spot_images,
            "goshuin_images": self.goshuin_images,
        }


class ExportService:
    """Service responsible for exporting and importing user data."""

    def __init__(self) -> None:
        self._json_dumps = lambda payload: json.dumps(
            payload, ensure_ascii=False
        ).encode("utf-8")

    async def build_export_bundle(
        self, session: AsyncSession, user: User
    ) -> ExportBundle:
        """Return a fully populated export bundle for a user."""

        result = await session.execute(
            select(Spot)
            .where(Spot.user_id == user.id)
            .options(
                selectinload(Spot.images),
                selectinload(Spot.goshuin_records).selectinload(GoshuinRecord.images),
            )
            .order_by(Spot.name.asc())
        )
        spots = result.scalars().unique().all()

        exported_spots: list[ExportedSpot] = []
        for spot in spots:
            sorted_spot_images = sorted(
                spot.images, key=lambda image: (image.display_order, image.created_at)
            )
            sorted_records = sorted(
                spot.goshuin_records,
                key=lambda record: (record.visit_date, record.created_at),
            )

            exported_records: list[ExportedGoshuinRecord] = []
            for record in sorted_records:
                sorted_record_images = sorted(
                    record.images,
                    key=lambda image: (image.display_order, image.created_at),
                )
                exported_record = ExportedGoshuinRecord.model_validate(
                    record,
                    update={
                        "images": [
                            ExportedGoshuinImage.model_validate(image)
                            for image in sorted_record_images
                        ]
                    },
                )
                exported_records.append(exported_record)

            exported_spot = ExportedSpot.model_validate(
                spot,
                update={
                    "images": [
                        ExportedSpotImage.model_validate(image)
                        for image in sorted_spot_images
                    ],
                    "goshuin_records": exported_records,
                },
            )
            exported_spots.append(exported_spot)

        pdf_document = self._build_react_pdf_sections(exported_spots)

        return ExportBundle(
            generated_at=datetime.utcnow(),
            user=ExportUserMetadata(id=user.id, email=user.email),
            spots=exported_spots,
            pdf_document=pdf_document,
        )

    async def stream_json_export(
        self, session: AsyncSession, user: User
    ) -> AsyncGenerator[bytes, None]:
        """Yield the exported data as JSON bytes."""

        bundle = await self.build_export_bundle(session, user)
        payload = bundle.model_dump(mode="json")
        yield self._json_dumps(payload)

    async def stream_csv_export(
        self, session: AsyncSession, user: User
    ) -> AsyncGenerator[bytes, None]:
        """Yield the exported data in CSV format suitable for spreadsheets."""

        bundle = await self.build_export_bundle(session, user)
        fieldnames = [
            "spot_id",
            "spot_name",
            "spot_slug",
            "spot_type",
            "prefecture",
            "city",
            "visit_date",
            "acquisition_method",
            "status",
            "rating",
            "notes",
        ]

        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=fieldnames)
        writer.writeheader()
        yield buffer.getvalue().encode("utf-8")
        buffer.seek(0)
        buffer.truncate(0)

        for spot in bundle.spots:
            if spot.goshuin_records:
                for record in spot.goshuin_records:
                    writer.writerow(
                        {
                            "spot_id": str(spot.id),
                            "spot_name": spot.name,
                            "spot_slug": spot.slug,
                            "spot_type": getattr(spot.spot_type, "value", spot.spot_type),
                            "prefecture": spot.prefecture,
                            "city": spot.city or "",
                            "visit_date": record.visit_date,
                            "acquisition_method": getattr(
                                record.acquisition_method,
                                "value",
                                record.acquisition_method,
                            ),
                            "status": getattr(record.status, "value", record.status),
                            "rating": record.rating if record.rating is not None else "",
                            "notes": record.notes or "",
                        }
                    )
                    yield buffer.getvalue().encode("utf-8")
                    buffer.seek(0)
                    buffer.truncate(0)
            else:
                writer.writerow(
                    {
                        "spot_id": str(spot.id),
                        "spot_name": spot.name,
                        "spot_slug": spot.slug,
                        "spot_type": getattr(spot.spot_type, "value", spot.spot_type),
                        "prefecture": spot.prefecture,
                        "city": spot.city or "",
                        "visit_date": "",
                        "acquisition_method": "",
                        "status": "",
                        "rating": "",
                        "notes": "",
                    }
                )
                yield buffer.getvalue().encode("utf-8")
                buffer.seek(0)
                buffer.truncate(0)

    async def import_from_bundle(
        self, session: AsyncSession, user: User, bundle: ExportBundle
    ) -> ImportResult:
        """Persist the provided export bundle for the authenticated user."""

        spots_created = 0
        goshuin_created = 0
        spot_images_created = 0
        goshuin_images_created = 0

        for exported_spot in bundle.spots:
            spot_payload = exported_spot.model_dump(
                mode="python", exclude={"images", "goshuin_records", "user_id"}
            )
            spot_payload["user_id"] = user.id
            spot = Spot(**spot_payload)
            session.merge(spot)
            spots_created += 1

            for image in exported_spot.images:
                image_payload = image.model_dump(mode="python")
                image_payload["spot_id"] = exported_spot.id
                session.merge(SpotImage(**image_payload))
                spot_images_created += 1

            for record in exported_spot.goshuin_records:
                record_payload = record.model_dump(mode="python", exclude={"images", "user_id"})
                record_payload["user_id"] = user.id
                record_payload["spot_id"] = exported_spot.id
                goshuin = GoshuinRecord(**record_payload)
                session.merge(goshuin)
                goshuin_created += 1

                for image in record.images:
                    image_payload = image.model_dump(mode="python")
                    image_payload["goshuin_record_id"] = record.id
                    session.merge(GoshuinImage(**image_payload))
                    goshuin_images_created += 1

        await session.commit()

        return ImportResult(
            spots=spots_created,
            goshuin_records=goshuin_created,
            spot_images=spot_images_created,
            goshuin_images=goshuin_images_created,
        )

    def _build_react_pdf_sections(
        self, spots: list[ExportedSpot]
    ) -> list[ReactPdfSpotSection]:
        """Create React-PDF compatible document sections."""

        sections: list[ReactPdfSpotSection] = []
        for spot in spots:
            subtitle_parts = [spot.prefecture]
            if spot.city:
                subtitle_parts.append(spot.city)
            subtitle = " · ".join(subtitle_parts)

            records: list[ReactPdfRecord] = []
            for record in spot.goshuin_records:
                pdf_images = [
                    ReactPdfImage(
                        url=image.image_url,
                        image_type=str(getattr(image.image_type, "value", image.image_type)),
                        order=image.display_order,
                    )
                    for image in record.images
                ]
                records.append(
                    ReactPdfRecord(
                        visit_date=record.visit_date,
                        acquisition_method=str(
                            getattr(record.acquisition_method, "value", record.acquisition_method)
                        ),
                        status=str(getattr(record.status, "value", record.status)),
                        rating=record.rating,
                        notes=record.notes,
                        images=pdf_images,
                    )
                )

            sections.append(
                ReactPdfSpotSection(title=spot.name, subtitle=subtitle or None, records=records)
            )

        return sections


def get_export_service() -> ExportService:
    """FastAPI dependency returning an :class:`ExportService` instance."""

    return ExportService()

