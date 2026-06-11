import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import field_validator
from schemas.base import BaseSchema
from schemas.plan import PlanRead


ENROLLMENT_STATUSES = {"active", "cancelled", "expired", "suspended"}
PAYMENT_METHODS = {"cash", "pix", "debit", "credit", "transfer"}


class EnrollmentCreate(BaseSchema):
    student_id: uuid.UUID
    plan_id: uuid.UUID
    start_date: date
    payment_method: str = "pix"
    first_payment_date: Optional[date] = None
    next_payment_due_date: Optional[date] = None
    discount_value: Decimal = Decimal("0")
    discount_notes: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, value: str) -> str:
        if value not in PAYMENT_METHODS:
            raise ValueError(f"Metodo deve ser um de: {', '.join(PAYMENT_METHODS)}")
        return value


class EnrollmentUpdate(BaseSchema):
    status: Optional[str] = None
    end_date: Optional[date] = None
    discount_value: Optional[Decimal] = None
    discount_notes: Optional[str] = None
    notes: Optional[str] = None
    cancelled_reason: Optional[str] = None


class EnrollmentRead(BaseSchema):
    id: uuid.UUID
    student_id: uuid.UUID
    plan_id: uuid.UUID
    plan: Optional[PlanRead] = None
    start_date: date
    end_date: Optional[date] = None
    status: str
    final_monthly_value: Decimal
    discount_value: Decimal
    discount_notes: Optional[str] = None
    payment_method: str
    first_payment_date: Optional[date] = None
    next_payment_due_date: Optional[date] = None
    notes: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancelled_reason: Optional[str] = None
    created_at: datetime
