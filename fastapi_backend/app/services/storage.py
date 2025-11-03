"""Abstractions and helpers for persisting media assets."""

from __future__ import annotations

import io
import logging
import mimetypes
from dataclasses import dataclass
from datetime import datetime
from fractions import Fraction
from typing import Protocol

import httpx
from fastapi import BackgroundTasks, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import ExifTags, Image, ImageOps, UnidentifiedImageError

from app.config import settings

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:  # pragma: no cover - boto3 is optional
    boto3 = None  # type: ignore[assignment]
    BotoCoreError = ClientError = Exception  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class StorageServiceError(RuntimeError):
    """Base error raised for storage related issues."""


class StorageConfigurationError(StorageServiceError):
    """Raised when the storage layer is misconfigured."""


class StorageUploadError(StorageServiceError):
    """Raised when uploading an asset fails."""


class ImageValidationError(StorageServiceError):
    """Raised when the provided file is not a valid image."""


@dataclass(slots=True)
class GPSMetadata:
    """Structured GPS information extracted from EXIF metadata."""

    latitude: float | None = None
    longitude: float | None = None


@dataclass(slots=True)
class ImageMetadata:
    """Subset of EXIF metadata returned to API consumers."""

    make: str | None = None
    model: str | None = None
    datetime_original: datetime | None = None
    datetime_digitized: datetime | None = None
    exposure_time: str | None = None
    f_number: float | None = None
    iso_speed: int | None = None
    focal_length: float | None = None
    gps: GPSMetadata | None = None


@dataclass(slots=True)
class StorageUploadResult:
    """Result returned after uploading an image."""

    original_url: str
    thumbnail_url: str
    metadata: ImageMetadata | None


class StorageBackend(Protocol):
    """Interface implemented by storage backends."""

    def upload(self, *, key: str, data: bytes, content_type: str) -> str: ...

    def build_url(self, key: str) -> str: ...

    @property
    def supports_deferred_upload(self) -> bool: ...


class S3StorageBackend:
    """Storage backend that persists assets on S3 compatible services."""

    def __init__(
        self,
        *,
        bucket: str,
        region: str | None,
        endpoint_url: str | None,
        access_key_id: str | None,
        secret_access_key: str | None,
        base_url: str | None = None,
    ) -> None:
        if boto3 is None:  # pragma: no cover - exercised when boto3 is missing
            raise StorageConfigurationError(
                "The S3 storage backend requires the 'boto3' package to be installed."
            )

        session_params: dict[str, str | None] = {
            "region_name": region,
            "aws_access_key_id": access_key_id,
            "aws_secret_access_key": secret_access_key,
        }
        client_params = {k: v for k, v in session_params.items() if v is not None}
        if endpoint_url:
            client_params["endpoint_url"] = endpoint_url

        self._bucket = bucket
        self._region = region
        self._endpoint_url = endpoint_url.rstrip("/") if endpoint_url else None
        self._base_url = base_url.rstrip("/") if base_url else None
        self._client = boto3.client("s3", **client_params)

    def upload(self, *, key: str, data: bytes, content_type: str) -> str:
        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as exc:  # pragma: no cover - requires boto3
            raise StorageUploadError("Failed to upload object to S3") from exc
        return self.build_url(key)

    def build_url(self, key: str) -> str:
        if self._base_url:
            return f"{self._base_url}/{key}"
        if self._endpoint_url:
            return f"{self._endpoint_url}/{self._bucket}/{key}"
        if self._region:
            return f"https://{self._bucket}.s3.{self._region}.amazonaws.com/{key}"
        return f"https://{self._bucket}.s3.amazonaws.com/{key}"

    @property
    def supports_deferred_upload(self) -> bool:
        return True


