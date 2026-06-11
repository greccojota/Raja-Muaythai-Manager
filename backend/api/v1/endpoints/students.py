import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.user import User
from schemas.base import MessageResponse, PaginatedResponse
from schemas.student import StudentCreate, StudentListItem, StudentRead, StudentUpdate
from services.student_service import StudentService
import math

router = APIRouter(prefix="/students", tags=["Alunos"])

UPLOAD_DIR = "/app/uploads/students"


@router.get("", response_model=PaginatedResponse)
async def list_students(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    service = StudentService(session)
    students, total = await service.list_paginated(
        search=search, status=status_filter, page=page, size=size
    )
    items = [StudentListItem.model_validate(s) for s in students]
    return PaginatedResponse(
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 1,
        items=[i.model_dump() for i in items],
    )


@router.post("", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: StudentCreate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session).create(data)


@router.get("/{student_id}", response_model=StudentRead)
async def get_student(
    student_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session).get(student_id)


@router.put("/{student_id}", response_model=StudentRead)
async def update_student(
    student_id: uuid.UUID,
    data: StudentUpdate,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session).update(student_id, data)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await StudentService(session).delete(student_id)


@router.post("/{student_id}/photo", response_model=StudentRead)
async def upload_photo(
    student_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "photo.jpg")[1].lower()
    filename = f"{student_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    photo_url = f"/uploads/students/{filename}"
    return await StudentService(session).update_photo(student_id, photo_url)
