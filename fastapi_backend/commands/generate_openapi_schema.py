import json
import os
from pathlib import Path
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover - imported for type checking only
    from fastapi import FastAPI
else:  # pragma: no cover - fallback for runtime when FastAPI is unavailable
    FastAPI = object

OUTPUT_FILE = os.getenv("OPENAPI_OUTPUT_FILE")


def _resolve_app() -> "FastAPI":
    """Import and return the FastAPI application instance."""

    from app.main import create_app

    return create_app()


def generate_openapi_schema(output_file: str, app: Optional["FastAPI"] = None) -> None:
    """Persist the OpenAPI schema produced by the FastAPI application."""

    if app is None:
        app = _resolve_app()

    schema = app.openapi()
    output_path = Path(output_file)

    updated_schema = remove_operation_id_tag(schema)

    output_path.write_text(json.dumps(updated_schema, indent=2))
    print(f"OpenAPI schema saved to {output_file}")


def remove_operation_id_tag(schema):
    """
    Removes the tag prefix from the operation IDs in the OpenAPI schema.

    This cleans up the OpenAPI operation IDs that are used by the frontend
    client generator to create the names of the functions. The modified
    schema is then returned.
    """
    seen_ids: dict[str, str] = {}

    for path, path_data in schema["paths"].items():
        for method, operation in path_data.items():
            tag = operation["tags"][0]
            operation_id = operation["operationId"]
            to_remove = f"{tag}-"
            if operation_id.startswith(to_remove):
                new_operation_id = operation_id[len(to_remove) :]
            else:
                new_operation_id = operation_id

            dedupe_key = new_operation_id
            if dedupe_key in seen_ids and seen_ids[dedupe_key] != f"{path}:{method}":
                new_operation_id = f"{new_operation_id}_{method}"

            seen_ids[new_operation_id] = f"{path}:{method}"
            operation["operationId"] = new_operation_id
    return schema


if __name__ == "__main__":
    generate_openapi_schema(OUTPUT_FILE)
