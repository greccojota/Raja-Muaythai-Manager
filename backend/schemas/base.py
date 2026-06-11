from typing import Any
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseSchema):
    message: str


class PaginatedResponse(BaseSchema):
    total: int
    page: int
    size: int
    pages: int
    items: list[Any] = []
