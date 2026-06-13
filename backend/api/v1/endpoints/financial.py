import math
import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from core.exceptions import ValidationError
from models.financial import AccountsReceivable
from models.user import User
from schemas.base import PaginatedResponse
from schemas.financial import (
    AccountsReceivableCancel,
    AccountsReceivableRead,
    AccountsReceivableSummary,
    AR_STATUSES,
)
from services.enrollment_service import FinancialService

router = APIRouter(tags=["Financeiro"])


def _ar_to_schema(r: AccountsReceivable) -> AccountsReceivableRead:
    return AccountsReceivableRead(
        **{c.key: getattr(r, c.key) for c in r.__table__.columns},
        student_name=r.student.name if r.student else None,
        enrollment_end_date=r.enrollment.end_date if r.enrollment else None,
    )


@router.get("/financial/accounts-receivable", response_model=PaginatedResponse)
async def list_accounts_receivable(
    ar_status: Optional[str] = Query(None, alias="status"),
    student_id: Optional[uuid.UUID] = Query(None),
    reference_month: Optional[str] = Query(None),
    due_date_from: Optional[date] = Query(None),
    due_date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if ar_status and ar_status not in AR_STATUSES:
        raise ValidationError("Status invalido")
    rows, total = await FinancialService(session).list_ar(
        status=ar_status,
        student_id=student_id,
        reference_month=reference_month,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        page=page,
        size=size,
    )
    return PaginatedResponse(
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 1,
        items=[_ar_to_schema(r) for r in rows],
    )


@router.get("/financial/accounts-receivable/{ar_id}", response_model=AccountsReceivableRead)
async def get_accounts_receivable(
    ar_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    ar = await FinancialService(session).get_ar_by_id(ar_id)
    return _ar_to_schema(ar)


@router.patch("/financial/accounts-receivable/{ar_id}/cancel", response_model=AccountsReceivableRead)
async def cancel_accounts_receivable(
    ar_id: uuid.UUID,
    data: AccountsReceivableCancel,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    ar = await FinancialService(session).cancel_ar(ar_id, data.reason)
    return _ar_to_schema(ar)


@router.get("/financial/summary", response_model=AccountsReceivableSummary)
async def accounts_receivable_summary(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await FinancialService(session).get_summary()
