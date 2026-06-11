"""raja business rules

Revision ID: 20260609_raja_business_rules
Revises: cec4d1fe0f70
Create Date: 2026-06-09
"""

from alembic import op
import sqlalchemy as sa


revision = "20260609_raja_business_rules"
down_revision = "cec4d1fe0f70"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("students", sa.Column("modality", sa.String(length=20), nullable=False, server_default="muaythai"))
    op.create_index("ix_students_modality", "students", ["modality"])

    op.add_column("plans", sa.Column("plan_modality", sa.String(length=20), nullable=False, server_default="collective"))
    op.create_index("ix_plans_plan_modality", "plans", ["plan_modality"])
    op.drop_column("plans", "enrollment_fee")

    op.add_column("class_groups", sa.Column("class_type", sa.String(length=20), nullable=False, server_default="collective"))
    op.create_index("ix_class_groups_class_type", "class_groups", ["class_type"])


def downgrade() -> None:
    op.drop_index("ix_class_groups_class_type", table_name="class_groups")
    op.drop_column("class_groups", "class_type")

    op.add_column("plans", sa.Column("enrollment_fee", sa.Numeric(10, 2), nullable=False, server_default="0"))
    op.drop_index("ix_plans_plan_modality", table_name="plans")
    op.drop_column("plans", "plan_modality")

    op.drop_index("ix_students_modality", table_name="students")
    op.drop_column("students", "modality")
