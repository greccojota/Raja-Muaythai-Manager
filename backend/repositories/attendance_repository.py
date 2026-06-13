import uuid
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from models.attendance import AttendanceRecord
from models.student import Student
from repositories.base_repository import BaseRepository


class AttendanceRepository(BaseRepository[AttendanceRecord]):
    def __init__(self, session: AsyncSession):
        super().__init__(AttendanceRecord, session)

    async def get_by_id(self, record_id: uuid.UUID):
        result = await self.session.execute(
            select(AttendanceRecord)
            .options(selectinload(AttendanceRecord.student), selectinload(AttendanceRecord.class_group))
            .where(AttendanceRecord.id == record_id)
        )
        return result.scalar_one_or_none()

    async def list_recent(
        self,
        class_group_id: uuid.UUID | None = None,
        student_id: uuid.UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[AttendanceRecord], int]:
        q = select(AttendanceRecord).options(
            selectinload(AttendanceRecord.student),
            selectinload(AttendanceRecord.class_group),
        )
        cq = select(func.count()).select_from(AttendanceRecord)
        if class_group_id:
            q = q.where(AttendanceRecord.class_group_id == class_group_id)
            cq = cq.where(AttendanceRecord.class_group_id == class_group_id)
        if student_id:
            q = q.where(AttendanceRecord.student_id == student_id)
            cq = cq.where(AttendanceRecord.student_id == student_id)
        if date_from:
            q = q.where(AttendanceRecord.check_in_at >= date_from)
            cq = cq.where(AttendanceRecord.check_in_at >= date_from)
        if date_to:
            q = q.where(AttendanceRecord.check_in_at <= date_to)
            cq = cq.where(AttendanceRecord.check_in_at <= date_to)
        total = (await self.session.execute(cq)).scalar_one()
        rows = (await self.session.execute(
            q.order_by(AttendanceRecord.check_in_at.desc()).offset(skip).limit(limit)
        )).scalars().all()
        return list(rows), total

    async def get_frequency_summary(self) -> list[dict]:
        """Frequência total + do mês corrente por aluno."""
        from datetime import date
        import calendar
        today = date.today()
        first_of_month = today.replace(day=1)

        result = await self.session.execute(
            select(
                AttendanceRecord.student_id,
                Student.name.label("student_name"),
                func.count(AttendanceRecord.id).label("total_checkins"),
                func.count(
                    AttendanceRecord.id
                ).filter(
                    AttendanceRecord.check_in_at >= first_of_month
                ).label("checkins_this_month"),
                func.max(AttendanceRecord.check_in_at).label("last_checkin"),
            )
            .join(Student, Student.id == AttendanceRecord.student_id)
            .group_by(AttendanceRecord.student_id, Student.name)
            .order_by(func.max(AttendanceRecord.check_in_at).desc())
        )
        return [row._asdict() for row in result.all()]
