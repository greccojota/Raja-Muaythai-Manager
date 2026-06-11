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
| Autenticação (JWT) | ✅ Fase 0 — Completo |
| Alunos | ✅ Fase 1 — Completo |
| Planos | ✅ Fase 1 — Completo |
| Matrículas | 🔄 Fase 1 — Parcial (sem update/get-by-id; frontend embutido em detalhe do aluno) |
| Financeiro | 🔄 Fase 1 — Parcial (workflow via matrículas; sem CRUD dedicado completo) |
| Instrutores | 🔄 Fase 2 — Parcial (model + endpoint existem; frontend pendente) |
| Aulas | 🔄 Fase 2 — Parcial (CRUD de grupos/horários; sem delete de aulas privadas) |
| Presença | 🔄 Fase 2 — Parcial (create/list/delete; sem update/get-by-id) |
| Graduação | 🔄 Fase 2 — Parcial (faixas, eventos e graduações; cobertura incompleta) |
| Dashboard | 🔄 Fase 4 — Parcial (endpoint de agregação real; frontend existe) |
| Eventos & Chaveamento | 🔜 Fase 3 — Não iniciado |
