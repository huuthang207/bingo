# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a TypeScript npm-workspaces monorepo for a realtime Bingo web app. The app targets host-led Bingo rooms for roughly 100 players, with no user accounts: host and player access are controlled by random tokens that are returned once and stored hashed in PostgreSQL.

Stack:

- Frontend: Next.js 15, React 19, Tailwind CSS, Socket.IO client
- Backend: Express, Socket.IO, Prisma, PostgreSQL
- Shared package: TypeScript domain types, constants, and Zod validation schemas

## Common commands

Run from the repository root unless noted.

```bash
npm install
npm run dev              # Run web and server dev processes in parallel
npm run dev:web          # Next.js dev server only
npm run dev:server       # Express/Socket.IO server with tsx watch only
npm run build            # Build shared, web, and server packages
npm run typecheck        # Typecheck shared, web, and server packages
npm run test             # Run server tests
npm run lint             # Run the web lint script
npm run cleanup:uploads  # Dry-run cleanup for old uploaded image files
npm run cleanup:rooms    # Dry-run cleanup for old ended rooms
npm run prisma:generate  # Generate Prisma client for apps/server
npm run prisma:migrate   # Run prisma migrate dev for apps/server
npm --workspace apps/server run prisma:deploy  # Run prisma migrate deploy for production DBs
```

Workspace-specific commands:

```bash
npm --workspace packages/shared run build
npm --workspace packages/shared run typecheck
npm --workspace apps/web run build
npm --workspace apps/web run typecheck
npm --workspace apps/web run lint
npm --workspace apps/server run build
npm --workspace apps/server run typecheck
npm --workspace apps/server run test
npm --workspace apps/server run cleanup:uploads
npm --workspace apps/server run cleanup:rooms
npm --workspace apps/server run prisma:generate
npm --workspace apps/server run prisma:migrate
npm --workspace apps/server run prisma:deploy
```

Server tests use Node's built-in test runner through `tsx`. Run a single test file with:

```bash
npm --workspace apps/server exec -- tsx --test src/bingo/checkWin.test.ts
```

`npm run cleanup:uploads` is a dry run by default. To actually delete uploaded images older than the threshold, run:

```bash
npm --workspace apps/server run cleanup:uploads -- -- --apply --max-age-days=30
```

`npm run cleanup:rooms` is also a dry run by default. To actually delete ended rooms older than the threshold, run:

```bash
npm --workspace apps/server run cleanup:rooms -- -- --apply --max-age-days=30
```

## Environment and runtime configuration

- Backend defaults to port `4000` via `PORT` in `apps/server/src/index.ts`.
- Backend CORS uses comma-separated `WEB_ORIGIN` values and defaults to `http://localhost:3000` when unset.
- Frontend API and Socket.IO clients use `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:4000`.
- Prisma uses `DATABASE_URL` from the server environment and the PostgreSQL schema in `apps/server/prisma/schema.prisma`.

## Architecture

The monorepo is split into three main workspaces:

- `packages/shared`: shared domain types, constants, and Zod schemas. Import from `@bingo/shared` instead of duplicating request/event shapes or validation rules in app code.
- `apps/server`: Express REST API, Socket.IO handlers, Prisma access, token utilities, upload handling, room code generation, and server-owned Bingo logic.
- `apps/web`: Next.js App Router UI for landing, create-room, host dashboard, and player room flows.

The expected high-level flow is:

```text
Next.js frontend
  -> REST API for creating rooms, joining rooms, uploads, and state recovery
  -> Socket.IO for realtime game events
Express + Socket.IO backend
  -> Prisma
PostgreSQL
```

## Server responsibilities

The server is the source of truth for game state and outcomes. Important server modules:

