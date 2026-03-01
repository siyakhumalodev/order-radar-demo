# Order Radar Demo

A small but realistic full-stack order management dashboard.

The app demonstrates PR description generation, PR review (bugs, performance, security), documentation automation, explaining complex diffs, and combining Copilot with GitHub Advanced Security.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| [Node.js](https://nodejs.org/) | 20 LTS or later | `node -v` |
| npm | 10+ (ships with Node 20) | `npm -v` |
| [Git](https://git-scm.com/) | 2.40+ | `git --version` |

> **Windows users:** Use PowerShell or Git Bash. The npm scripts work on all platforms.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd order-radar-demo
```

### 2. Install dependencies

```bash
npm run install:all
```

This installs root, backend, and frontend dependencies in one command.

### 3. Start the development servers

```bash
npm run dev
```

This runs the backend and frontend concurrently using `concurrently`:

| Service  | URL                     | Description |
|----------|-------------------------|-------------|
| Frontend | http://localhost:5173    | React SPA (Vite dev server with HMR) |
| Backend  | http://localhost:3001    | Express API (auto-reloads via `tsx watch`) |
| Health   | http://localhost:3001/api/health | Quick connectivity check |

The backend seeds **520 fake orders** into an in-memory SQLite database on every start — no external database setup required.

### 4. Run tests

```bash
npm test
```

Runs the backend test suite with Vitest. Tests use a smaller seed (50 orders) for speed.

### 5. Build for production

```bash
npm run build
```

Compiles the backend TypeScript to `backend/dist/` and builds the frontend to `frontend/dist/`.

---

## Available Scripts

Run these from the **project root**:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend in dev mode |
| `npm run dev:backend` | Start only the backend (with file watching) |
| `npm run dev:frontend` | Start only the frontend (Vite dev server) |
| `npm run build` | Build both backend and frontend for production |
| `npm test` | Run backend tests (`vitest run`) |
| `npm run install:all` | Install dependencies for root, backend, and frontend |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18 + Vite 6 + TypeScript 5.7 | SPA with react-router-dom v6 |
| Backend | Node.js 20 + Express 4 + TypeScript 5.7 | REST API with `tsx` for dev |
| Database | SQLite via better-sqlite3 | In-memory, seeded on boot |
| Tests | Vitest 2.1 | Backend unit tests |
| CI/CD | GitHub Actions | CI, CodeQL, docs automation |

---

## Project Structure

```
order-radar-demo/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express entry point
│   │   ├── db.ts                 # SQLite setup & schema
│   │   ├── seed.ts               # Deterministic data generator (520 orders)
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── middleware/auth.ts     # API key authentication
│   │   ├── routes/orders.ts      # Order CRUD endpoints
│   │   ├── routes/notes.ts       # Order notes endpoints
│   │   ├── services/orderService.ts  # Data access layer
│   │   └── services/riskScoring.ts   # Risk scoring engine
│   └── tests/                    # Vitest test files
├── frontend/
│   ├── src/
│   │   ├── api/client.ts         # Typed fetch wrappers
│   │   ├── components/           # OrderTable, StatusBadge, CancelModal, NotesPanel
│   │   ├── pages/                # OrdersListPage, OrderDetailPage
│   │   └── types.ts              # Frontend type definitions
│   └── index.html
├── docs/
│   ├── architecture.md           # System design overview
│   ├── api.md                    # Full API reference
│   └── changelog-template.md     # PR changelog template
└── .github/workflows/
    ├── ci.yml                    # Test + build pipeline
    ├── codeql.yml                # GitHub Advanced Security
    └── docs-automation.yml       # Auto-generate docs on PR
```

See [docs/architecture.md](docs/architecture.md) for the full system design and [docs/api.md](docs/api.md) for the API reference.

---

## API Overview

All endpoints are prefixed with `/api`. See [docs/api.md](docs/api.md) for full details.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/orders` | No | List orders (paginated, filterable) |
| `GET` | `/api/orders/:id` | No | Get a single order |
| `POST` | `/api/orders/:id/cancel` | No* | Cancel an order (with optional reason) |
| `GET` | `/api/orders/:orderId/notes` | No | List notes for an order |
| `POST` | `/api/orders/:orderId/notes` | No | Add a note to an order |

\* Protected routes require the `x-api-key` header for authenticated endpoints.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `API_KEY` | *(hardcoded for demo)* | API key for authenticated endpoints |

For production, create a `.env` file in `backend/` (already in `.gitignore`).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `EADDRINUSE` on port 3001 | Another process is using the port. Kill it or set a different `PORT`. |
| `npm run dev` fails | Ensure you ran `npm run install:all` first. |
| Empty order list in the UI | The backend may not be running. Check http://localhost:3001/api/health. |
| `better-sqlite3` build errors | You may need Python and a C++ compiler. See [better-sqlite3 docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/troubleshooting.md). |

---

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run `npm test` to verify
4. Open a pull request against `develop`

---

## License

MIT
