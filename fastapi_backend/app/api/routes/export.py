"""API routes exposing data export and import functionality."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, DatabaseSession
from app.services import ExportBundle, ExportService, get_export_service

router = APIRouter(prefix="/export", tags=["export"])


def _build_attachment_filename(extension: str) -> str:
    """Return a timestamped filename for download responses."""

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    return f"goshuin-export-{timestamp}.{extension}"


@router.get("/json", response_class=StreamingResponse)
async def export_json(
    session: DatabaseSession,
    user: CurrentUser,
    service: ExportService = Depends(get_export_service),
) -> StreamingResponse:
    """Return the authenticated user's data as JSON."""

    headers = {
        "Content-Disposition": f'attachment; filename="{_build_attachment_filename("json")}"'
    }
    return StreamingResponse(
        service.stream_json_export(session, user),
        media_type="application/json",
        headers=headers,
    )


@router.get("/csv", response_class=StreamingResponse)
async def export_csv(
    session: DatabaseSession,
    user: CurrentUser,
    service: ExportService = Depends(get_export_service),
) -> StreamingResponse:
    """Return the authenticated user's data as CSV."""

    headers = {
        "Content-Disposition": f'attachment; filename="{_build_attachment_filename("csv")}"'
    }
    return StreamingResponse(
        service.stream_csv_export(session, user),
        media_type="text/csv",
        headers=headers,
    )


@router.post("/json", status_code=status.HTTP_201_CREATED)
async def import_json(
    payload: ExportBundle,
    session: DatabaseSession,
    user: CurrentUser,
    service: ExportService = Depends(get_export_service),
) -> dict[str, int]:
    """Import data from a previously exported JSON bundle."""

    if payload.user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Export bundle does not belong to the authenticated user",
        )

    result = await service.import_from_bundle(session, user, payload)
    return result.as_dict()

