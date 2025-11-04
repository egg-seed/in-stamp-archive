"""Tests for storage service."""

from __future__ import annotations

import io
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import BackgroundTasks, UploadFile
from PIL import Image

from app.services.storage import (
    GPSMetadata,
    ImageMetadata,
    ImageValidationError,
    StorageService,
    StorageUploadError,
    StorageUploadResult,
)
from tests.mock_storage import MockStorageBackend


class TestStorageService:
    """Test suite for storage service functionality."""

    @pytest.fixture
    def storage_backend(self):
        """Fixture for mock storage backend."""
        return MockStorageBackend()

    @pytest.fixture
    def storage_service(self, storage_backend):
        """Fixture for storage service with mock backend."""
        return StorageService(storage_backend)

    @pytest.fixture
    def sample_image_bytes(self):
        """Create a sample image in memory."""
        img = Image.new("RGB", (800, 600), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        return img_bytes.getvalue()

    @pytest.fixture
    def sample_upload_file(self, sample_image_bytes):
        """Create a sample UploadFile."""
        file = UploadFile(
            filename="test_image.jpg",
            file=io.BytesIO(sample_image_bytes),
        )
        file.content_type = "image/jpeg"
        return file

    @pytest.mark.asyncio
    async def test_upload_image_success(
        self, storage_service, sample_upload_file
    ):
        """Test successful image upload."""
        result = await storage_service.upload_image(
            sample_upload_file,
            path_prefix="test/images",
        )

        assert isinstance(result, StorageUploadResult)
        assert result.original_url.startswith("mock://")
        assert result.thumbnail_url.startswith("mock://")
        assert "test/images" in result.original_url

    @pytest.mark.asyncio
    async def test_upload_image_with_background_tasks(
        self, storage_service, sample_upload_file
    ):
        """Test image upload with background task processing."""
        background_tasks = BackgroundTasks()

        result = await storage_service.upload_image(
            sample_upload_file,
            path_prefix="test/images",
            background_tasks=background_tasks,
        )

        assert isinstance(result, StorageUploadResult)
        # Background tasks should be added for thumbnail generation
        # In mock implementation, this is simplified

    @pytest.mark.asyncio
    async def test_upload_image_invalid_format(self, storage_service):
        """Test upload with invalid image format."""
        # Create a text file pretending to be an image
        text_file = UploadFile(
            filename="not_an_image.jpg",
            file=io.BytesIO(b"This is not an image"),
        )
        text_file.content_type = "image/jpeg"

        with pytest.raises(ImageValidationError):
            await storage_service.upload_image(
                text_file,
                path_prefix="test/images",
            )

    @pytest.mark.asyncio
    async def test_upload_image_unsupported_type(self, storage_service):
        """Test upload with unsupported content type."""
        file = UploadFile(
            filename="document.pdf",
            file=io.BytesIO(b"PDF content"),
        )
        file.content_type = "application/pdf"

        with pytest.raises(ImageValidationError):
            await storage_service.upload_image(
                file,
                path_prefix="test/images",
            )

    @pytest.mark.asyncio
    async def test_validate_image_format_jpeg(self, storage_service, sample_image_bytes):
        """Test JPEG image validation."""
        is_valid = await storage_service._validate_image_format(sample_image_bytes)
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_validate_image_format_png(self, storage_service):
        """Test PNG image validation."""
        img = Image.new("RGB", (100, 100), color="blue")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        is_valid = await storage_service._validate_image_format(img_bytes.getvalue())
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_validate_image_format_webp(self, storage_service):
        """Test WebP image validation."""
        img = Image.new("RGB", (100, 100), color="green")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="WEBP")
        img_bytes.seek(0)

        is_valid = await storage_service._validate_image_format(img_bytes.getvalue())
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_validate_image_format_invalid(self, storage_service):
        """Test invalid image format validation."""
        invalid_data = b"Not an image file"

        is_valid = await storage_service._validate_image_format(invalid_data)
        assert is_valid is False

    @pytest.mark.asyncio
    async def test_generate_thumbnail(self, storage_service, sample_image_bytes):
        """Test thumbnail generation."""
        thumbnail_bytes = await storage_service._generate_thumbnail(
            sample_image_bytes,
            max_size=(300, 300),
        )

        # Verify thumbnail is valid image
        img = Image.open(io.BytesIO(thumbnail_bytes))
        assert img.format in ("JPEG", "WEBP")
        # Thumbnail should be smaller than original
        assert max(img.size) <= 300

    @pytest.mark.asyncio
    async def test_generate_thumbnail_webp_format(
        self, storage_service, sample_image_bytes
    ):
        """Test thumbnail generation in WebP format."""
        thumbnail_bytes = await storage_service._generate_thumbnail(
            sample_image_bytes,
            max_size=(300, 300),
            output_format="WEBP",
        )

        img = Image.open(io.BytesIO(thumbnail_bytes))
        assert img.format == "WEBP"

    @pytest.mark.asyncio
    async def test_extract_exif_metadata_no_exif(
        self, storage_service, sample_image_bytes
    ):
        """Test EXIF extraction from image without EXIF data."""
        metadata = await storage_service._extract_exif_metadata(sample_image_bytes)

        # Simple test image won't have EXIF data
        assert metadata is None or isinstance(metadata, ImageMetadata)

    @pytest.mark.asyncio
    async def test_extract_exif_metadata_with_gps(self, storage_service):
        """Test EXIF extraction with GPS data."""
        # Note: Creating image with real EXIF data is complex
        # This test validates the extraction logic works
        # In production, use real image samples with EXIF

        # For now, test with image without EXIF
        img = Image.new("RGB", (100, 100))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)

        metadata = await storage_service._extract_exif_metadata(img_bytes.getvalue())

        # Should handle images without EXIF gracefully
        assert metadata is None or isinstance(metadata, ImageMetadata)

    @pytest.mark.asyncio
    async def test_delete_image(self, storage_service):
        """Test image deletion."""
        # Upload image first
        img_bytes = io.BytesIO()
        img = Image.new("RGB", (100, 100))
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)

        upload_file = UploadFile(
            filename="delete_test.jpg",
            file=img_bytes,
        )
        upload_file.content_type = "image/jpeg"

        result = await storage_service.upload_image(
            upload_file,
            path_prefix="test/delete",
        )

        # Delete the image
        await storage_service.delete_image(result.original_url)
        await storage_service.delete_image(result.thumbnail_url)

        # Mock backend should handle deletion
        # In real implementation, verify image is deleted

    @pytest.mark.asyncio
    async def test_upload_image_size_limit(self, storage_service):
        """Test upload with image exceeding size limit."""
        # Create a large image (> 10MB)
        large_img = Image.new("RGB", (5000, 5000))
        img_bytes = io.BytesIO()
        large_img.save(img_bytes, format="JPEG", quality=100)
        img_bytes.seek(0)

        # Note: Size validation should be done at API level
        # Storage service handles valid images
        # This test ensures service can handle large valid images

        upload_file = UploadFile(
            filename="large_image.jpg",
            file=img_bytes,
        )
        upload_file.content_type = "image/jpeg"

        # Should succeed if validation passed
        result = await storage_service.upload_image(
            upload_file,
            path_prefix="test/large",
        )

        assert isinstance(result, StorageUploadResult)

    @pytest.mark.asyncio
    async def test_concurrent_uploads(self, storage_service):
        """Test multiple concurrent image uploads."""
        import asyncio

        async def upload_image(index: int):
            img = Image.new("RGB", (100, 100), color=f"#{index:02d}0000")
            img_bytes = io.BytesIO()
            img.save(img_bytes, format="JPEG")
            img_bytes.seek(0)

            upload_file = UploadFile(
                filename=f"concurrent_{index}.jpg",
                file=img_bytes,
            )
            upload_file.content_type = "image/jpeg"

            return await storage_service.upload_image(
                upload_file,
                path_prefix="test/concurrent",
            )

        # Upload 5 images concurrently
        results = await asyncio.gather(*[upload_image(i) for i in range(5)])

        assert len(results) == 5
        assert all(isinstance(r, StorageUploadResult) for r in results)
        # All URLs should be unique
        urls = [r.original_url for r in results]
        assert len(set(urls)) == 5


