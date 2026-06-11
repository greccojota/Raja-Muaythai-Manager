import uuid
from typing import Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from models.student import Student
from repositories.base_repository import BaseRepository


class StudentRepository(BaseRepository[Student]):
    def __init__(self, session: AsyncSession):
        super().__init__(Student, session)

    async def get_active_by_cpf(self, cpf: str) -> Optional[Student]:
        result = await self.session.execute(
            select(Student).where(Student.cpf == cpf, Student.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Student], int]:
        query = select(Student).where(Student.deleted_at.is_(None))
        count_query = select(func.count()).select_from(Student).where(Student.deleted_at.is_(None))

        if search:
            pattern = f"%{search}%"
            condition = or_(
                Student.name.ilike(pattern),
                Student.cpf.ilike(pattern),
                Student.email.ilike(pattern),
                Student.phone.ilike(pattern),
            )
            query = query.where(condition)
            count_query = count_query.where(condition)

        if status:
            query = query.where(Student.status == status)
            count_query = count_query.where(Student.status == status)

        total = (await self.session.execute(count_query)).scalar_one()
        students = (
            await self.session.execute(query.order_by(Student.name).offset(skip).limit(limit))
        ).scalars().all()
        return list(students), total

    async def soft_delete(self, student: Student) -> None:
        from datetime import datetime, timezone
        student.deleted_at = datetime.now(timezone.utc)
        await self.session.flush()
