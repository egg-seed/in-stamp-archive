import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import Connection, make_url
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.models import Base
from dotenv import load_dotenv
import pathlib

# Load .env file from the same directory as this script
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _derive_urls(database_url: str) -> tuple[str, str]:
    url = make_url(database_url)

    sync_drivername = url.drivername
    if "+" in sync_drivername and sync_drivername.endswith("asyncpg"):
        sync_drivername = sync_drivername.replace("+asyncpg", "")
    elif "+" in sync_drivername and sync_drivername.endswith("aiosqlite"):
        sync_drivername = sync_drivername.replace("+aiosqlite", "")

    sync_url = url.set(drivername=sync_drivername)

    async_drivername = url.drivername
    if not async_drivername.endswith("asyncpg") and async_drivername.startswith("postgresql"):
        async_drivername = "postgresql+asyncpg"
    elif not async_drivername.endswith("aiosqlite") and async_drivername.startswith("sqlite"):
        async_drivername = "sqlite+aiosqlite"

    async_url = url.set(drivername=async_drivername)

    return str(sync_url), str(async_url)


def _get_required_database_urls() -> tuple[str, str]:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set!")

    sync_url, async_url = _derive_urls(database_url)
    return sync_url, async_url


SYNC_DATABASE_URL, ASYNC_DATABASE_URL = _get_required_database_urls()
config.set_main_option("sqlalchemy.url", SYNC_DATABASE_URL)
ASYNC_DRIVERNAME = make_url(ASYNC_DATABASE_URL).drivername


def run_migrations_offline() -> None:
    context.configure(
        url=SYNC_DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    render_as_batch = connection.dialect.name == "sqlite"
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        render_as_batch=render_as_batch,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = ASYNC_DATABASE_URL
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    if ASYNC_DRIVERNAME.startswith("sqlite+"):
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            url=SYNC_DATABASE_URL,
        )

        with connectable.connect() as connection:
            do_run_migrations(connection)

        connectable.dispose()
    else:
        asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
