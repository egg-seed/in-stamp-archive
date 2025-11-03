"""Mock storage backend for testing."""

import io
from typing import Dict
from PIL import Image
from app.services.storage import StorageService, StorageUploadResult, ImageMetadata
from fastapi import BackgroundTasks, UploadFile
from fastapi.concurrency import run_in_threadpool


class MockStorageBackend:
    """In-memory storage backend for testing."""

    def __init__(self, base_url: str = "https://mock-storage.example.com"):
        self.base_url = base_url
        self.storage: Dict[str, bytes] = {}
        self.content_types: Dict[str, str] = {}

    def upload(self, *, key: str, data: bytes, content_type: str) -> str:
        """Upload data to in-memory storage."""
        self.storage[key] = data
        self.content_types[key] = content_type
        return self.build_url(key)

    def build_url(self, key: str) -> str:
        """Build a URL for the given key."""
        return f"{self.base_url}/{key}"

    @property
    def supports_deferred_upload(self) -> bool:
        """Mock backend supports deferred uploads."""
        return True

    def get(self, key: str) -> bytes | None:
        """Get data from storage (for testing purposes)."""
        return self.storage.get(key)

    def exists(self, key: str) -> bool:
        """Check if a key exists in storage."""
        return key in self.storage

    def clear(self) -> None:
        """Clear all stored data."""
        self.storage.clear()
        self.content_types.clear()


class MockStorageService(StorageService):
    """Custom storage service for testing that uses JPEG thumbnails."""

    def _build_thumbnail_bytes(self, image: Image.Image) -> bytes:
        """Build thumbnail using JPEG instead of WEBP for testing."""
        thumbnail = image.copy()
        try:
            thumbnail.thumbnail(self._thumbnail_size)
            buffer = io.BytesIO()
            # Use JPEG instead of WEBP for testing
            thumbnail.save(buffer, format="JPEG", quality=85)
            return buffer.getvalue()
        finally:
            thumbnail.close()

    async def upload_image(
        self,
        upload_file: UploadFile,
        *,
        path_prefix: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> StorageUploadResult:
        """Override to use JPEG thumbnails."""
        from app.services.storage import ImageValidationError
        from PIL import ImageOps, UnidentifiedImageError
        
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
            # Use .jpg extension instead of .webp
            thumbnail_key = f"{path_prefix}_thumbnail.jpg"

            if background_tasks and self._backend.supports_deferred_upload:
                background_tasks.add_task(
                    self._backend.upload,
                    key=thumbnail_key,
                    data=thumbnail_bytes,
                    content_type="image/jpeg",  # Changed from image/webp
                )
                thumbnail_url = self._backend.build_url(thumbnail_key)
            else:
                thumbnail_url = await run_in_threadpool(
                    self._backend.upload,
                    key=thumbnail_key,
                    data=thumbnail_bytes,
                    content_type="image/jpeg",  # Changed from image/webp
                )
        finally:
            image.close()

        await upload_file.close()
        return StorageUploadResult(
            original_url=original_url,
            thumbnail_url=thumbnail_url,
            metadata=metadata,
        )
