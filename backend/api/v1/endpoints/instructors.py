import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.user import User
from schemas.instructor import InstructorCreate, InstructorRead, InstructorUpdate
from repositories.instructor_repository import InstructorRepository
from core.exceptions import NotFoundError

router = APIRouter(prefix="/instructors", tags=["Professores"])


@router.get("", response_model=list[InstructorRead])
async def list_instructors(
    active_only: bool = Query(True),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    repo = InstructorRepository(session)
    return await repo.list_active() if active_only else await repo.list_all()


@router.post("", response_model=InstructorRead, status_code=status.HTTP_201_CREATED)
async def create_instructor(
    data: InstructorCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    repo = InstructorRepository(session)
    inst = await repo.create(**data.model_dump())
    await session.commit()
    await session.refresh(inst)
    return inst


@router.get("/{instructor_id}", response_model=InstructorRead)
async def get_instructor(
    instructor_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    inst = await InstructorRepository(session).get_by_id(instructor_id)
    if not inst:
        raise NotFoundError("Professor")
    return inst


@router.put("/{instructor_id}", response_model=InstructorRead)
async def update_instructor(
    instructor_id: uuid.UUID,
    data: InstructorUpdate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    repo = InstructorRepository(session)
    inst = await repo.get_by_id(instructor_id)
    if not inst:
        raise NotFoundError("Professor")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(inst, field, value)
    await session.commit()
    await session.refresh(inst)
    return inst


@router.delete("/{instructor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_instructor(
    instructor_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from datetime import datetime, timezone
    inst = await InstructorRepository(session).get_by_id(instructor_id)
    if not inst:
        raise NotFoundError("Professor")
    inst.deleted_at = datetime.now(timezone.utc)
    await session.commit()