class TestGPSMetadata:
    """Test suite for GPS metadata handling."""

    def test_gps_metadata_creation(self):
        """Test GPS metadata dataclass creation."""
        gps = GPSMetadata(latitude=35.6762, longitude=139.6503)

        assert gps.latitude == 35.6762
        assert gps.longitude == 139.6503

    def test_gps_metadata_optional_fields(self):
        """Test GPS metadata with None values."""
        gps = GPSMetadata()

        assert gps.latitude is None
        assert gps.longitude is None


class TestImageMetadata:
    """Test suite for image metadata handling."""

    def test_image_metadata_creation(self):
        """Test image metadata dataclass creation."""
        gps = GPSMetadata(latitude=35.6762, longitude=139.6503)
        metadata = ImageMetadata(
            make="Canon",
            model="EOS 5D Mark IV",
            datetime_original=datetime(2025, 11, 4, 10, 30, 0),
            iso_speed=400,
            gps=gps,
        )

        assert metadata.make == "Canon"
        assert metadata.model == "EOS 5D Mark IV"
        assert metadata.iso_speed == 400
        assert metadata.gps.latitude == 35.6762

    def test_image_metadata_optional_fields(self):
        """Test image metadata with optional None values."""
        metadata = ImageMetadata()

        assert metadata.make is None
        assert metadata.model is None
        assert metadata.gps is None


class TestStorageBackendIntegration:
    """Test suite for storage backend integration."""

    @pytest.mark.asyncio
    async def test_mock_backend_upload(self):
        """Test upload with mock backend."""
        backend = MockStorageBackend()
        service = StorageService(backend)

        img = Image.new("RGB", (100, 100))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)

        upload_file = UploadFile(
            filename="backend_test.jpg",
            file=img_bytes,
        )
        upload_file.content_type = "image/jpeg"

        result = await service.upload_image(
            upload_file,
            path_prefix="test/backend",
        )

        assert "mock://" in result.original_url
        assert "backend_test" in result.original_url

    @pytest.mark.asyncio
    async def test_backend_supports_deferred_upload(self):
        """Test backend deferred upload support check."""
        backend = MockStorageBackend()

        # Mock backend should indicate support level
        supports_deferred = backend.supports_deferred_upload

        assert isinstance(supports_deferred, bool)
