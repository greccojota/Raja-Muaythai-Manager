import uuid
from datetime import datetime
from typing import Optional
from schemas.base import BaseSchema


class AttendanceCreate(BaseSchema):
    student_id: uuid.UUID
    class_group_id: Optional[uuid.UUID] = None
    private_class_id: Optional[uuid.UUID] = None
    check_in_at: Optional[datetime] = None
    check_in_type: str = "manual"
    notes: Optional[str] = None


class AttendanceRead(BaseSchema):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    class_group_id: Optional[uuid.UUID] = None
    class_group_name: Optional[str] = None
    private_class_id: Optional[uuid.UUID] = None
    check_in_at: datetime
    check_in_type: str
    notes: Optional[str] = None


class AttendanceSummary(BaseSchema):
    student_id: uuid.UUID
    student_name: str
    total_checkins: int
    checkins_this_month: int
    last_checkin: Optional[datetime] = None
