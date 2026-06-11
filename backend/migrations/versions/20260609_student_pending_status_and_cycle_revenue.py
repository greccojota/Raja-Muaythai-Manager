"""student pending status and cycle revenue

Revision ID: 20260611_pending_cycle
Revises: 20260609_payment_due_email_logs
Create Date: 2026-06-09
"""

from alembic import op


revision = "20260611_pending_cycle"
down_revision = "20260609_payment_due_email_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE students SET status = 'pending' WHERE status = 'trial'")
    op.alter_column("students", "status", server_default="pending")
    op.execute(
        """
        WITH cycle_amounts AS (
            SELECT
                ar.id AS ar_id,
                ar.amount AS old_amount,
                e.final_monthly_value
                    * CASE p.plan_type
                        WHEN 'quarterly' THEN 3
                        WHEN 'semiannual' THEN 6
                        WHEN 'annual' THEN 12
                        ELSE 1
                    END AS new_amount
            FROM accounts_receivable ar
            JOIN enrollments e ON e.id = ar.enrollment_id
            JOIN plans p ON p.id = e.plan_id
            WHERE ar.enrollment_id IS NOT NULL
        )
        UPDATE payments py
        SET amount_paid = ca.new_amount
        FROM cycle_amounts ca
        JOIN accounts_receivable ar ON ar.id = ca.ar_id
        WHERE py.ar_id = ca.ar_id
            AND ar.status = 'paid'
            AND py.amount_paid = ca.old_amount
            AND ca.new_amount <> ca.old_amount
        """
    )
    op.execute(
        """
        UPDATE accounts_receivable ar
        SET amount = e.final_monthly_value
            * CASE p.plan_type
                WHEN 'quarterly' THEN 3
                WHEN 'semiannual' THEN 6
                WHEN 'annual' THEN 12
                ELSE 1
            END
        FROM enrollments e
        JOIN plans p ON p.id = e.plan_id
        WHERE ar.enrollment_id = e.id
        """
    )


def downgrade() -> None:
    op.execute("UPDATE students SET status = 'trial' WHERE status = 'pending'")
    op.alter_column("students", "status", server_default="trial")
