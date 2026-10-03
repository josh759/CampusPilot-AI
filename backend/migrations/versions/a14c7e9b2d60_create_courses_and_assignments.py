"""create courses and assignments

Revision ID: a14c7e9b2d60
Revises: ed0372e1e7ad
Create Date: 2026-10-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a14c7e9b2d60"
down_revision: Union[str, Sequence[str], None] = "ed0372e1e7ad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create course and assignment tables."""
    op.create_table(
        "courses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "code", name="uq_courses_user_id_code"),
    )
    op.create_index(op.f("ix_courses_user_id"), "courses", ["user_id"], unique=False)

    op.create_table(
        "assignments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default=sa.text("'not_started'"),
            nullable=False,
        ),
        sa.Column("course_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["course_id"],
            ["courses.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_assignments_course_id"),
        "assignments",
        ["course_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop assignment and course tables."""
    op.drop_index(op.f("ix_assignments_course_id"), table_name="assignments")
    op.drop_table("assignments")
    op.drop_index(op.f("ix_courses_user_id"), table_name="courses")
    op.drop_table("courses")
