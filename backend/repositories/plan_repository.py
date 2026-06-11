from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.plan import Plan
from repositories.base_repository import BaseRepository


class PlanRepository(BaseRepository[Plan]):
    def __init__(self, session: AsyncSession):
        super().__init__(Plan, session)

    async def list_active(self) -> list[Plan]:
        result = await self.session.execute(
            select(Plan).where(Plan.is_active == True).order_by(Plan.name)
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[Plan]:
        result = await self.session.execute(select(Plan).order_by(Plan.name))
        return list(result.scalars().all())
