"""merge heads

Revision ID: 7b2fe226cc54
Revises: 0f42a934865d, c5c56a879b8c
Create Date: 2025-11-05 06:52:33.030666

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import fastapi_users_db_sqlalchemy


# revision identifiers, used by Alembic.
revision: str = '7b2fe226cc54'
down_revision: Union[str, None] = ('0f42a934865d', 'c5c56a879b8c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
