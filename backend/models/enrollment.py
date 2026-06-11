import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, UUIDMixin, TimestampMixin


class Enrollment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "enrollments"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    # active | cancelled | expired | suspended

    final_monthly_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    discount_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    enrollment_fee_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False, default="pix")
    first_payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_payment_due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    student: Mapped["Student"] = relationship(back_populates="enrollments")
    plan: Mapped["Plan"] = relationship(back_populates="enrollments")
    accounts_receivable: Mapped[list["AccountsReceivable"]] = relationship(
        back_populates="enrollment", cascade="all, delete-orphan"
    )
