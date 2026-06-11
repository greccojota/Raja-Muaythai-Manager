import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.user import User
from schemas.plan import PlanCreate, PlanRead, PlanUpdate
from services.plan_service import PlanService

router = APIRouter(prefix="/plans", tags=["Planos"])


@router.get("", response_model=list[PlanRead])
async def list_plans(
    active_only: bool = Query(False),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await PlanService(session).list_all(active_only=active_only)


@router.post("", response_model=PlanRead, status_code=status.HTTP_201_CREATED)
async def create_plan(
    data: PlanCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await PlanService(session).create(data)


@router.get("/{plan_id}", response_model=PlanRead)
async def get_plan(
    plan_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await PlanService(session).get(plan_id)


@router.put("/{plan_id}", response_model=PlanRead)
async def update_plan(
    plan_id: uuid.UUID,
    data: PlanUpdate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await PlanService(session).update(plan_id, data)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_plan(
    plan_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await PlanService(session).delete(plan_id)
