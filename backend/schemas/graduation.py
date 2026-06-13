import uuid
from datetime import date
from decimal import Decimal
from typing import Optional
from schemas.base import BaseSchema
from schemas.instructor import InstructorRead


class BeltLevelCreate(BaseSchema):
    name: str
    order_index: int
    color_hex: Optional[str] = None
    description: Optional[str] = None


class BeltLevelRead(BaseSchema):
    id: uuid.UUID
    name: str
    order_index: int
    color_hex: Optional[str] = None
    description: Optional[str] = None
    is_active: bool


class GraduationEventCreate(BaseSchema):
    name: str
    event_date: date
    instructor_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class GraduationEventRead(BaseSchema):
    id: uuid.UUID
    name: str
    event_date: date
    instructor: Optional[InstructorRead] = None
    notes: Optional[str] = None
    graduation_count: Optional[int] = None


class GraduationCreate(BaseSchema):
    student_id: uuid.UUID
    graduation_event_id: uuid.UUID
    belt_id: uuid.UUID
    instructor_id: Optional[uuid.UUID] = None
    result: str = "approved"  # approved | failed
    fee_paid: bool = False
    fee_amount: Decimal = Decimal("0")
    notes: Optional[str] = None


class GraduationEventUpdate(BaseSchema):
    name: Optional[str] = None
    event_date: Optional[date] = None
    instructor_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class GraduationUpdate(BaseSchema):
    belt_id: Optional[uuid.UUID] = None
    instructor_id: Optional[uuid.UUID] = None
    result: Optional[str] = None
    fee_paid: Optional[bool] = None
    fee_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class GraduationRead(BaseSchema):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    graduation_event_id: uuid.UUID
    event_name: Optional[str] = None
    event_date: Optional[date] = None
    belt: Optional[BeltLevelRead] = None
    instructor: Optional[InstructorRead] = None
    result: str
    fee_paid: bool
    fee_amount: Decimal
    notes: Optional[str] = None
