# Diaryflow

## Architecture
Monorepo with three top-level directories:
- `client/` — React frontend (Vite + TypeScript)
- `server/` — Node.js/Express backend (TypeScript)
- `shared/` — Shared types and contracts imported by both client and server

## Module Boundaries
| Directory | Owner | Description |
|-----------|-------|-------------|
| `client/` | Assigned per phase | React UI components, pages, routing |
| `server/` | Assigned per phase | Express API routes, middleware, services |
| `shared/` | Team consensus | Shared TypeScript types — changes require team notification |

Claude should NOT edit files outside the current phase's scope.

## Conventions
- **Language**: TypeScript (strict mode) for all code
- **Naming**: camelCase for variables/functions, PascalCase for types/components, kebab-case for files
- **Components**: Functional React components with hooks (no class components)
- **API routes**: RESTful, prefixed with `/api/`
- **Error handling**: All API errors return `{ error: string, code: number }`
- **Testing**: Jest for unit tests, file naming `*.test.ts` / `*.test.tsx`
- **Git branches**: `phase-N/feature-name` (e.g., `phase-1/auth-system`)
- **Commits**: conventional commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`

## Commands
- **Install**: `npm install` (from root — uses workspaces)
- **Dev (all)**: `npm run dev`
- **Dev (client)**: `npm run dev --workspace=client`
- **Dev (server)**: `npm run dev --workspace=server`
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`

## Current Phase
> Update this section when starting a new phase.
Phase: 1
Owner: Mao
Focus: Foundation — project structure, dev environment, basic server + client running
Off-limits: None (Phase 1 sets up everything)
