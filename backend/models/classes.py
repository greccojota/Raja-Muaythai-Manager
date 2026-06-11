import uuid
from datetime import date, time
from decimal import Decimal
from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, UUIDMixin, TimestampMixin


class ClassGroup(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "class_groups"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    class_type: Mapped[str] = mapped_column(String(20), nullable=False, default="collective", index=True)
    instructor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="SET NULL"), nullable=True
    )
    max_students: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    instructor: Mapped["Instructor | None"] = relationship(back_populates="class_groups")
    schedules: Mapped[list["ClassSchedule"]] = relationship(
        back_populates="class_group", cascade="all, delete-orphan"
    )
    enrollments: Mapped[list["ClassEnrollment"]] = relationship(
        back_populates="class_group", cascade="all, delete-orphan"
    )
    attendance_records: Mapped[list["AttendanceRecord"]] = relationship(
        back_populates="class_group"
    )


class ClassSchedule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "class_schedules"

    class_group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("class_groups.id", ondelete="CASCADE"), nullable=False
    )
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Seg … 6=Dom
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    class_group: Mapped["ClassGroup"] = relationship(back_populates="schedules")


class ClassEnrollment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "class_enrollments"

    class_group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("class_groups.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    enrolled_at: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    class_group: Mapped["ClassGroup"] = relationship(back_populates="enrollments")
    student: Mapped["Student"] = relationship()


class PrivateClass(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "private_classes"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    instructor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")
    # scheduled | completed | cancelled
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    student: Mapped["Student"] = relationship()
    instructor: Mapped["Instructor | None"] = relationship(back_populates="private_classes")