- `apps/server/src/app.ts` creates the Express app, JSON parsing, CORS, static `/uploads`, request logging, `/health`, `/rooms`, `/uploads`, and centralized error handling.
- `apps/server/src/index.ts` creates the HTTP server, attaches Socket.IO, configures CORS, and starts listening.
- `apps/server/src/routes/rooms.ts` implements REST endpoints for creating rooms, fetching public room info, joining rooms, and restoring host/player state.
- `apps/server/src/routes/uploads.ts` implements rate-limited image uploads for jpg/png/webp files up to 2MB and serves them from the server upload directory.
- `apps/server/src/socket.ts` implements Socket.IO events such as `host_join_room`, `join_room`, `start_game`, `call_next_item`, `mark_cell`, `claim_bingo`, and `end_game`.
- `apps/server/src/services/state.ts` centralizes token lookup, Prisma-to-domain mapping, and JSON parsing helpers for board and marked-cell state.
- `apps/server/src/services/game.ts` contains mark-cell eligibility helpers.
- `apps/server/src/services/cors.ts`, `logger.ts`, and middleware files cover origin allowlisting, structured logging, request logging, rate limiting, and error responses.
- `apps/server/src/bingo/generateBoard.ts` and `apps/server/src/bingo/checkWin.ts` contain core Bingo board generation and win checking.

Server-side game rules to preserve:

- Token secrets are never stored as plain text in the database; compare provided host/player tokens against stored hashes.
- A player board is only returned to that player, not to other players or the host in MVP state responses.
- `mark_cell` must be accepted only when the player token is valid, the room is playing, the cell exists on that player board, and the cell item has been called or is a FREE cell.
- `claim_bingo` must recompute validity from database-backed board data, marked cells, called items, and room win rules; do not trust client-side win decisions.
- Socket.IO room naming currently uses `room:{roomCode}`, `host:{roomCode}`, and `player:{playerId}`.

## Frontend responsibilities

The web app uses Next.js App Router and client components for interactive room flows:

- `apps/web/src/app/create/CreateRoomClient.tsx` builds the create-room form and sends `POST /rooms`.
- `apps/web/src/app/host/[roomCode]/HostRoomClient.tsx` loads host state over REST using the host token, joins the host Socket.IO room, shows QR/invite link, and emits host controls.
- `apps/web/src/app/play/[roomCode]/PlayRoomClient.tsx` stores the player token in `localStorage`, restores player state over REST, joins the player Socket.IO room, marks cells, and claims Bingo.
- `apps/web/src/lib/api.ts` defines `apiFetch` and `API_BASE_URL`.
- `apps/web/src/lib/socket.ts` creates Socket.IO clients with `autoConnect: false`.
- `apps/web/src/components/BingoBoard.tsx`, `CalledItemCard.tsx`, and `PixelUi.tsx` are shared UI components for board display, called item rendering, and the pixel-styled UI primitives.

User-entered room items and player names should continue to render through React text rendering; do not introduce `dangerouslySetInnerHTML` for these values.

## Data model

Prisma models in `apps/server/prisma/schema.prisma` map to PostgreSQL tables for:

- `Room`: room code, host token hash, status, board configuration, win rules, timestamps.
- `RoomItem`: configured room items.
- `Player`: player token hash, player board JSON, marked cells JSON, board regeneration count, winner state, timestamps.
- `CalledItem`: called room items with room-local call order.
- `BingoClaim`: claim status and winning pattern review data.

Board data and marked cells are stored as JSON fields on `Player`, so validate/normalize at API and Socket.IO boundaries before persisting changes.

## Planning docs

The `plans/` directory contains Vietnamese project planning documents. Use them for intended behavior when implementation is incomplete or ambiguous:

- `plans/00-overview.md`: goals, MVP scope, selected stack, and core design principles.
- `plans/01-architecture.md`: intended frontend/backend/database architecture and realtime flow.
- `plans/02-database-schema.md`: Prisma/PostgreSQL schema rationale.
- `plans/03-api-and-socket-contract.md`: REST and Socket.IO contract.
- `plans/04-game-logic.md`: board generation, item calling, mark-cell, and Bingo claim rules.
- `plans/05-ui-pages.md`: planned pages and components.
- `plans/06-security-and-validation.md`: token, validation, anti-cheat, upload, and logging guidance.
- `plans/07-roadmap.md`: phased implementation roadmap.
- `plans/08-progress.md`: implementation progress tracker.
