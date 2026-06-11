import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from core.exceptions import NotFoundError, ConflictError
from models.student import Student
from repositories.student_repository import StudentRepository
from schemas.student import StudentCreate, StudentUpdate


class StudentService:
    def __init__(self, session: AsyncSession):
        self.repo = StudentRepository(session)
        self.session = session

    async def create(self, data: StudentCreate) -> Student:
        if data.cpf:
            existing = await self.repo.get_active_by_cpf(data.cpf)
            if existing:
                raise ConflictError(f"CPF {data.cpf} já cadastrado")

        payload = data.model_dump()
        payload["status"] = "pending"
        student = await self.repo.create(**payload)
        await self.session.commit()
        return student

    async def get(self, student_id: uuid.UUID) -> Student:
        student = await self.repo.get_by_id(student_id)
        if not student or student.is_deleted:
            raise NotFoundError("Aluno")
        return student

    async def list_paginated(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Student], int]:
        skip = (page - 1) * size
        return await self.repo.list_paginated(search=search, status=status, skip=skip, limit=size)

    async def update(self, student_id: uuid.UUID, data: StudentUpdate) -> Student:
        student = await self.get(student_id)
        updates = data.model_dump(exclude_none=True, exclude_unset=True)

        if "cpf" in updates and updates["cpf"] != student.cpf:
            existing = await self.repo.get_active_by_cpf(updates["cpf"])
            if existing:
                raise ConflictError(f"CPF {updates['cpf']} já cadastrado")

        for field, value in updates.items():
            setattr(student, field, value)

        await self.session.commit()
        await self.session.refresh(student)
        return student

    async def update_photo(self, student_id: uuid.UUID, photo_url: str) -> Student:
        student = await self.get(student_id)
        student.photo_url = photo_url
        await self.session.commit()
        return student

    async def delete(self, student_id: uuid.UUID) -> None:
        student = await self.get(student_id)
        await self.repo.soft_delete(student)
        await self.session.commit()
