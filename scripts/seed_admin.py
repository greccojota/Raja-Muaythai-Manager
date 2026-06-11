"""Cria o usuário administrador inicial. Executar uma única vez após as migrations."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)) + "/backend")

from core.database import AsyncSessionLocal
from core.security import hash_password
from models.user import User
from sqlalchemy import select


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@raja.com.br")
    password = os.environ.get("ADMIN_PASSWORD", "Muaythai@2025")
    name = os.environ.get("ADMIN_NAME", "Administrador")

    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"Usuário {email} já existe. Nenhuma ação necessária.")
            return

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=name,
            role="admin",
            is_active=True,
        )
        session.add(user)
        await session.commit()
        print(f"Administrador criado: {email}")
        print("ATENÇÃO: Altere a senha no primeiro acesso!")


if __name__ == "__main__":
    asyncio.run(seed_admin())
