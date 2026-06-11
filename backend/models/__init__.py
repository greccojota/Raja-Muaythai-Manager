# Importar todos os models aqui para o Alembic detectar via autogenerate
from models.base import Base
from models.user import User, RefreshToken
from models.audit_log import AuditLog
from models.student import Student
from models.plan import Plan
from models.enrollment import Enrollment
from models.financial import AccountsReceivable, Payment, FinancialCategory, EmailLog
from models.instructor import Instructor
from models.classes import ClassGroup, ClassSchedule, ClassEnrollment, PrivateClass
from models.attendance import AttendanceRecord
from models.graduation import BeltLevel, GraduationEvent, Graduation

__all__ = [
    "Base", "User", "RefreshToken", "AuditLog",
    "Student", "Plan", "Enrollment",
    "AccountsReceivable", "Payment", "FinancialCategory", "EmailLog",
    "Instructor",
    "ClassGroup", "ClassSchedule", "ClassEnrollment", "PrivateClass",
    "AttendanceRecord",
    "BeltLevel", "GraduationEvent", "Graduation",
]
