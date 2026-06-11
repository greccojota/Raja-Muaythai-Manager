from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin


class Instructor(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "instructors"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    class_groups: Mapped[list["ClassGroup"]] = relationship(back_populates="instructor")
    private_classes: Mapped[list["PrivateClass"]] = relationship(back_populates="instructor")
    graduations: Mapped[list["Graduation"]] = relationship(back_populates="instructor")
