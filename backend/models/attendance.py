import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, UUIDMixin


class AttendanceRecord(Base, UUIDMixin):
    __tablename__ = "attendance_records"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    class_group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("class_groups.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    private_class_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("private_classes.id", ondelete="SET NULL"), nullable=True
    )
    check_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    check_in_type: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    # manual | qrcode | app
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    student: Mapped["Student"] = relationship()
    class_group: Mapped["ClassGroup | None"] = relationship(back_populates="attendance_records")
