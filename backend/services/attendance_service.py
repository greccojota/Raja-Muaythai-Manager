import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from models.attendance import AttendanceRecord
from repositories.attendance_repository import AttendanceRepository
from repositories.student_repository import StudentRepository
from core.exceptions import NotFoundError
from schemas.attendance import AttendanceCreate


class AttendanceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AttendanceRepository(session)

    async def check_in(self, data: AttendanceCreate) -> AttendanceRecord:
        student = await StudentRepository(self.session).get_by_id(data.student_id)
        if not student or student.is_deleted:
            raise NotFoundError("Aluno")

        check_in_at = data.check_in_at or datetime.now(timezone.utc)
        record = await self.repo.create(
            student_id=data.student_id,
            class_group_id=data.class_group_id,
            private_class_id=data.private_class_id,
            check_in_at=check_in_at,
            check_in_type=data.check_in_type,
            notes=data.notes,
        )
        await self.session.commit()
        rows, _ = await self.repo.list_recent(student_id=data.student_id, limit=1)
        return rows[0] if rows else record

    async def list_recent(self, class_group_id=None, student_id=None, page=1, size=50):
        skip = (page - 1) * size
        return await self.repo.list_recent(
            class_group_id=class_group_id,
            student_id=student_id,
            skip=skip,
            limit=size,
        )

    async def delete(self, record_id: uuid.UUID) -> None:
        record = await self.repo.get_by_id(record_id)
        if not record:
            raise NotFoundError("Registro de presença")
        await self.repo.delete(record)
        await self.session.commit()

    async def get_frequency_summary(self) -> list[dict]:
        return await self.repo.get_frequency_summary()
