from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.instructor import Instructor
from repositories.base_repository import BaseRepository


class InstructorRepository(BaseRepository[Instructor]):
    def __init__(self, session: AsyncSession):
        super().__init__(Instructor, session)

    async def list_active(self) -> list[Instructor]:
        result = await self.session.execute(
            select(Instructor)
            .where(Instructor.is_active == True, Instructor.deleted_at.is_(None))
            .order_by(Instructor.name)
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[Instructor]:
        result = await self.session.execute(
            select(Instructor)
            .where(Instructor.deleted_at.is_(None))
            .order_by(Instructor.name)
        )
        return list(result.scalars().all())
