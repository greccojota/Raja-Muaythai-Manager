import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from core.exceptions import NotFoundError
from models.plan import Plan
from repositories.plan_repository import PlanRepository
from schemas.plan import PlanCreate, PlanUpdate, CYCLE_DAYS


class PlanService:
    def __init__(self, session: AsyncSession):
        self.repo = PlanRepository(session)
        self.session = session

    async def create(self, data: PlanCreate) -> Plan:
        payload = data.model_dump()
        payload["billing_cycle_days"] = CYCLE_DAYS.get(data.plan_type, 30)
        plan = await self.repo.create(**payload)
        await self.session.commit()
        return plan

    async def get(self, plan_id: uuid.UUID) -> Plan:
        plan = await self.repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundError("Plano")
        return plan

    async def list_all(self, active_only: bool = False) -> list[Plan]:
        if active_only:
            return await self.repo.list_active()
        return await self.repo.list_all()

    async def update(self, plan_id: uuid.UUID, data: PlanUpdate) -> Plan:
        plan = await self.get(plan_id)
        updates = data.model_dump(exclude_none=True)
        if "plan_type" in updates:
            updates["billing_cycle_days"] = CYCLE_DAYS.get(updates["plan_type"], 30)
        for field, value in updates.items():
            setattr(plan, field, value)
        await self.session.commit()
        await self.session.refresh(plan)
        return plan

    async def delete(self, plan_id: uuid.UUID) -> None:
        plan = await self.get(plan_id)
        plan.is_active = False
        await self.session.commit()
