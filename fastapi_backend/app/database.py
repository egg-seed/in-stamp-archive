from typing import AsyncGenerator

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy import NullPool, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import settings
from .models import Base, User


# Parse DATABASE_URL using SQLAlchemy's make_url to handle driver specifications correctly
parsed_db_url = make_url(settings.DATABASE_URL)

# Ensure the driver is asyncpg for async operations
if parsed_db_url.drivername == "postgresql":
    async_db_connection_url = parsed_db_url.set(drivername="postgresql+asyncpg").render_as_string(hide_password=False)
elif parsed_db_url.drivername == "postgresql+asyncpg":
    async_db_connection_url = parsed_db_url.render_as_string(hide_password=False)
else:
    async_db_connection_url = str(parsed_db_url)

# Disable connection pooling for serverless environments like Vercel
engine = create_async_engine(async_db_connection_url, poolclass=NullPool)

async_session_maker = async_sessionmaker(
    engine, expire_on_commit=settings.EXPIRE_ON_COMMIT
)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)
