import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.financial import AccountsReceivable
from models.user import User
from schemas.base import PaginatedResponse
from schemas.enrollment import EnrollmentCreate, EnrollmentRead, EnrollmentUpdate
from schemas.financial import AccountsReceivableRead, DelinquentStudentRead, PaymentCreate
from services.enrollment_service import EnrollmentService, FinancialService

router = APIRouter(tags=["Matrículas e Financeiro"])


def _ar_to_schema(r: AccountsReceivable) -> AccountsReceivableRead:
    return AccountsReceivableRead(
        **{c.key: getattr(r, c.key) for c in r.__table__.columns},
        student_name=r.student.name if r.student else None,
        enrollment_end_date=r.enrollment.end_date if r.enrollment else None,
    )


# ── Matrículas ──────────────────────────────────────────────────

@router.get("/enrollments", response_model=PaginatedResponse)
async def list_enrollments(
    enrollment_status: Optional[str] = Query(None, alias="status"),
    student_id: Optional[uuid.UUID] = Query(None),
    plan_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    enrollments, total = await EnrollmentService(session).list_all(
        status=enrollment_status, student_id=student_id, plan_id=plan_id, page=page, size=size
    )
    def _to_read(e) -> dict:
        r = EnrollmentRead.model_validate(e).model_dump()
        r["student_name"] = e.student.name if e.student else None
        return r

    return PaginatedResponse(
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 1,
        items=[_to_read(e) for e in enrollments],
    )


@router.get("/enrollments/{enrollment_id}", response_model=EnrollmentRead)
async def get_enrollment(
    enrollment_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session).get_by_id(enrollment_id)


@router.put("/enrollments/{enrollment_id}", response_model=EnrollmentRead)
async def update_enrollment(
    enrollment_id: uuid.UUID,
    data: EnrollmentUpdate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if data.status and data.status not in {"active", "cancelled", "expired", "suspended"}:
        from core.exceptions import ValidationError
        raise ValidationError("Status invalido")
    return await EnrollmentService(session).update(enrollment_id, data)


@router.post("/enrollments", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED)
async def enroll_student(
    data: EnrollmentCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session).enroll(data)


@router.get("/students/{student_id}/enrollments", response_model=list[EnrollmentRead])
async def student_enrollments(
    student_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session).get_by_student(student_id)


@router.delete("/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_enrollment(
    enrollment_id: uuid.UUID,
    reason: Optional[str] = Query(None),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await EnrollmentService(session).cancel(enrollment_id, reason)


# ── Financeiro ──────────────────────────────────────────────────

@router.get("/students/{student_id}/accounts-receivable", response_model=list[AccountsReceivableRead])
async def student_ar(
    student_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = await FinancialService(session).list_ar_by_student(student_id)
    return [_ar_to_schema(r) for r in rows]


@router.get("/financial/pending", response_model=dict)
async def pending_ar(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows, total = await FinancialService(session).list_pending(page=page, size=size)
    return {
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
        "items": [_ar_to_schema(r).model_dump() for r in rows],
    }


@router.get("/financial/delinquents", response_model=list[DelinquentStudentRead])
async def delinquents(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await FinancialService(session).get_delinquents()


@router.post("/financial/payments", response_model=AccountsReceivableRead, status_code=status.HTTP_201_CREATED)
async def register_payment(
    data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    ar = await FinancialService(session).register_payment(data, current_user.id)
    return _ar_to_schema(ar)


@router.post("/financial/mark-overdue", response_model=dict)
async def mark_overdue(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    count = await FinancialService(session).mark_overdue()
    return {"updated": count}


@router.post("/financial/send-payment-reminders", response_model=dict)
async def send_payment_reminders(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    count = await FinancialService(session).send_payment_reminders()
    return {"sent": count}


@router.post("/financial/process-overdue", response_model=dict)
async def process_overdue(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await FinancialService(session).process_overdue_notices_and_inactivation()


@router.post("/enrollments/expire-finished", response_model=dict)
async def expire_finished_enrollments(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    count = await EnrollmentService(session).expire_finished()
    return {"updated": count}
