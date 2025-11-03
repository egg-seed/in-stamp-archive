"""Reusable FastAPI dependencies for API routes."""

from typing import Annotated

from fastapi import Depends, Query
from fastapi_pagination import Params
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models import User
from app.users import current_active_user


DatabaseSession = Annotated[AsyncSession, Depends(get_async_session)]


async def get_current_user(user: User = Depends(current_active_user)) -> User:
    """Return the currently authenticated active user."""

    return user


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
) -> Params:
    """Return pagination parameters for list endpoints."""

    return Params(page=page, size=size)


PaginationParams = Annotated[Params, Depends(get_pagination_params)]


CurrentUser = Annotated[User, Depends(get_current_user)]
