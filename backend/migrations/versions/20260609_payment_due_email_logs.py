"""payment due dates and email logs

Revision ID: 20260609_payment_due_email_logs
Revises: 20260609_raja_business_rules
Create Date: 2026-06-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260609_payment_due_email_logs"
down_revision = "20260609_raja_business_rules"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("enrollments", sa.Column("payment_method", sa.String(length=20), nullable=False, server_default="pix"))
    op.add_column("enrollments", sa.Column("first_payment_date", sa.Date(), nullable=True))
    op.add_column("enrollments", sa.Column("next_payment_due_date", sa.Date(), nullable=True))

    op.add_column("accounts_receivable", sa.Column("expected_payment_method", sa.String(length=20), nullable=True))
    op.add_column("accounts_receivable", sa.Column("reminder_sent_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("accounts_receivable", sa.Column("overdue_notice_sent_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "email_logs",
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("enrollment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("accounts_receivable_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("email_type", sa.String(length=50), nullable=False),
        sa.Column("to_email", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="sent"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["accounts_receivable_id"], ["accounts_receivable.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["enrollment_id"], ["enrollments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_email_logs_student_id", "email_logs", ["student_id"])
    op.create_index("ix_email_logs_enrollment_id", "email_logs", ["enrollment_id"])
    op.create_index("ix_email_logs_accounts_receivable_id", "email_logs", ["accounts_receivable_id"])
    op.create_index("ix_email_logs_email_type", "email_logs", ["email_type"])


def downgrade() -> None:
    op.drop_index("ix_email_logs_email_type", table_name="email_logs")
    op.drop_index("ix_email_logs_accounts_receivable_id", table_name="email_logs")
    op.drop_index("ix_email_logs_enrollment_id", table_name="email_logs")
    op.drop_index("ix_email_logs_student_id", table_name="email_logs")
    op.drop_table("email_logs")

    op.drop_column("accounts_receivable", "overdue_notice_sent_at")
    op.drop_column("accounts_receivable", "reminder_sent_at")
    op.drop_column("accounts_receivable", "expected_payment_method")

    op.drop_column("enrollments", "next_payment_due_date")
    op.drop_column("enrollments", "first_payment_date")
    op.drop_column("enrollments", "payment_method")
