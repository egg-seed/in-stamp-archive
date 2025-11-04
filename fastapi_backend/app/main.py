from __future__ import annotations

import argparse
import os
from typing import Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import add_pagination

from .api.routes.export import router as export_router
from .api.routes.goshuin import router as goshuin_router
from .api.routes.goshuin_images import router as goshuin_images_router
from .api.routes.prefectures import router as prefectures_router
from .api.routes.spot_images import router as spot_images_router
from .api.routes.spots import router as spots_router
from .config import settings
from .routes.items import router as items_router
from .schemas import UserCreate, UserRead, UserUpdate
from .users import AUTH_URL_PATH, auth_backend, fastapi_users
from .utils import simple_generate_unique_route_id


def create_app() -> FastAPI:
    app = FastAPI(
        generate_unique_id_function=simple_generate_unique_route_id,
        openapi_url=settings.OPENAPI_URL,
    )

    # Middleware for CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include authentication and user management routes
    app.include_router(
        fastapi_users.get_auth_router(auth_backend),
        prefix=f"/{AUTH_URL_PATH}/jwt",
        tags=["auth"],
    )
    app.include_router(
        fastapi_users.get_register_router(UserRead, UserCreate),
        prefix=f"/{AUTH_URL_PATH}",
        tags=["auth"],
    )
    app.include_router(
        fastapi_users.get_reset_password_router(),
        prefix=f"/{AUTH_URL_PATH}",
        tags=["auth"],
    )
    app.include_router(
        fastapi_users.get_verify_router(UserRead),
        prefix=f"/{AUTH_URL_PATH}",
        tags=["auth"],
    )
    app.include_router(
        fastapi_users.get_users_router(UserRead, UserUpdate),
        prefix="/users",
        tags=["users"],
    )

    # Include items routes
    app.include_router(items_router, prefix="/items")
    app.include_router(spots_router, prefix="/api/spots")
    app.include_router(spot_images_router, prefix="/api/spots")
    app.include_router(goshuin_router, prefix="/api")
    app.include_router(goshuin_images_router, prefix="/api/goshuin")
    app.include_router(prefectures_router, prefix="/api/prefectures")
    app.include_router(export_router, prefix="/api")
    add_pagination(app)

    return app


app = create_app()


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="FastAPI application utilities")
    parser.add_argument(
        "--generate-openapi",
        action="store_true",
        help="Generate the OpenAPI schema to the configured output file.",
    )
    parser.add_argument(
        "--output",
        dest="output",
        help="Override the OPENAPI_OUTPUT_FILE environment variable.",
    )

    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.generate_openapi:
        output_file = args.output or os.getenv("OPENAPI_OUTPUT_FILE")
        if not output_file:
            parser.error(
                "OPENAPI_OUTPUT_FILE environment variable is not set and no --output was provided."
            )

        from fastapi_backend.commands.generate_openapi_schema import (
            generate_openapi_schema,
        )

        generate_openapi_schema(output_file, app=app)


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
