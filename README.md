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

| Módulo | Fase | Status | O que foi entregue |
|---|---|---|---|
| Autenticação (JWT) | Fase 0 | ✅ Completo | Login, refresh token, proteção de rotas |
| Alunos | Fase 1 | ✅ Completo | CRUD completo, foto, busca paginada, detalhe |
| Planos | Fase 1 | ✅ Completo | CRUD completo, tipos e modalidades de plano |
| Matrículas | Fase 1 | ✅ Completo | CRUD completo, listagem global, get/update por ID, student_name na resposta |
| Financeiro | Fase 1 | 🔄 Parcial | Cobranças via matrícula, pendentes, inadimplentes, registro de pagamento; sem CRUD dedicado de AR/categorias |
| Instrutores | Fase 2 | ✅ Completo | CRUD completo, filtro active_only, página dedicada com busca e edição |
| Aulas | Fase 2 | 🔄 Parcial | CRUD de turmas e horários, vínculo de alunos; sem tela de aulas privadas e sem delete de turma |
| Presença | Fase 2 | 🔄 Parcial | Check-in, listagem, frequência, remoção; sem update/get-by-id e sem filtros avançados |
| Graduação | Fase 2 | 🔄 Parcial | Faixas, eventos e graduações com create/list/delete; sem edição e sem tela de participantes |
| Dashboard | Fase 4 | 🔄 Parcial | KPIs financeiros, gráfico de receita, planos vencendo; sem métricas de aulas/presença/graduação |
| Eventos & Chaveamento | Fase 3 | 🔜 Não iniciado | — |

## Arquitetura

```
Raja Muaythai Manager/
├── backend/                  # FastAPI
│   ├── api/v1/endpoints/     # Rotas por módulo
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas (request/response)
│   ├── services/             # Lógica de negócio
│   ├── repositories/         # Acesso ao banco
│   └── migrations/           # Alembic
├── frontend/                 # React + TypeScript
│   └── src/
│       ├── pages/            # Uma pasta por módulo
│       ├── services/         # Chamadas à API
│       ├── components/       # Componentes reutilizáveis
│       ├── types/            # Tipos globais (api.types.ts)
│       └── layouts/          # MainLayout, AuthLayout
├── database/                 # Scripts SQL iniciais
├── docs/                     # Templates de e-mail e documentação
└── scripts/                  # Utilitários (backup, seed)
```

## Convenções

- **Backend:** endpoints em snake_case, schemas com `BaseSchema` (Pydantic v2), soft-delete via `deleted_at`
- **Frontend:** serviços em `*.service.ts`, páginas em `PascalCase/index.tsx`, tipos globais em `api.types.ts`
- **Git:** commits em `feat/fix/docs/refactor(módulo): descrição`
- **LGPD:** dados pessoais expostos apenas no escopo necessário; soft-delete preserva histórico

## Changelog

### 2026-06-12
- **feat(instrutores):** módulo completo — CRUD backend + página frontend com busca, filtro e edição
- **feat(matriculas):** módulo completo — GET/PUT/listagem global, student_name na resposta, página dedicada

### 2026-06-11
- **docs:** status real dos módulos atualizado no README
- **chore:** repositório Git inicializado e publicado no GitHub
