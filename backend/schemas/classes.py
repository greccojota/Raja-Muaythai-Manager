import uuid
from datetime import date, time
from decimal import Decimal
from typing import Optional

from pydantic import field_validator, model_validator

from schemas.base import BaseSchema
from schemas.instructor import InstructorRead

WEEKDAY_NAMES = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]
CLASS_TYPES = {"collective", "personal"}


class ClassScheduleCreate(BaseSchema):
    weekday: int
    start_time: time
    end_time: time

    @field_validator("weekday")
    @classmethod
    def validate_weekday(cls, value: int) -> int:
        if value < 0 or value > 6:
            raise ValueError("Dia da semana deve estar entre 0 e 6")
        return value

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("Horario final deve ser maior que o inicial")
        return self


class ClassScheduleRead(BaseSchema):
    id: uuid.UUID
    weekday: int
    weekday_name: Optional[str] = None
    start_time: time
    end_time: time


class ClassGroupCreate(BaseSchema):
    name: str
    class_type: str = "collective"
    instructor_id: Optional[uuid.UUID] = None
    max_students: Optional[int] = None
    description: Optional[str] = None
    schedules: list[ClassScheduleCreate] = []

    @field_validator("class_type")
    @classmethod
    def validate_class_type(cls, value: str) -> str:
        if value not in CLASS_TYPES:
            raise ValueError("Tipo de aula deve ser collective ou personal")
        return value


class ClassGroupUpdate(BaseSchema):
    name: Optional[str] = None
    class_type: Optional[str] = None
    instructor_id: Optional[uuid.UUID] = None
    max_students: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    schedules: Optional[list[ClassScheduleCreate]] = None

    @field_validator("class_type")
    @classmethod
    def validate_class_type(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in CLASS_TYPES:
            raise ValueError("Tipo de aula deve ser collective ou personal")
        return value


class ClassGroupRead(BaseSchema):
    id: uuid.UUID
    name: str
    class_type: str = "collective"
    instructor: Optional[InstructorRead] = None
    max_students: Optional[int] = None
    description: Optional[str] = None
    is_active: bool
    schedules: list[ClassScheduleRead] = []
    enrolled_count: Optional[int] = None


class ClassEnrollmentCreate(BaseSchema):
    class_group_id: uuid.UUID
    student_id: uuid.UUID
    enrolled_at: date


class ClassEnrollmentRead(BaseSchema):
    id: uuid.UUID
    class_group_id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    enrolled_at: date
    is_active: bool


class PrivateClassCreate(BaseSchema):
    student_id: uuid.UUID
    instructor_id: Optional[uuid.UUID] = None
    scheduled_at: date
    start_time: time
    duration_minutes: int = 60
    value: Decimal = Decimal("0")
    notes: Optional[str] = None


class PrivateClassUpdate(BaseSchema):
    instructor_id: Optional[uuid.UUID] = None
    scheduled_at: Optional[date] = None
    start_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    value: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PrivateClassRead(BaseSchema):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    instructor: Optional[InstructorRead] = None
    scheduled_at: date
    start_time: time
    duration_minutes: int
    value: Decimal
    status: str
    notes: Optional[str] = None
