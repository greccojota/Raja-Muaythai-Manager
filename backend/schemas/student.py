import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import EmailStr, field_validator

from schemas.base import BaseSchema


VALID_STATUSES = {"active", "inactive", "suspended", "pending"}
VALID_GENDERS = {"M", "F", "O"}
VALID_MODALITIES = {"muaythai", "boxing", "both"}
VALID_STATES = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
}


def only_digits(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    return digits or None


def is_valid_cpf(value: str) -> bool:
    if len(value) != 11 or value == value[0] * 11:
        return False
    total = sum(int(value[i]) * (10 - i) for i in range(9))
    if int(value[9]) != ((total * 10) % 11) % 10:
        return False
    total = sum(int(value[i]) * (11 - i) for i in range(10))
    return int(value[10]) == ((total * 10) % 11) % 10


class StudentBase(BaseSchema):
    name: str
    cpf: Optional[str] = None
    rg: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    address_zip: Optional[str] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    legal_guardian_name: Optional[str] = None
    legal_guardian_phone: Optional[str] = None
    notes: Optional[str] = None
    modality: str = "muaythai"

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_GENDERS:
            raise ValueError("Genero deve ser M, F ou O")
        return v

    @field_validator("modality")
    @classmethod
    def validate_modality(cls, v: str) -> str:
        if v not in VALID_MODALITIES:
            raise ValueError(f"Modalidade deve ser uma de: {', '.join(VALID_MODALITIES)}")
        return v

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, v: Optional[str]) -> Optional[str]:
        digits = only_digits(v)
        if digits and not is_valid_cpf(digits):
            raise ValueError("CPF invalido")
        return digits

    @field_validator("phone", "whatsapp", "emergency_contact_phone", "legal_guardian_phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        digits = only_digits(v)
        if digits and len(digits) not in (10, 11):
            raise ValueError("Telefone deve ter 10 ou 11 digitos")
        return digits

    @field_validator("address_zip")
    @classmethod
    def validate_zip(cls, v: Optional[str]) -> Optional[str]:
        digits = only_digits(v)
        if digits and len(digits) != 8:
            raise ValueError("CEP deve ter 8 digitos")
        return digits

    @field_validator("address_state")
    @classmethod
    def validate_state(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        state = v.upper()
        if state not in VALID_STATES:
            raise ValueError("UF invalida")
        return state


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    name: Optional[str] = None
    modality: Optional[str] = None


class StudentStatusUpdate(BaseSchema):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"Status deve ser um de: {', '.join(VALID_STATUSES)}")
        return v


class StudentRead(StudentBase):
    id: uuid.UUID
    status: str
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class StudentListItem(BaseSchema):
    id: uuid.UUID
    name: str
    cpf: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    status: str
    modality: str
    photo_url: Optional[str] = None
    created_at: datetime
