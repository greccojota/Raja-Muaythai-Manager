import uuid
from datetime import date
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from models.classes import ClassGroup, ClassSchedule, ClassEnrollment, PrivateClass
from repositories.base_repository import BaseRepository


class ClassGroupRepository(BaseRepository[ClassGroup]):
    def __init__(self, session: AsyncSession):
        super().__init__(ClassGroup, session)

    async def list_with_details(self, active_only: bool = True) -> list[ClassGroup]:
        q = select(ClassGroup).options(
            selectinload(ClassGroup.instructor),
            selectinload(ClassGroup.schedules),
        )
        if active_only:
            q = q.where(ClassGroup.is_active == True)
        result = await self.session.execute(q.order_by(ClassGroup.name))
        groups = list(result.scalars().all())
        # Enrich with enrolled_count
        for g in groups:
            count_result = await self.session.execute(
                select(func.count()).select_from(ClassEnrollment).where(
                    ClassEnrollment.class_group_id == g.id,
                    ClassEnrollment.is_active == True,
                )
            )
            g._enrolled_count = count_result.scalar_one()
        return groups

    async def get_with_details(self, group_id: uuid.UUID) -> ClassGroup | None:
        result = await self.session.execute(
            select(ClassGroup)
            .options(
                selectinload(ClassGroup.instructor),
                selectinload(ClassGroup.schedules),
            )
            .where(ClassGroup.id == group_id)
        )
        return result.scalar_one_or_none()


class ClassEnrollmentRepository(BaseRepository[ClassEnrollment]):
    def __init__(self, session: AsyncSession):
        super().__init__(ClassEnrollment, session)

    async def list_by_group(self, group_id: uuid.UUID) -> list[ClassEnrollment]:
        result = await self.session.execute(
            select(ClassEnrollment)
            .options(selectinload(ClassEnrollment.student))
            .where(
                ClassEnrollment.class_group_id == group_id,
                ClassEnrollment.is_active == True,
            )
            .order_by(ClassEnrollment.enrolled_at)
        )
        return list(result.scalars().all())

    async def list_by_student(self, student_id: uuid.UUID) -> list[ClassEnrollment]:
        result = await self.session.execute(
            select(ClassEnrollment)
            .options(selectinload(ClassEnrollment.class_group))
            .where(ClassEnrollment.student_id == student_id)
        )
        return list(result.scalars().all())

    async def get_existing(self, group_id: uuid.UUID, student_id: uuid.UUID) -> ClassEnrollment | None:
        result = await self.session.execute(
            select(ClassEnrollment).where(
                ClassEnrollment.class_group_id == group_id,
                ClassEnrollment.student_id == student_id,
                ClassEnrollment.is_active == True,
            )
        )
        return result.scalar_one_or_none()


class PrivateClassRepository(BaseRepository[PrivateClass]):
    def __init__(self, session: AsyncSession):
        super().__init__(PrivateClass, session)

    async def list_paginated(
        self,
        student_id: uuid.UUID | None = None,
        instructor_id: uuid.UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[PrivateClass], int]:
        q = select(PrivateClass).options(
            selectinload(PrivateClass.student),
            selectinload(PrivateClass.instructor),
        )
        cq = select(func.count()).select_from(PrivateClass)
        if student_id:
            q = q.where(PrivateClass.student_id == student_id)
            cq = cq.where(PrivateClass.student_id == student_id)
        if instructor_id:
            q = q.where(PrivateClass.instructor_id == instructor_id)
            cq = cq.where(PrivateClass.instructor_id == instructor_id)
        total = (await self.session.execute(cq)).scalar_one()
        rows = (await self.session.execute(
            q.order_by(PrivateClass.scheduled_at.desc()).offset(skip).limit(limit)
        )).scalars().all()
        return list(rows), total
