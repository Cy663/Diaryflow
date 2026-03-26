# Project Plan: Diaryflow

## Overview
Diaryflow is a web application built with a React frontend and Node.js/Express backend using TypeScript. The team consists of three fullstack developers (Mao, Wu, Tang) working on a greenfield project with no external constraints. Deliverables will be defined as the project evolves — this plan provides the foundational structure and will be updated as features are scoped.

## Team
| Name | Role/Skills | Primary Modules |
|------|-------------|-----------------|
| Mao  | Fullstack (React + Node.js) | TBD |
| Wu   | Fullstack (React + Node.js) | TBD |
| Tang | Fullstack (React + Node.js) | TBD |

## Dependency Graph
Map every task and its dependencies. Be explicit:

### Foundation tasks (no dependencies — must go first)
- [x] Project scaffolding — Mao — repo structure, configs, tooling
- [ ] Database schema design — Wu — define data models and relationships
- [ ] Auth system — Tang — JWT auth, login/register endpoints + UI

### Tasks that depend on foundation
- [ ] TBD — depends on: database schema, auth system

### Tasks with no dependencies on each other (can run in parallel)
- [ ] TBD — will be assigned when deliverables are defined

## Execution Phases

### Phase 1: Foundation — SEQUENTIAL
> These tasks must complete before anything else starts.
> Assigned to: Mao
> Acceptance criteria:
> - Project builds and runs (`npm run dev` works for both client and server)
> - Placeholder tests pass (`npm test` runs green)
> - Database connection is configured
> - Basic Express server responds to health check at `GET /api/health`
> - React app renders a landing page

- [x] Initialize project structure (client, server, shared)
- [ ] Set up database connection (choose DB: PostgreSQL recommended)
- [ ] Create Express server with health check endpoint
- [ ] Create React app with routing scaffold
- [ ] Verify end-to-end dev environment works

### Phase 2: Core Features — PARALLEL
> These tasks have no dependencies on each other.
> Can be done simultaneously by different people on separate branches.
> Assigned to: Mao does Feature A, Wu does Feature B, Tang does Feature C
> (Features TBD — update this section when deliverables are defined)

- [ ] Feature A — Mao — TBD
- [ ] Feature B — Wu — TBD
- [ ] Feature C — Tang — TBD

### Phase 3: Integration — SEQUENTIAL
> Integration phase. Depends on all Phase 2 work being merged.
> Assigned to: Wu (or rotate)

- [ ] Merge all Phase 2 branches
- [ ] End-to-end integration testing
- [ ] Fix integration issues
- [ ] Performance review and optimization
- [ ] Update documentation

### Phase 4: Polish & Deploy — SEQUENTIAL
> Final phase. Depends on Phase 3 completion.
> Assigned to: Tang (or rotate)

- [ ] UI/UX polish
- [ ] Error handling and edge cases
- [ ] Deployment configuration
- [ ] Production readiness review

## Contracts
> API interfaces, shared types, and module boundaries that MUST be agreed
> upon before parallel work begins. Changing these requires notifying the team.

### Client ↔ Server
- All API calls go through `/api/*` prefix
- Request/response types are defined in `shared/types/`
- Errors follow a standard shape: `{ error: string, code: number, details?: any }`

### Auth Contract
- `POST /api/auth/register` — `{ email, password, name }` → `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` — (Bearer token) → `{ user }`
- Auth tokens are JWT, passed via `Authorization: Bearer <token>` header

### Shared Types
- All shared TypeScript interfaces live in `shared/types/`
- Both client and server import from this directory
- Changes to shared types require a team notification

## Timeline
| Phase | Type | Owner(s) | Estimated effort | Depends on |
|-------|------|----------|-----------------|------------|
| 1 — Foundation | Sequential | Mao | TBD | Nothing |
| 2 — Core Features | Parallel | Mao, Wu, Tang | TBD | Phase 1 |
| 3 — Integration | Sequential | Wu | TBD | Phase 2 |
| 4 — Polish & Deploy | Sequential | Tang | TBD | Phase 3 |
