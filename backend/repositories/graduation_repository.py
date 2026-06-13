import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from models.graduation import BeltLevel, GraduationEvent, Graduation
from repositories.base_repository import BaseRepository


class BeltLevelRepository(BaseRepository[BeltLevel]):
    def __init__(self, session: AsyncSession):
        super().__init__(BeltLevel, session)

    async def list_ordered(self) -> list[BeltLevel]:
        result = await self.session.execute(
            select(BeltLevel).where(BeltLevel.is_active == True).order_by(BeltLevel.order_index)
        )
        return list(result.scalars().all())


class GraduationEventRepository(BaseRepository[GraduationEvent]):
    def __init__(self, session: AsyncSession):
        super().__init__(GraduationEvent, session)

    async def list_with_instructor(self) -> list[GraduationEvent]:
        result = await self.session.execute(
            select(GraduationEvent)
            .options(selectinload(GraduationEvent.instructor))
            .order_by(GraduationEvent.event_date.desc())
        )
        return list(result.scalars().all())

    async def get_with_graduations(self, event_id: uuid.UUID) -> GraduationEvent | None:
        result = await self.session.execute(
            select(GraduationEvent)
            .options(
                selectinload(GraduationEvent.instructor),
                selectinload(GraduationEvent.graduations).selectin(
                    [Graduation.student, Graduation.belt, Graduation.instructor]
                ),
            )
            .where(GraduationEvent.id == event_id)
        )
        return result.scalar_one_or_none()


class GraduationRepository(BaseRepository[Graduation]):
    def __init__(self, session: AsyncSession):
        super().__init__(Graduation, session)

    async def list_by_event(self, event_id: uuid.UUID) -> list[Graduation]:
        result = await self.session.execute(
            select(Graduation)
            .options(
                selectinload(Graduation.belt),
                selectinload(Graduation.student),
                selectinload(Graduation.instructor),
                selectinload(Graduation.graduation_event),
            )
            .where(Graduation.graduation_event_id == event_id)
            .order_by(Graduation.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_student(self, student_id: uuid.UUID) -> list[Graduation]:
        result = await self.session.execute(
            select(Graduation)
            .options(
                selectinload(Graduation.belt),
                selectinload(Graduation.graduation_event),
                selectinload(Graduation.instructor),
            )
            .where(Graduation.student_id == student_id)
            .order_by(Graduation.created_at.desc())
        )
        return list(result.scalars().all())
