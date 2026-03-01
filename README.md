# Order Radar Demo

A small full-stack order management dashboard built for a webinar on **advanced prompt engineering with GitHub Copilot**.

## Quick Start

```bash
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18 + Vite + TypeScript      |
| Backend   | Node.js + Express + TypeScript    |
| Database  | SQLite (in-memory, seeded on boot)|
| Tests     | Vitest                            |
| CI/CD     | GitHub Actions                    |

## Project Structure

```
order-radar-demo/
├── backend/          # Express API
├── frontend/         # React SPA
├── docs/             # Architecture & API docs
└── .github/workflows # CI, CodeQL, docs automation
```

See [docs/architecture.md](docs/architecture.md) for details.