class VercelBlobStorageBackend:
    """Storage backend targeting Vercel Blob."""

    def __init__(
        self,
        *,
        token: str,
        endpoint: str | None = None,
        base_url: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self._token = token
        self._endpoint = (endpoint or "https://blob.vercel-storage.com").rstrip("/")
        self._base_url = base_url.rstrip("/") if base_url else None
        self._timeout = timeout

    def upload(self, *, key: str, data: bytes, content_type: str) -> str:
        try:
            response = httpx.post(
                f"{self._endpoint}/upload",
                headers={"Authorization": f"Bearer {self._token}"},
                data={"pathname": key},
                files={"file": (key, data, content_type)},
                timeout=self._timeout,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - requires network
            raise StorageUploadError("Failed to upload blob to Vercel") from exc

        payload = response.json()
        url = payload.get("downloadUrl") or payload.get("url") or payload.get("href")
        if url:
            return url
        return self.build_url(key)

    def build_url(self, key: str) -> str:
        if self._base_url:
            return f"{self._base_url}/{key}"
        return f"{self._endpoint}/{key}"

    @property
    def supports_deferred_upload(self) -> bool:
        # Deferred uploads require deterministic URLs; we rely on provided base URL.
        return self._base_url is not None


class StorageService:
    """High level orchestrator for persisting uploaded images."""

    def __init__(
        self,
        backend: StorageBackend,
        *,
        thumbnail_size: tuple[int, int] = (640, 640),
    ) -> None:
        self._backend = backend
        self._thumbnail_size = thumbnail_size

    async def upload_image(
        self,
        upload_file: UploadFile,
        *,
        path_prefix: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> StorageUploadResult:
        data = await upload_file.read()
        if not data:
            raise ImageValidationError("Uploaded file is empty")

        try:
            image = Image.open(io.BytesIO(data))
        except UnidentifiedImageError as exc:
            raise ImageValidationError("Uploaded file is not a valid image") from exc

        try:
            image = ImageOps.exif_transpose(image)
            metadata = self._extract_metadata(image)
            extension = self._detect_extension(upload_file, image)
            original_key = f"{path_prefix}{extension}"
            content_type = self._detect_content_type(upload_file, extension, image)

            original_url = await run_in_threadpool(
                self._backend.upload,
                key=original_key,
                data=data,
                content_type=content_type,
            )

            thumbnail_bytes = await run_in_threadpool(
                self._build_thumbnail_bytes, image
            )
            thumbnail_key = f"{path_prefix}_thumbnail.webp"

            if background_tasks and self._backend.supports_deferred_upload:
                background_tasks.add_task(
                    self._backend.upload,
                    key=thumbnail_key,
                    data=thumbnail_bytes,
                    content_type="image/webp",
                )
                thumbnail_url = self._backend.build_url(thumbnail_key)
            else:
                if background_tasks and not self._backend.supports_deferred_upload:
                    logger.debug(
                        "Storage backend does not support deferred uploads;"
                        " processing thumbnail synchronously"
                    )
                thumbnail_url = await run_in_threadpool(
                    self._backend.upload,
                    key=thumbnail_key,
                    data=thumbnail_bytes,
                    content_type="image/webp",
                )
        finally:
            image.close()

        await upload_file.close()
        return StorageUploadResult(
            original_url=original_url,
            thumbnail_url=thumbnail_url,
            metadata=metadata,
        )

    def _build_thumbnail_bytes(self, image: Image.Image) -> bytes:
        thumbnail = image.copy()
        try:
            thumbnail.thumbnail(self._thumbnail_size)
            buffer = io.BytesIO()
            thumbnail.save(buffer, format="WEBP", quality=85)
            return buffer.getvalue()
        finally:
            thumbnail.close()

    def _detect_extension(self, upload_file: UploadFile, image: Image.Image) -> str:
        filename = upload_file.filename or ""
        extension = ""
        if "." in filename:
            extension = filename[filename.rfind(".") :]
        if not extension and image.format:
            extension = f".{image.format.lower()}"
        if not extension and upload_file.content_type:
            guessed = mimetypes.guess_extension(upload_file.content_type)
            if guessed:
                extension = guessed
        if not extension:
            extension = ".jpg"
        extension = extension.lower()
        if extension in {".jpeg", ".jpe"}:
            return ".jpg"
        return extension

    def _detect_content_type(
        self, upload_file: UploadFile, extension: str, image: Image.Image
    ) -> str:
        if upload_file.content_type:
            return upload_file.content_type
        if image.format and image.format.upper() in Image.MIME:
            return Image.MIME[image.format.upper()]
        guessed = mimetypes.types_map.get(extension.lower())
        return guessed or "image/jpeg"

    def _extract_metadata(self, image: Image.Image) -> ImageMetadata | None:
        exif_data = image.getexif()
        if not exif_data:
            return None

        metadata = ImageMetadata()
        for tag_id, value in exif_data.items():
            tag = ExifTags.TAGS.get(tag_id)
            if tag == "DateTimeOriginal":
                metadata.datetime_original = self._parse_datetime(value)
            elif tag == "DateTimeDigitized":
                metadata.datetime_digitized = self._parse_datetime(value)
            elif tag == "Make":
                metadata.make = str(value)
            elif tag == "Model":
                metadata.model = str(value)
            elif tag == "ExposureTime":
                metadata.exposure_time = self._format_exposure(value)
            elif tag == "FNumber":
                metadata.f_number = self._to_float(value)
            elif tag == "ISOSpeedRatings" or tag == "PhotographicSensitivity":
                metadata.iso_speed = self._to_int(value)
            elif tag == "FocalLength":
                metadata.focal_length = self._to_float(value)
            elif tag == "GPSInfo":
                gps = self._parse_gps(value)
                if gps:
                    metadata.gps = gps

        return metadata

    def _parse_datetime(self, raw: object) -> datetime | None:
        if not isinstance(raw, str):
            return None
        try:
            return datetime.strptime(raw, "%Y:%m:%d %H:%M:%S")
        except ValueError:
            return None

    def _format_exposure(self, value: object) -> str | None:
        if isinstance(value, (int, float)):
            if value == 0:
                return None
            if value >= 1:
                return f"{value:.1f}s"
            return f"1/{round(1 / value)}s"
        fraction = self._to_fraction(value)
        if fraction is None:
            return None
        if fraction >= 1:
            return f"{float(fraction):.1f}s"
        return f"1/{round(1 / float(fraction))}s"

    def _to_fraction(self, value: object) -> Fraction | None:
        if isinstance(value, Fraction):
            return value
        if isinstance(value, tuple) and len(value) == 2:
            numerator, denominator = value
            if denominator:
                return Fraction(numerator, denominator)
        return None

    def _to_float(self, value: object) -> float | None:
        fraction = self._to_fraction(value)
        if fraction is not None:
            return float(fraction)
        if isinstance(value, (int, float)):
            return float(value)
        return None

    def _to_int(self, value: object) -> int | None:
        if isinstance(value, int):
            return value
        if isinstance(value, (tuple, list)) and value:
            if isinstance(value[0], int):
                return value[0]
        return None

    def _parse_gps(self, value: object) -> GPSMetadata | None:
        if not isinstance(value, dict):
            return None

        gps_tags = {ExifTags.GPSTAGS.get(k): v for k, v in value.items()}
        lat = self._convert_gps_coordinate(
            gps_tags.get("GPSLatitude"), gps_tags.get("GPSLatitudeRef")
        )
        lon = self._convert_gps_coordinate(
            gps_tags.get("GPSLongitude"), gps_tags.get("GPSLongitudeRef")
        )
        if lat is None and lon is None:
            return None
        return GPSMetadata(latitude=lat, longitude=lon)

    def _convert_gps_coordinate(
        self, coordinate: object, ref: object
    ) -> float | None:
        if not isinstance(coordinate, (tuple, list)) or len(coordinate) != 3:
            return None
        degrees = self._to_float(coordinate[0])
        minutes = self._to_float(coordinate[1])
        seconds = self._to_float(coordinate[2])
        if degrees is None or minutes is None or seconds is None:
            return None
        value = degrees + minutes / 60 + seconds / 3600
        if isinstance(ref, str) and ref.upper() in {"S", "W"}:
            value *= -1
        return value


def _create_backend_from_settings() -> StorageBackend:
    backend_name = settings.STORAGE_BACKEND
    base_url = settings.STORAGE_PUBLIC_URL

    if backend_name is None:
        raise StorageConfigurationError("STORAGE_BACKEND environment variable is not set")

    backend_name = backend_name.lower()
    if backend_name == "s3":
        if not settings.S3_BUCKET_NAME:
            raise StorageConfigurationError("S3_BUCKET_NAME must be configured for S3 backend")
        return S3StorageBackend(
            bucket=settings.S3_BUCKET_NAME,
            region=settings.S3_REGION_NAME,
            endpoint_url=settings.S3_ENDPOINT_URL,
            access_key_id=settings.AWS_ACCESS_KEY_ID,
            secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            base_url=base_url,
        )
    if backend_name in {"vercel", "vercel_blob", "vercel-blob"}:
        if not settings.VERCEL_BLOB_READ_WRITE_TOKEN:
            raise StorageConfigurationError(
                "VERCEL_BLOB_READ_WRITE_TOKEN must be set for the Vercel Blob backend"
            )
        return VercelBlobStorageBackend(
            token=settings.VERCEL_BLOB_READ_WRITE_TOKEN,
            endpoint=settings.VERCEL_BLOB_ENDPOINT,
            base_url=base_url,
        )

    raise StorageConfigurationError(f"Unsupported storage backend '{settings.STORAGE_BACKEND}'")


def get_storage_service() -> StorageService:
    """Return a singleton instance of the storage service."""

    if not hasattr(get_storage_service, "_instance"):
        backend = _create_backend_from_settings()
        get_storage_service._instance = StorageService(backend=backend)  # type: ignore[attr-defined]
    return get_storage_service._instance  # type: ignore[attr-defined]
