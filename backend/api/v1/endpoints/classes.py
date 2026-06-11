import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.user import User
from schemas.classes import (
    ClassGroupCreate, ClassGroupRead, ClassGroupUpdate,
    ClassEnrollmentCreate, ClassEnrollmentRead,
    ClassScheduleRead, PrivateClassCreate, PrivateClassRead, PrivateClassUpdate,
    WEEKDAY_NAMES,
)
from services.classes_service import ClassGroupService, PrivateClassService

router = APIRouter(tags=["Aulas"])


def _group_to_schema(g) -> ClassGroupRead:
    return ClassGroupRead(
        id=g.id,
        name=g.name,
        class_type=getattr(g, "class_type", "collective"),
        instructor=g.instructor,
        max_students=g.max_students,
        description=g.description,
        is_active=g.is_active,
        enrolled_count=getattr(g, "enrolled_count", getattr(g, "_enrolled_count", 0)),
        schedules=[
            ClassScheduleRead(
                id=s.id,
                weekday=s.weekday,
                weekday_name=WEEKDAY_NAMES[s.weekday] if 0 <= s.weekday <= 6 else None,
                start_time=s.start_time,
                end_time=s.end_time,
            )
            for s in (g.schedules or [])
        ],
    )


# ── Turmas ──────────────────────────────────────────────────────

@router.get("/classes", response_model=list[ClassGroupRead])
async def list_classes(
    active_only: bool = Query(True),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    groups = await ClassGroupService(session).list(active_only=active_only)
    return [_group_to_schema(g) for g in groups]


@router.post("/classes", response_model=ClassGroupRead, status_code=status.HTTP_201_CREATED)
async def create_class(
    data: ClassGroupCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await ClassGroupService(session).create(data)
    return _group_to_schema(g)


@router.get("/classes/{class_id}", response_model=ClassGroupRead)
async def get_class(
    class_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await ClassGroupService(session).get(class_id)
    return _group_to_schema(g)


@router.put("/classes/{class_id}", response_model=ClassGroupRead)
async def update_class(
    class_id: uuid.UUID,
    data: ClassGroupUpdate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await ClassGroupService(session).update(class_id, data)
    return _group_to_schema(g)


@router.get("/classes/{class_id}/students", response_model=list[ClassEnrollmentRead])
async def list_class_students(
    class_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = await ClassGroupService(session).list_students(class_id)
    return [
        ClassEnrollmentRead(
            id=r.id,
            class_group_id=r.class_group_id,
            student_id=r.student_id,
            student_name=r.student.name if r.student else None,
            enrolled_at=r.enrolled_at,
            is_active=r.is_active,
        )
        for r in rows
    ]


@router.post("/class-enrollments", response_model=ClassEnrollmentRead, status_code=status.HTTP_201_CREATED)
async def enroll_in_class(
    data: ClassEnrollmentCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    e = await ClassGroupService(session).enroll_student(data)
    return ClassEnrollmentRead(
        id=e.id,
        class_group_id=e.class_group_id,
        student_id=e.student_id,
        student_name=None,
        enrolled_at=e.enrolled_at,
        is_active=e.is_active,
    )


@router.delete("/class-enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll_from_class(
    enrollment_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await ClassGroupService(session).unenroll_student(enrollment_id)


# ── Aulas Particulares ──────────────────────────────────────────

@router.get("/private-classes", response_model=dict)
async def list_private_classes(
    student_id: Optional[uuid.UUID] = Query(None),
    instructor_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows, total = await PrivateClassService(session).list(
        student_id=student_id, instructor_id=instructor_id, page=page, size=size
    )
    return {
        "total": total, "page": page, "size": size,
        "pages": math.ceil(total / size) if total else 1,
        "items": [
            PrivateClassRead(
                id=r.id, student_id=r.student_id,
                student_name=r.student.name if r.student else None,
                instructor=r.instructor,
                scheduled_at=r.scheduled_at, start_time=r.start_time,
                duration_minutes=r.duration_minutes, value=r.value,
                status=r.status, notes=r.notes,
            ).model_dump()
            for r in rows
        ],
    }


@router.post("/private-classes", response_model=PrivateClassRead, status_code=status.HTTP_201_CREATED)
async def create_private_class(
    data: PrivateClassCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    r = await PrivateClassService(session).create(data)
    return PrivateClassRead(
        id=r.id, student_id=r.student_id,
        student_name=r.student.name if r.student else None,
        instructor=r.instructor,
        scheduled_at=r.scheduled_at, start_time=r.start_time,
        duration_minutes=r.duration_minutes, value=r.value,
        status=r.status, notes=r.notes,
    )


@router.put("/private-classes/{pc_id}", response_model=PrivateClassRead)
async def update_private_class(
    pc_id: uuid.UUID,
    data: PrivateClassUpdate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    r = await PrivateClassService(session).update(pc_id, data)
    return PrivateClassRead(
        id=r.id, student_id=r.student_id,
        student_name=r.student.name if r.student else None,
        instructor=r.instructor,
        scheduled_at=r.scheduled_at, start_time=r.start_time,
        duration_minutes=r.duration_minutes, value=r.value,
        status=r.status, notes=r.notes,
    )
