import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.user import User
from schemas.graduation import (
    BeltLevelCreate, BeltLevelRead,
    GraduationEventCreate, GraduationEventRead,
    GraduationCreate, GraduationRead,
)
from services.graduation_service import BeltService, GraduationEventService, GraduationService

router = APIRouter(tags=["Graduação"])


# ── Faixas ──────────────────────────────────────────────────────

@router.get("/belts", response_model=list[BeltLevelRead])
async def list_belts(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await BeltService(session).list()


@router.post("/belts", response_model=BeltLevelRead, status_code=status.HTTP_201_CREATED)
async def create_belt(
    data: BeltLevelCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await BeltService(session).create(data)


@router.put("/belts/{belt_id}", response_model=BeltLevelRead)
async def update_belt(
    belt_id: uuid.UUID,
    data: BeltLevelCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await BeltService(session).update(belt_id, data)


# ── Eventos de Graduação ────────────────────────────────────────

@router.get("/graduation-events", response_model=list[GraduationEventRead])
async def list_graduation_events(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    events = await GraduationEventService(session).list()
    return [
        GraduationEventRead(
            id=e.id, name=e.name, event_date=e.event_date,
            instructor=e.instructor, notes=e.notes,
            graduation_count=len(e.graduations) if e.graduations else 0,
        )
        for e in events
    ]


@router.post("/graduation-events", response_model=GraduationEventRead, status_code=status.HTTP_201_CREATED)
async def create_graduation_event(
    data: GraduationEventCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    e = await GraduationEventService(session).create(data)
    return GraduationEventRead(
        id=e.id, name=e.name, event_date=e.event_date,
        instructor=e.instructor, notes=e.notes, graduation_count=0,
    )


@router.delete("/graduation-events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_graduation_event(
    event_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await GraduationEventService(session).delete(event_id)


# ── Graduações por aluno ────────────────────────────────────────

@router.get("/students/{student_id}/graduations", response_model=list[GraduationRead])
async def student_graduations(
    student_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = await GraduationService(session).get_by_student(student_id)
    return [
        GraduationRead(
            id=g.id, student_id=g.student_id,
            student_name=g.student.name if g.student else None,
            graduation_event_id=g.graduation_event_id,
            event_name=g.graduation_event.name if g.graduation_event else None,
            event_date=g.graduation_event.event_date if g.graduation_event else None,
            belt=g.belt, instructor=g.instructor,
            result=g.result, fee_paid=g.fee_paid,
            fee_amount=g.fee_amount, notes=g.notes,
        )
        for g in rows
    ]


@router.post("/graduations", response_model=GraduationRead, status_code=status.HTTP_201_CREATED)
async def register_graduation(
    data: GraduationCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await GraduationService(session).register(data)
    return GraduationRead(
        id=g.id, student_id=g.student_id,
        student_name=g.student.name if g.student else None,
        graduation_event_id=g.graduation_event_id,
        event_name=g.graduation_event.name if g.graduation_event else None,
        event_date=g.graduation_event.event_date if g.graduation_event else None,
        belt=g.belt, instructor=g.instructor,
        result=g.result, fee_paid=g.fee_paid,
        fee_amount=g.fee_amount, notes=g.notes,
    )


@router.delete("/graduations/{graduation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_graduation(
    graduation_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await GraduationService(session).delete(graduation_id)
