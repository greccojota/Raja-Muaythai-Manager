import math
import uuid
from datetime import date, datetime, time, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.user import User
from schemas.attendance import AttendanceCreate, AttendanceRead, AttendanceSummary
from services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Presença"])


def _to_schema(r) -> AttendanceRead:
    return AttendanceRead(
        id=r.id,
        student_id=r.student_id,
        student_name=r.student.name if r.student else None,
        class_group_id=r.class_group_id,
        class_group_name=r.class_group.name if r.class_group else None,
        private_class_id=r.private_class_id,
        check_in_at=r.check_in_at,
        check_in_type=r.check_in_type,
        notes=r.notes,
    )


@router.post("", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED)
async def check_in(
    data: AttendanceCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    record = await AttendanceService(session).check_in(data)
    return _to_schema(record)


@router.get("/frequency", response_model=list[AttendanceSummary])
async def frequency_summary(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = await AttendanceService(session).get_frequency_summary()
    return [AttendanceSummary(**r) for r in rows]


@router.get("/{record_id}", response_model=AttendanceRead)
async def get_attendance(
    record_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    record = await AttendanceService(session).get_by_id(record_id)
    return _to_schema(record)


@router.get("", response_model=dict)
async def list_attendance(
    class_group_id: Optional[uuid.UUID] = Query(None),
    student_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    dt_from = datetime.combine(date_from, time.min).replace(tzinfo=timezone.utc) if date_from else None
    dt_to = datetime.combine(date_to, time.max).replace(tzinfo=timezone.utc) if date_to else None
    rows, total = await AttendanceService(session).list_recent(
        class_group_id=class_group_id,
        student_id=student_id,
        date_from=dt_from,
        date_to=dt_to,
        page=page,
        size=size,
    )
    return {
        "total": total, "page": page, "size": size,
        "pages": math.ceil(total / size) if total else 1,
        "items": [_to_schema(r).model_dump() for r in rows],
    }


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(
    record_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await AttendanceService(session).delete(record_id)
