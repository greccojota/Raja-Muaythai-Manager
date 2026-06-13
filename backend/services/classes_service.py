import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictError, NotFoundError
from models.classes import ClassEnrollment, ClassGroup, ClassSchedule, PrivateClass
from repositories.classes_repository import (
    ClassEnrollmentRepository,
    ClassGroupRepository,
    PrivateClassRepository,
)
from schemas.classes import (
    ClassEnrollmentCreate,
    ClassGroupCreate,
    ClassGroupUpdate,
    PrivateClassCreate,
    PrivateClassUpdate,
)


class ClassGroupService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ClassGroupRepository(session)

    async def list(self, active_only: bool = True):
        groups = await self.repo.list_with_details(active_only)
        for group in groups:
            group.enrolled_count = getattr(group, "_enrolled_count", 0)
        return groups

    async def get(self, group_id: uuid.UUID) -> ClassGroup:
        group = await self.repo.get_with_details(group_id)
        if not group:
            raise NotFoundError("Turma")
        return group

    async def create(self, data: ClassGroupCreate) -> ClassGroup:
        group = await self.repo.create(
            name=data.name,
            class_type=data.class_type,
            instructor_id=data.instructor_id,
            max_students=data.max_students,
            description=data.description,
            is_active=True,
        )
        for schedule in data.schedules:
            self.session.add(ClassSchedule(
                class_group_id=group.id,
                weekday=schedule.weekday,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
            ))
        await self.session.commit()
        return await self.repo.get_with_details(group.id)

    async def update(self, group_id: uuid.UUID, data: ClassGroupUpdate) -> ClassGroup:
        group = await self.get(group_id)
        updates = data.model_dump(exclude_none=True, exclude={"schedules"})
        for field, value in updates.items():
            setattr(group, field, value)
        if data.schedules is not None:
            for schedule in list(group.schedules):
                await self.session.delete(schedule)
            for schedule in data.schedules:
                self.session.add(ClassSchedule(
                    class_group_id=group.id,
                    weekday=schedule.weekday,
                    start_time=schedule.start_time,
                    end_time=schedule.end_time,
                ))
        await self.session.commit()
        return await self.repo.get_with_details(group_id)

    async def enroll_student(self, data: ClassEnrollmentCreate) -> ClassEnrollment:
        group = await self.get(data.class_group_id)
        existing = await ClassEnrollmentRepository(self.session).get_existing(
            data.class_group_id, data.student_id
        )
        if existing:
            raise ConflictError("Aluno ja esta matriculado nesta turma")
        students = await ClassEnrollmentRepository(self.session).list_by_group(data.class_group_id)
        if group.max_students is not None and len(students) >= group.max_students:
            raise ConflictError("Turma atingiu o limite maximo de alunos")
        enrollment = await ClassEnrollmentRepository(self.session).create(
            class_group_id=data.class_group_id,
            student_id=data.student_id,
            enrolled_at=data.enrolled_at,
            is_active=True,
        )
        await self.session.commit()
        return enrollment

    async def unenroll_student(self, enrollment_id: uuid.UUID) -> None:
        repo = ClassEnrollmentRepository(self.session)
        enrollment = await repo.get_by_id(enrollment_id)
        if not enrollment:
            raise NotFoundError("Matricula em turma")
        enrollment.is_active = False
        await self.session.commit()

    async def list_students(self, group_id: uuid.UUID):
        return await ClassEnrollmentRepository(self.session).list_by_group(group_id)

    async def deactivate(self, group_id: uuid.UUID) -> None:
        group = await self.get(group_id)
        group.is_active = False
        await self.session.commit()


class PrivateClassService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PrivateClassRepository(session)

    async def create(self, data: PrivateClassCreate) -> PrivateClass:
        private_class = await self.repo.create(**data.model_dump())
        await self.session.commit()
        rows, _ = await self.repo.list_paginated(student_id=data.student_id, limit=1)
        return rows[0] if rows else private_class

    async def list(self, student_id=None, instructor_id=None, page=1, size=20):
        skip = (page - 1) * size
        return await self.repo.list_paginated(
            student_id=student_id,
            instructor_id=instructor_id,
            skip=skip,
            limit=size,
        )

    async def update(self, pc_id: uuid.UUID, data: PrivateClassUpdate) -> PrivateClass:
        private_class = await self.repo.get_by_id(pc_id)
        if not private_class:
            raise NotFoundError("Aula particular")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(private_class, field, value)
        await self.session.commit()
        rows, _ = await self.repo.list_paginated(student_id=private_class.student_id, limit=1)
        return rows[0] if rows else private_class

    async def cancel(self, pc_id: uuid.UUID) -> None:
        private_class = await self.repo.get_by_id(pc_id)
        if not private_class:
            raise NotFoundError("Aula particular")
        private_class.status = "cancelled"
        await self.session.commit()
