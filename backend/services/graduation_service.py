import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from core.exceptions import NotFoundError
from models.graduation import BeltLevel, GraduationEvent, Graduation
from repositories.graduation_repository import (
    BeltLevelRepository, GraduationEventRepository, GraduationRepository
)
from schemas.graduation import (
    BeltLevelCreate, GraduationEventCreate, GraduationCreate
)


class BeltService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = BeltLevelRepository(session)

    async def list(self) -> list[BeltLevel]:
        return await self.repo.list_ordered()

    async def create(self, data: BeltLevelCreate) -> BeltLevel:
        belt = await self.repo.create(**data.model_dump())
        await self.session.commit()
        return belt

    async def update(self, belt_id: uuid.UUID, data: BeltLevelCreate) -> BeltLevel:
        belt = await self.repo.get_by_id(belt_id)
        if not belt:
            raise NotFoundError("Faixa")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(belt, field, value)
        await self.session.commit()
        await self.session.refresh(belt)
        return belt


class GraduationEventService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = GraduationEventRepository(session)

    async def list(self) -> list[GraduationEvent]:
        return await self.repo.list_with_instructor()

    async def get(self, event_id: uuid.UUID) -> GraduationEvent:
        event = await self.repo.get_by_id(event_id)
        if not event:
            raise NotFoundError("Evento de graduação")
        return event

    async def create(self, data: GraduationEventCreate) -> GraduationEvent:
        event = await self.repo.create(**data.model_dump())
        await self.session.commit()
        return (await self.repo.list_with_instructor())[-1]

    async def delete(self, event_id: uuid.UUID) -> None:
        event = await self.get(event_id)
        await self.repo.delete(event)
        await self.session.commit()


class GraduationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = GraduationRepository(session)

    async def register(self, data: GraduationCreate) -> Graduation:
        graduation = await self.repo.create(**data.model_dump())
        await self.session.commit()
        rows = await self.repo.list_by_student(data.student_id)
        return rows[0] if rows else graduation

    async def get_by_student(self, student_id: uuid.UUID) -> list[Graduation]:
        return await self.repo.list_by_student(student_id)

    async def delete(self, graduation_id: uuid.UUID) -> None:
        g = await self.repo.get_by_id(graduation_id)
        if not g:
            raise NotFoundError("Graduação")
        await self.repo.delete(g)
        await self.session.commit()
