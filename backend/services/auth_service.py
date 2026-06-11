import secrets
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import UnauthorizedError
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_raw_token,
)
from models.user import User
from repositories.user_repository import UserRepository, RefreshTokenRepository
from schemas.auth import LoginRequest, TokenResponse


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.token_repo = RefreshTokenRepository(session)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_active_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("E-mail ou senha inválidos")

        return await self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedError("Token de renovação inválido")

        token_hash = hash_raw_token(refresh_token)
        stored = await self.token_repo.get_by_token_hash(token_hash)
        if not stored:
            raise UnauthorizedError("Token de renovação não encontrado ou revogado")

        stored.is_revoked = True
        await self.session.flush()

        user = await self.user_repo.get_by_id(stored.user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("Usuário inativo")

        return await self._issue_tokens(user)

    async def logout(self, refresh_token: str) -> None:
        token_hash = hash_raw_token(refresh_token)
        stored = await self.token_repo.get_by_token_hash(token_hash)
        if stored:
            stored.is_revoked = True
        await self.session.commit()

    async def request_password_reset(self, email: str) -> None:
        user = await self.user_repo.get_active_by_email(email)
        if not user:
            return  # silencioso — não revela se o e-mail existe

        reset_token = secrets.token_urlsafe(32)
        user.password_reset_token = hash_raw_token(reset_token)
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await self.session.commit()
        # TODO: enviar e-mail com reset_token via SMTP

    async def reset_password(self, token: str, new_password: str) -> None:
        token_hash = hash_raw_token(token)
        user = await self.user_repo.get_by_reset_token(token_hash)

        if not user or not user.password_reset_expires:
            raise UnauthorizedError("Token inválido ou expirado")
        if user.password_reset_expires < datetime.now(timezone.utc):
            raise UnauthorizedError("Token expirado")

        user.hashed_password = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        await self.token_repo.revoke_all_for_user(user.id)
        await self.session.commit()

    async def change_password(self, user: User, current: str, new: str) -> None:
        if not verify_password(current, user.hashed_password):
            raise UnauthorizedError("Senha atual incorreta")
        user.hashed_password = hash_password(new)
        await self.token_repo.revoke_all_for_user(user.id)
        await self.session.commit()

    async def _issue_tokens(self, user: User) -> TokenResponse:
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        payload = decode_token(refresh_token)
        expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

        await self.token_repo.create(
            user_id=user.id,
            token_hash=hash_raw_token(refresh_token),
            expires_at=expires_at,
        )
        await self.session.commit()

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
