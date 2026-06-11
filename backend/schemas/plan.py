import uuid
from decimal import Decimal
from typing import Optional
from pydantic import field_validator, model_validator
from schemas.base import BaseSchema

PLAN_TYPES = {"monthly", "quarterly", "semiannual", "annual"}
PLAN_MODALITIES = {"collective", "personal"}
CYCLE_DAYS = {"monthly": 30, "quarterly": 90, "semiannual": 180, "annual": 365}


class PlanBase(BaseSchema):
    name: str
    plan_type: str
    plan_modality: str = "collective"
    monthly_value: Decimal
    description: Optional[str] = None
    is_active: bool = True

    @field_validator("plan_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in PLAN_TYPES:
            raise ValueError(f"Tipo deve ser um de: {', '.join(PLAN_TYPES)}")
        return v

    @field_validator("plan_modality")
    @classmethod
    def validate_modality(cls, v: str) -> str:
        if v not in PLAN_MODALITIES:
            raise ValueError(f"Modalidade do plano deve ser uma de: {', '.join(PLAN_MODALITIES)}")
        return v

    @model_validator(mode="after")
    def validate_value(self):
        if self.monthly_value <= 0:
            raise ValueError("Valor do plano deve ser maior que zero")
        return self


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseSchema):
    name: Optional[str] = None
    plan_type: Optional[str] = None
    plan_modality: Optional[str] = None
    monthly_value: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("plan_type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PLAN_TYPES:
            raise ValueError(f"Tipo deve ser um de: {', '.join(PLAN_TYPES)}")
        return v

    @field_validator("plan_modality")
    @classmethod
    def validate_modality(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PLAN_MODALITIES:
            raise ValueError(f"Modalidade do plano deve ser uma de: {', '.join(PLAN_MODALITIES)}")
        return v

    @field_validator("monthly_value")
    @classmethod
    def validate_monthly_value(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Valor do plano deve ser maior que zero")
        return v


class PlanRead(PlanBase):
    id: uuid.UUID
    billing_cycle_days: int
