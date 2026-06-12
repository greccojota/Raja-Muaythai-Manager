import uuid
from datetime import datetime
from typing import Optional
from schemas.base import BaseSchema


class InstructorCreate(BaseSchema):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True


class InstructorUpdate(BaseSchema):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None


class InstructorRead(BaseSchema):
    id: uuid.UUID
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime
