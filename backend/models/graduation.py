import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, UUIDMixin, TimestampMixin


class BeltLevel(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "belt_levels"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)  # #RRGGBB
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    graduations: Mapped[list["Graduation"]] = relationship(back_populates="belt")


class GraduationEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "graduation_events"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    instructor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    instructor: Mapped["Instructor | None"] = relationship()
    graduations: Mapped[list["Graduation"]] = relationship(
        back_populates="graduation_event", cascade="all, delete-orphan"
    )


class Graduation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "graduations"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    graduation_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("graduation_events.id", ondelete="CASCADE"),
        nullable=False,
    )
    belt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("belt_levels.id"), nullable=False
    )
    instructor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="SET NULL"), nullable=True
    )
    result: Mapped[str] = mapped_column(String(20), nullable=False)  # approved | failed
    fee_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    student: Mapped["Student"] = relationship()
    graduation_event: Mapped["GraduationEvent"] = relationship(back_populates="graduations")
    belt: Mapped["BeltLevel"] = relationship(back_populates="graduations")
    instructor: Mapped["Instructor | None"] = relationship(back_populates="graduations")
