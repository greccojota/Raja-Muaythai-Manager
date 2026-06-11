# Raja MuayThai Stadium — Sistema de Gestão

Sistema completo para gestão da academia Raja MuayThai Stadium.

## Stack

- **Backend:** Python 3.13 · FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2
- **Frontend:** React 18 · Vite 5 · TypeScript · TanStack Query · MUI v6
- **Banco:** PostgreSQL 16
- **Infra:** Docker · Docker Compose · Nginx

## Início rápido

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com suas senhas

# 2. Subir o ambiente completo
docker-compose up -d

# 3. Rodar migrations
docker exec raja-backend alembic upgrade head

# 4. Acessar
# Frontend: http://localhost
# API docs: http://localhost:8000/docs
# pgAdmin:  http://localhost:5050 (dev only)
```

## Desenvolvimento local

```bash
# Subir com hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Criar nova migration
docker exec raja-backend alembic revision --autogenerate -m "descricao"

# Testes backend
docker exec raja-backend pytest tests/ -v
```

## Módulos

| Módulo | Status |
|---|---|
| Autenticação (JWT) | ✅ Fase 0 |
| Alunos | 🔜 Fase 1 |
| Planos & Matrículas | 🔜 Fase 1 |
| Financeiro | 🔜 Fase 1 |
| Aulas & Presença | 🔜 Fase 2 |
| Graduação | 🔜 Fase 2 |
| Eventos & Chaveamento | 🔜 Fase 3 |
| Dashboard | 🔜 Fase 4 |
