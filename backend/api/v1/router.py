from fastapi import APIRouter

from api.v1.endpoints import (
    auth, students, plans, enrollments,
    instructors, classes, attendance, graduation,
    dashboard, financial,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(plans.router)
api_router.include_router(enrollments.router)
api_router.include_router(instructors.router)
api_router.include_router(classes.router)
api_router.include_router(attendance.router)
api_router.include_router(graduation.router)
api_router.include_router(dashboard.router)
api_router.include_router(financial.router)
