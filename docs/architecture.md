# Architecture

## Overview

Order Radar is a monorepo containing a React SPA frontend and a Node.js/Express API backend. Data is stored in an in-memory SQLite database that is seeded on every server start.

```
┌────────────┐       HTTP/JSON       ┌────────────────┐
│  React SPA │  ──────────────────►  │  Express API   │
│  (Vite)    │  ◄──────────────────  │  (Node.js)     │
└────────────┘       localhost:3001   └───────┬────────┘
                                              │
                                     ┌────────▼────────┐
                                     │  SQLite          │
                                     │  (in-memory)     │
                                     └─────────────────┘
```

## Frontend

| Concern | Solution |
|---------|----------|
| Framework | React 18 |
| Bundler | Vite |
| Routing | react-router-dom v6 |
| HTTP | Native `fetch` via `api/client.ts` |
| Styling | Plain CSS (index.css) |

### Key pages

- **OrdersListPage** — paginated, filterable table of all orders
- **OrderDetailPage** — single order view with cancel action and notes panel

## Backend

| Concern | Solution |
|---------|----------|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Database | better-sqlite3 (in-memory) |
| Seed data | 520 fake orders generated on boot |
| Auth | Hardcoded API key (demo only) |

### Layers

```
routes/          → HTTP handlers, request validation
services/        → Business logic (orderService, riskScoring)
middleware/      → Auth, CORS
db.ts            → SQLite setup and schema
seed.ts          → Fake data generator
```

## Risk Scoring

The `riskScoring.ts` module computes a 0–100 risk score for each order based on:
- Order value tiers
- Quantity heuristics
- Email domain checks
- Status-based adjustments
- Time-of-day bonus

This module is intentionally written in a "legacy" style with nested conditionals and magic numbers to serve as a demo target for Copilot's "Explain" and "Refactor" features.

## CI/CD

Three GitHub Actions workflows:

1. **ci.yml** — Builds and tests backend + frontend on every push/PR
2. **codeql.yml** — Runs CodeQL security analysis weekly and on PRs
3. **docs-automation.yml** — Placeholder for Copilot CLI-powered PR summaries
