from typing import AsyncGenerator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.exceptions import UnauthorizedError
from core.security import decode_token
from models.user import User
from repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Token inválido ou expirado")

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(payload["sub"])
    if not user or not user.is_active:
        raise UnauthorizedError("Usuário não encontrado ou inativo")
    return user
