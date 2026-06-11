from decimal import Decimal
from datetime import date
from sqlalchemy import Boolean, Date, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, UUIDMixin, TimestampMixin


class Plan(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "plans"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # monthly | quarterly | semiannual | annual
    plan_modality: Mapped[str] = mapped_column(String(20), nullable=False, default="collective", index=True)
    # collective | personal
    billing_cycle_days: Mapped[int] = mapped_column(nullable=False, default=30)
    monthly_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="plan")
