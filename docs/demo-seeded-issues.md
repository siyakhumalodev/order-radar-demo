# Demo-Seeded Issues — Private Cheat Sheet

> **This file is for the presenter only.** It catalogues all intentionally
> planted issues in the codebase so you can find, explain, and fix them
> live during the webinar.  It is NOT linked from the UI or README.

---

## Correctness Bugs (3)

### Bug #1 — `riskScoring.ts`: No guard on email split
- **File:** `backend/src/services/riskScoring.ts` ~line 53
- **What:** `e.split("@")[1]` will return `undefined` if the email has no `@`, causing `freeProviders.indexOf(undefined)` to silently score incorrectly instead of throwing or handling the edge case.
- **Demo use:** Show Copilot PR review catching the missing guard.

### Bug #2 — `riskScoring.ts`: Mystery 1.15 multiplier
- **File:** `backend/src/services/riskScoring.ts` ~line 95
- **What:** All risk scores are inflated by 15% due to `s = Math.round(s * 1.15)`. There's no documentation on why, and it was "added in a hotfix."
- **Demo use:** Ask Copilot to explain why the score is inflated — it'll flag the magic number.

### Bug #3 — `orderService.ts`: Can cancel delivered orders
- **File:** `backend/src/services/orderService.ts` ~line 45
- **What:** `cancelOrder()` sets status to `'cancelled'` regardless of current status. You can cancel an already-delivered or already-cancelled order.
- **Demo use:** Show Copilot review pointing out the missing state-machine guard.

---

## Performance Issues (3)

### Perf #1 — `riskScoring.ts`: `new Date()` on every score call
- **File:** `backend/src/services/riskScoring.ts` ~line 86
- **What:** Each `computeRiskScore()` call creates a new `Date` object to check the hour. During seed (520 calls) this is fine, but in a real system scoring thousands of orders in batch, the date should be computed once.
- **Demo use:** Ask Copilot to suggest performance improvements.

### Perf #2 — `riskScoring.ts`: `batchComputeRiskScores` has no caching
- **File:** `backend/src/services/riskScoring.ts` ~line 105+
- **What:** Re-computes every score from scratch on every call. No memoisation, no diffing.
- **Demo use:** Copilot PR review can flag the O(n) recomputation.

### Perf #3 — `orderService.ts`: Search query not parameterised
- **File:** `backend/src/services/orderService.ts` ~line 27
- **What:** The `search` string is interpolated into the SQL. Beyond being a security issue (see Security #1), this also prevents SQLite from caching the prepared statement plan, creating a new plan per-request.
- **Demo use:** Pair with Security #1 for a "two birds" PR review example.

---

## Security Issues (4)

### Sec #1 — SQL Injection in search
- **File:** `backend/src/services/orderService.ts` ~line 27
- **What:** The `search` parameter is string-interpolated into the SQL WHERE clause instead of using a parameterised placeholder.  
  Payload: `?search=' OR 1=1 --`
- **Demo use:** CodeQL should flag this. Also good for PR review.

### Sec #2 — Hardcoded API key in source
- **File:** `backend/src/middleware/auth.ts` ~line 16
- **What:** `const API_KEY = "sk_live_demo_4f8a2b1c9d3e7f6a0b5c8d2e"` — a credential committed to source. Secret scanning should flag the `sk_live_` prefix pattern.
- **Demo use:** GitHub secret scanning demo.

### Sec #3 — API key committed to version control
- **File:** `backend/src/middleware/auth.ts`
- **What:** Even though the key is fake, committing anything that looks like a credential is a finding. Demonstrates why `.env` + `.gitignore` matter.
- **Demo use:** Dependency alert / secret scanning demo.

### Sec #4 — No rate limiting on auth
- **File:** `backend/src/middleware/auth.ts` ~line 19
- **What:** The API key check has no rate limiting or account lockout. An attacker could brute-force the key with unlimited requests.
- **Demo use:** Copilot PR review or manual discussion point.

---

## Intentionally Missing Test Coverage

| Gap | File | Purpose |
|-----|------|---------|
| No test for email without `@` | `tests/riskScoring.test.ts` | Show Copilot generating missing edge-case tests |
| No test for cancelling a delivered order | `tests/orders.test.ts` | Show Copilot identifying untested state transitions |
| No test for negative quantity | `tests/riskScoring.test.ts` | Show test generation from Copilot chat |
| No test for SQL injection | `tests/orders.test.ts` | Show security-focused test generation |
| No frontend tests at all | `frontend/` | Discuss testing strategy with Copilot |

---

## How to Use During the Webinar

1. **PR Review demo:** Create a branch, "fix" one bug, open a PR, and show Copilot review catching the other issues.
2. **Explain code:** Open `riskScoring.ts` and ask Copilot to explain the nested scoring logic.
3. **CodeQL demo:** Push to a fork with GitHub Advanced Security enabled — the SQL injection should trigger.
4. **Secret scanning:** The `sk_live_` prefixed key should trigger a secret scanning alert.
5. **Docs automation:** Open a PR and watch the `docs-automation.yml` workflow produce a diff summary.
6. **Test generation:** Ask Copilot to generate the missing edge-case tests listed above.
