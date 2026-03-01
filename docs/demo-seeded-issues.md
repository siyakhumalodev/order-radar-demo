# Demo-Seeded Issues — Presenter Cheat Sheet

> **Private**. Not linked from the UI, README, or any user-facing page.
> Use this to locate, explain, and fix each issue during the webinar.

---

## Correctness Bugs

| ID | File | Line tag | What a reviewer should notice | Suggested fix |
|----|------|----------|-------------------------------|---------------|
| **BUG-01** | `backend/src/services/orderService.ts` | `DEMO-SEED: BUG-01` | `cancelOrder()` sets status to `cancelled` regardless of current status. A delivered or already-cancelled order can be "cancelled" again, silently updating `updatedAt`. | Add a guard: reject cancel when `order.status` is `delivered`, `cancelled`, or `returned`. Return a `409 Conflict`. |
| **BUG-02** | `backend/src/routes/orders.ts` | `DEMO-SEED: BUG-02` | The `POST /:id/cancel` handler has no `try-catch`. The `GET /` handler has one, but the cancel handler doesn't — an unexpected DB error will crash the Node process with an unhandled exception. | Wrap the body in `try-catch` and return `500` on failure, matching the pattern in the list route. |
| **BUG-03** | `backend/src/services/riskScoring.ts` | `DEMO-SEED: BUG-03` | `e.split("@")[1]` returns `undefined` for emails without `@`. `freeProviders.indexOf(undefined)` returns `-1`, so malformed emails silently score as "custom domain" (+4 risk). No crash, just wrong data. | Add a guard clause: `const d = e.split("@")[1] ?? ""` or validate email format before scoring. |

---

## Performance Issues

| ID | File | Line tag | What a reviewer should notice | Suggested fix |
|----|------|----------|-------------------------------|---------------|
| **PERF-01** | `backend/src/services/orderService.ts` | `DEMO-SEED: PERF-01` | Every page request fires two separate queries — `SELECT COUNT(*)` then `SELECT *`. On a large table this doubles the I/O. | Use `SELECT *, COUNT(*) OVER() AS _total` or a CTE to combine both into one query. |
| **PERF-02** | `frontend/src/pages/OrdersListPage.tsx` | `DEMO-SEED: PERF-02` | The search `<input>` fires an API request on every keystroke. Typing "keyboard" sends 8 requests in rapid succession. | Debounce the `search` value (e.g., 300 ms) before including it in the `useCallback` dependency array. |
| **PERF-03** | `frontend/src/components/OrderTable.tsx` | `DEMO-SEED: PERF-03` | `new Date(o.createdAt).toLocaleDateString()` is called inline per row on every render. The inline style objects in `RiskBar` are also re-created each render. | Memoize formatted dates outside JSX; extract static style objects to module scope or use `useMemo`. |

---

## Security Issues

| ID | File | Line tag | What a reviewer should notice | Suggested fix |
|----|------|----------|-------------------------------|---------------|
| **SEC-01** | `backend/src/services/orderService.ts` | `DEMO-SEED: SEC-01` | The `search` parameter is string-interpolated into the SQL WHERE clause instead of using a parameterised `?` placeholder. Payload: `?search=' OR 1=1 --` | Use `conditions.push("(customerName LIKE ? OR product LIKE ?)")` with `params.push(\`%${search}%\`, \`%${search}%\`)`. |
| **SEC-02** | `backend/src/middleware/auth.ts` | `DEMO-SEED: SEC-02` | A credential (`sk_live_demo_…`) is hardcoded in source and committed to version control. Secret scanning should flag the `sk_live_` prefix. | Move to `process.env.API_KEY`, add `.env` to `.gitignore` (already done), provide `.env.example`. |
| **SEC-03** | `backend/src/routes/orders.ts` | `DEMO-SEED: SEC-03` | The `POST /:id/cancel` endpoint has no authentication middleware. Read routes are intentionally public, but the write operation should require `requireApiKey`. | Apply `requireApiKey` middleware: `router.post("/:id/cancel", requireApiKey, ...)`. |
| **SEC-04** | `backend/src/routes/orders.ts` | `DEMO-SEED: SEC-04` | On successful cancel, the full order object — including `customerEmail` and `shippingAddress` — is logged to stdout. In production this leaks PII into log aggregators. | Log only `order.id` and `order.status`, or use a structured logger with PII redaction. |

---

## Intentionally Missing Test Coverage

| Gap | File | Why it matters |
|-----|------|----------------|
| No test for cancelling a delivered order | `tests/orders.test.ts` | Would reveal BUG-01 |
| No test for SQL injection via search | `tests/orders.test.ts` | Would reveal SEC-01 |
| No test for email without `@` | `tests/riskScoring.test.ts` | Would reveal BUG-03 |
| No test for negative quantity or zero price | `tests/riskScoring.test.ts` | Edge-case gaps |
| No frontend tests at all | `frontend/` | Good discussion point for Copilot test generation |

---

## How to Demo Each Issue

| Demo scenario | Issues to highlight |
|---------------|---------------------|
| **PR review for bugs** | BUG-01, BUG-02, BUG-03 |
| **PR review for performance** | PERF-01, PERF-02, PERF-03 |
| **PR review for security** | SEC-01, SEC-03, SEC-04 |
| **CodeQL analysis** | SEC-01 (SQL injection) |
| **Secret scanning** | SEC-02 (`sk_live_` key in source) |
| **Explain legacy code** | `riskScoring.ts` — nested logic, magic numbers, unclear vars |
| **Generate missing tests** | All gaps in table above |
| **Docs automation** | Use the feature branch PR |
