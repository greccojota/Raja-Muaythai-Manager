import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from schemas.base import BaseSchema

PAYMENT_METHODS = {"cash", "pix", "debit", "credit", "transfer"}
AR_STATUSES = {"pending", "paid", "overdue", "cancelled"}


class AccountsReceivableRead(BaseSchema):
    id: uuid.UUID
    enrollment_id: Optional[uuid.UUID] = None
    student_id: uuid.UUID
    student_name: Optional[str] = None
    enrollment_end_date: Optional[date] = None  # data de término do plano ativo
    description: str
    due_date: date
    amount: Decimal
    status: str
    reference_month: Optional[str] = None
    expected_payment_method: Optional[str] = None
    reminder_sent_at: Optional[datetime] = None
    overdue_notice_sent_at: Optional[datetime] = None
    created_at: datetime


class PaymentCreate(BaseSchema):
    ar_id: uuid.UUID
    amount_paid: Decimal
    payment_method: str
    notes: Optional[str] = None

    def validate_method(self) -> None:
        if self.payment_method not in PAYMENT_METHODS:
            raise ValueError(f"Método deve ser um de: {', '.join(PAYMENT_METHODS)}")


class PaymentRead(BaseSchema):
    id: uuid.UUID
    ar_id: uuid.UUID
    amount_paid: Decimal
    payment_method: str
    paid_at: datetime
    notes: Optional[str] = None


class DelinquentStudentRead(BaseSchema):
    student_id: uuid.UUID
    student_name: str
    total_overdue: Decimal
    oldest_due_date: date
    overdue_count: int
