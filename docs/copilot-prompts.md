# Copilot Prompt Playbook — Webinar Edition

> **Audience:** Webinar presenter and attendees.
> Each prompt is designed for use with the `order-radar-demo` repository.
> Prompts are written for GitHub Copilot Chat, Copilot PR review, or Copilot CLI — noted per section.

---

## Table of Contents

1. [PR Description Generation](#1-pr-description-generation)
2. [PR Review — Correctness Pass](#2-pr-review--correctness-pass)
3. [PR Review — Performance Pass](#3-pr-review--performance-pass)
4. [PR Review — Security Pass](#4-pr-review--security-pass)
5. [Explain Complex Diff in 3 Layers](#5-explain-complex-diff-in-3-layers)
6. [Generate Regression Tests from Diff](#6-generate-regression-tests-from-diff)
7. [Docs Automation (Release Notes + API Docs Delta)](#7-docs-automation-release-notes--api-docs-delta)
8. [Explain a CodeQL Alert and Propose Fix](#8-explain-a-codeql-alert-and-propose-fix)

---

## 1. PR Description Generation

**Use with:** Copilot Chat in PR creation view, or paste into Copilot Chat with the diff attached.

### The Prompt

```
You are a senior engineer writing a pull request description for human reviewers.

Analyze the diff for the branch `feature/cancel-order-with-reason-and-ops-note`
compared to `develop`.

Produce a PR description with these exact sections:

## Summary
One paragraph (3-5 sentences) explaining WHAT changed and WHY.

## Changes
A bullet list grouped by area (backend, frontend, tests, config).
Each bullet: file path → one-sentence description of what changed.

## How to Test
Numbered steps a reviewer can follow to verify the change manually.
Include at least one curl/HTTP example for the backend.

## Risks & Open Questions
Bullet list of anything the author should flag — missing tests, edge cases,
breaking changes, or known trade-offs. If none, write "None identified."

Constraints:
- Do NOT invent changes that are not in the diff.
- Use present tense ("adds", "removes", not "added").
- Keep each bullet under 120 characters.
- If a file is renamed or deleted, say so explicitly.
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **Role assignment** | "senior engineer writing a PR description" anchors the tone — professional, concise, reviewer-oriented. |
| **Explicit section headings** | Forces structured output. Without them, Copilot tends to emit a wall of text. |
| **Grouping instruction** | "grouped by area (backend, frontend, tests, config)" prevents a flat list of 12 files with no organisation. |
| **Negative constraint** | "Do NOT invent changes" prevents hallucination — LLMs will sometimes pad summaries with plausible but nonexistent changes. |
| **Character limit per bullet** | Keeps bullets scannable on GitHub's PR page. |
| **"How to Test" section** | Reviewers routinely skip PRs that don't explain verification. The prompt forces it. |
| **"Risks" section** | Trains the model to surface what it's uncertain about rather than hiding it. |

### Expected Output Structure

```markdown
## Summary
Adds an optional `reason` field to the cancel-order endpoint. When provided,
the backend auto-generates an ops note attached to the order…

## Changes
**Backend**
- `backend/src/services/orderService.ts` → Accepts `reason` param, creates ops note on cancel
- `backend/src/routes/orders.ts` → Passes `reason` from request body, adds try-catch
- `backend/src/types.ts` → Adds `CancelOrderRequest` interface
…

## How to Test
1. Start the dev server: `npm run dev`
2. Cancel an order with reason:
   ```bash
   curl -X POST http://localhost:3001/api/orders/<id>/cancel \
     -H "Content-Type: application/json" \
     -d '{"reason":"Customer requested"}'
   ```
3. Verify the response contains `{ order: {...}, note: {...} }`
…

## Risks & Open Questions
- The ops note uses `order.customerEmail` as the `author` field — should this be `"system"` instead?
- `docs/api.md` is not updated to reflect the new `reason` field.
```

### Weak Version (to demonstrate)

```
Summarize this PR.
```

**Why it's weak:**
- No role → generic tone
- No output structure → unpredictable formatting
- No constraints → may hallucinate changes
- No reviewer focus → reads like a commit message, not a PR description

### Improved Version (shown above)

The full prompt adds: role, exact section headings, grouping rules, negative constraints, output format, and a "Risks" section that encourages the model to self-audit.

---

## 2. PR Review — Correctness Pass

**Use with:** Copilot PR review, or Copilot Chat with specific files attached.

### The Prompt

```
You are a senior backend engineer performing a correctness-only code review.

Review the changed files in this PR for:
1. Logic errors — wrong conditions, off-by-one, missing edge cases
2. State machine violations — invalid status transitions, missing guards
3. Error handling gaps — unhandled exceptions, missing try-catch, silent failures
4. Data integrity — operations that should be atomic but aren't, missing validation

For each finding, provide:
- **File & line**: exact location
- **Issue**: one-sentence description
- **Severity**: 🔴 bug (will break in production) | 🟡 issue (incorrect under edge cases) | 🟢 nit
- **Suggested fix**: 2-4 lines of corrected code

Ignore performance, style, naming, and security — those are separate passes.
Do not comment on code that is correct. Only flag real bugs.
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **Single-pass scoping** | "correctness-only" prevents Copilot from diluting findings across 4 categories. Focused passes find more issues per category. |
| **Numbered checklist** | The 4 sub-categories (logic, state machine, error handling, data integrity) act as a mental framework the model follows sequentially. |
| **Structured output per finding** | Prevents vague comments like "this might be a problem." Forces file, line, description, severity, and fix. |
| **Severity emoji scale** | Gives reviewers instant visual triage. Without it, every finding reads as equal. |
| **Negative scoping** | "Ignore performance, style, naming, and security" prevents comment noise and keeps the pass focused. |
| **"Only flag real bugs"** | Suppresses the model's tendency to pad output with nits to appear thorough. |

### Expected Output Structure

```markdown
### 🔴 Bug — `backend/src/services/orderService.ts` L76

**Issue:** `addNoteToOrder` uses `order.customerEmail` as the `author` parameter.
Ops notes should be attributed to `"system"` or the authenticated user, not the
customer's email.

**Suggested fix:**
```ts
opsNote = addNoteToOrder(id, uuid(), "system", `Order cancelled: ${reason}`);
```

---

### 🟡 Issue — `backend/src/services/riskScoring.ts` L74

**Issue:** `e.split("@")[1]` returns `undefined` when the email contains no `@`.
…
```

### Weak Version

```
Review this code for bugs.
```

**Why it's weak:**
- No role → Copilot defaults to "helpful assistant" tone instead of "experienced reviewer"
- "Bugs" is unbounded → mixes style nits, perf opinions, and security concerns
- No output structure → findings are unstructured paragraphs
- No severity → no way to triage

### Improved Version

The full prompt above. The key upgrades: single-category scoping, checklist of sub-categories, per-finding output schema with severity, and explicit exclusions.

---

## 3. PR Review — Performance Pass

**Use with:** Copilot PR review, or Copilot Chat with files attached.

### The Prompt

```
You are a performance-focused reviewer for a Node.js + React application.

Review the changed files for performance issues only. Check for:
1. Unnecessary or duplicate I/O — redundant DB queries, N+1 patterns, missing batching
2. Missing caching or memoization — recomputed values that could be cached
3. Frontend render waste — allocations inside render (new objects/dates per row),
   missing React.memo, missing useMemo/useCallback, missing debounce on user input
4. Algorithmic issues — O(n²) where O(n) is possible, linear scans on large sets

For each finding:
- **File & line**: exact location
- **Impact**: estimated effect (e.g., "8 API calls per search instead of 1")
- **Severity**: 🔴 measurable in production | 🟡 noticeable at scale | 🟢 micro-optimization
- **Fix**: concrete code change (not just "consider optimizing")

Ignore correctness, security, and style. Only flag performance issues.
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **Tech stack declaration** | "Node.js + React" gives the model the right perf heuristics — it won't suggest Java-specific patterns. |
| **4-category checklist** | Covers backend I/O, caching, frontend rendering, and algorithms — the 4 most common performance problem families. |
| **"Impact" field** | Forces the model to quantify: "8 API calls per search" is actionable; "this could be slow" is not. |
| **"Concrete code change"** | Prevents recommendations like "consider using memoization" without showing how. |
| **Exclusion clause** | Keeps the pass clean — no correctness or security comments leaking in. |

### Expected Output Structure

```markdown
### 🔴 Measurable — `frontend/src/pages/OrdersListPage.tsx` L42

**Impact:** Every keystroke in the search box triggers a full API request. Typing
a 6-character query fires 6 sequential network requests.

**Fix:**
```tsx
const [rawSearch, setRawSearch] = useState("");
const debouncedSearch = useDebounce(rawSearch, 300);
// use debouncedSearch in the fetch effect instead of rawSearch
```

---

### 🟡 At scale — `backend/src/services/orderService.ts` L32-44

**Impact:** Two separate SQLite queries per page load (COUNT then SELECT).
On 520 rows this is trivial; on 500 k rows the double scan is measurable.

**Fix:**
```sql
SELECT *, COUNT(*) OVER() AS _total FROM orders WHERE … LIMIT ? OFFSET ?
```
```

### Weak Version

```
Are there any performance issues in this code?
```

**Why it's weak:**
- Yes/no question invites a one-word answer
- No checklist → model picks whatever comes to mind first
- No output structure → paragraph of general advice
- No severity → "micro-optimization" and "production bottleneck" treated equally

### Improved Version

The full prompt above. Key upgrades: scoped review, tech-stack context, 4-category framework, quantified impact, severity scale, and concrete code fixes.

---

## 4. PR Review — Security Pass

**Use with:** Copilot PR review, or Copilot Chat with files attached.

### The Prompt

```
You are a security engineer performing a focused security review of a
Node.js/Express backend and React frontend.

Review the changed files for security vulnerabilities only. Check for:
1. Injection — SQL injection, XSS, command injection, template injection
2. Authentication & authorization — missing auth middleware, privilege escalation,
   broken access control on write operations
3. Secrets management — hardcoded credentials, API keys in source, secrets in logs
4. Data exposure — PII in logs, overly verbose error messages, sensitive data in
   client responses

For each finding:
- **File & line**: exact location
- **CWE**: the Common Weakness Enumeration ID (e.g., CWE-89 for SQL injection)
- **Severity**: 🔴 critical (exploitable now) | 🟡 high (needs specific conditions) | 🟢 medium
- **Proof of concept**: a one-line curl command or payload that demonstrates the issue
- **Fix**: minimal code change that closes the vulnerability without breaking functionality

Ignore performance, style, and correctness. Only flag security issues.
Do not suggest "defense in depth" improvements unless there is a concrete vulnerability.
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **"Security engineer" role** | Shifts the model from "helpful coding assistant" to adversarial mindset — it looks for exploits, not suggestions. |
| **4 OWASP-aligned categories** | Injection, auth, secrets, data exposure cover the top web app vulnerability families. |
| **CWE requirement** | Forces precise classification. Without it, the model says "this is a security issue" — with it, the model says "CWE-89: SQL Injection." |
| **Proof of concept** | The most powerful constraint. Forces the model to demonstrate exploitability, not just theorise about risk. If it can't write a PoC, it's probably not a real finding. |
| **"Minimal code change"** | Prevents suggestions like "rewrite the entire auth layer." A good security fix is surgical. |
| **Last negative constraint** | "Don't suggest defense-in-depth unless concrete vulnerability" suppresses noise like "you should add rate limiting, CSP headers, HSTS…" when reviewing a single PR. |

### Expected Output Structure

```markdown
### 🔴 Critical — SQL Injection — `backend/src/services/orderService.ts` L28

**CWE:** CWE-89 (Improper Neutralization of Special Elements in SQL)

**Proof of concept:**
```bash
curl "http://localhost:3001/api/orders?search=' OR 1=1 --"
```
Returns all 520 orders regardless of filter.

**Fix:**
```ts
conditions.push("(customerName LIKE ? OR product LIKE ?)");
params.push(`%${search}%`, `%${search}%`);
```

---

### 🟡 High — Missing Auth on Write Endpoint — `backend/src/routes/orders.ts` L41

**CWE:** CWE-862 (Missing Authorization)
…
```

### Weak Version

```
Check this code for security issues.
```

**Why it's weak:**
- No adversarial role → model acts like a friendly tutor, not an attacker
- No categories → may only check one type (usually injection)
- No PoC → findings are theoretical
- No CWE → no way to look up severity or remediation guidance
- No output structure → paragraph of mixed concerns

### Improved Version

The full prompt above. Key upgrades: security engineer role, OWASP-aligned checklist, CWE classification, proof-of-concept requirement, minimal fix constraint, and noise suppression.

---

## 5. Explain Complex Diff in 3 Layers

**Use with:** Copilot Chat, with the file `riskScoring.ts` open or the diff attached.

### The Prompt

```
Explain the logic in `backend/src/services/riskScoring.ts` at three levels of
depth. Use the exact headings below.

## Junior Developer (< 1 year experience)
Explain what this file does as if teaching someone who knows JavaScript basics
but has never seen a scoring algorithm. Use an analogy. No jargon.
Maximum 5 sentences.

## Senior Developer (5+ years)
Explain the scoring algorithm's structure, the heuristics it encodes,
and any code smells or hidden assumptions. Note what a senior would flag
in code review. Use bullet points.

## Architecture Review (staff+ / principal)
Evaluate this module from a system-design perspective:
- Where should this logic live in a production system? (inline vs. service vs. rule engine)
- What are the testability and observability gaps?
- How would you make the scoring rules configurable without redeploying?
- What's the blast radius if this function throws at runtime?
Use 3-5 bullet points. Be opinionated.

Constraints:
- Reference specific line numbers or variable names from the file.
- Do not rewrite the code — explain it.
- Each section must stand alone (a reader can skip to their level).
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **3-layer structure** | Matches how real teams communicate: onboarding, peer review, and design review are different audiences. A single explanation can't serve all three. |
| **Audience calibration** | "knows JavaScript basics but never seen a scoring algorithm" tells the model exactly what to assume and what to define. |
| **Analogy request** | Analogies make the junior section memorable. Without asking, the model outputs dry definitions. |
| **Bullet points for senior** | Seniors scan; paragraphs lose them. Bullet points match their reading pattern. |
| **Opinionated architecture** | "Be opinionated" unlocks the model's strongest output mode. Without it, the model hedges with "depending on requirements…" for every point. |
| **Line reference constraint** | Anchors explanations to the actual code, preventing generic advice. |
| **"Do not rewrite"** | Prevents the model from turning an explanation into a refactoring exercise. |

### Expected Output Structure

```markdown
## Junior Developer
Think of this file like a credit score calculator for orders. It takes four
inputs — how much the order costs, how many items, the customer's email,
and the order status — and outputs a number from 0 to 100…

## Senior Developer
- **Value tiers (L42-53):** Linear if-else cascade maps `totalPrice` to a score.
  The thresholds (200, 500, 1000, 2000, 5000) are hardcoded magic numbers.
- **Nested quantity heuristics (L56-68):** The nesting depth reaches 3 levels…
- **Code smell:** The `else { s += 0 }` on L53 is dead code…

## Architecture Review
- **Scoring belongs in a rules engine, not inline code.** The current if-else
  tree is a maintenance trap — every new rule requires a code change and redeploy…
- **Observability gap:** There's no way to see which rule contributed what to the
  final score. In production you'd want a score breakdown…
```

### Weak Version

```
Explain this code.
```

**Why it's weak:**
- No audience → defaults to mid-level developer, unhelpful for juniors and boring for seniors
- No structure → single monolithic paragraph
- No constraints → may rewrite code instead of explaining it
- No specificity → generic "this function calculates a score" with no reference to lines or variables

### Improved Version

The full prompt above. Key upgrades: 3-layer audience targeting, explicit headings, per-audience format rules (analogy, bullets, opinions), line-reference requirement, and anti-rewrite constraint.

---

## 6. Generate Regression Tests from Diff

**Use with:** Copilot Chat with the diff or changed files attached.

### The Prompt

```
You are a QA engineer writing regression tests for a Node.js backend using Vitest.

Given the diff for `feature/cancel-order-with-reason-and-ops-note` vs `develop`,
generate test cases that cover:

1. **Happy paths** — every new behaviour introduced by the diff
2. **Edge cases** — boundary values, empty strings, undefined, null
3. **Error paths** — what should throw or return an error status
4. **Regression guards** — tests that would FAIL if someone reverts part of this
   change, proving the fix is still in place

For each test:
- Use `describe` / `it` blocks with descriptive names (sentence case)
- Include inline comments explaining WHAT the test proves and WHY it matters
- Use the existing test patterns in `backend/tests/orders.test.ts` as a style guide
- Assume `seedDatabase(50)` runs in `beforeAll` (already set up)

Output a single TypeScript file (`cancel-reason.test.ts`) that I can drop into
`backend/tests/` and run immediately with `npx vitest run`.

Do not mock the database — use the real in-memory SQLite (same as existing tests).
Do not import from node:test — use vitest imports only.
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **"QA engineer" role** | Shifts from "write a test" to "think about what can break" — adversarial testing mindset. |
| **4-category framework** | Happy, edge, error, regression — ensures coverage across the behaviour spectrum, not just the happy path. |
| **"Regression guards" category** | Unique and valuable: tests that would fail if the change is reverted. This is the highest-value test type for PR confidence. |
| **Style guide reference** | "Use existing patterns in orders.test.ts" ensures generated tests match the codebase conventions. Without it, every generation uses a different style. |
| **"Drop in and run" constraint** | Forces the output to be complete: correct imports, no placeholders, no `// TODO`. |
| **Anti-mock constraint** | Matches the existing test strategy (real in-memory SQLite). Without it, the model may generate mock-heavy tests that test nothing. |
| **Vitest-only constraint** | Prevents the model from mixing in `jest` or `node:test` APIs. |

### Expected Output Structure

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { seedDatabase } from "../src/seed.js";
import {
  listOrders,
  cancelOrder,
  StatusTransitionError,
  getNotesForOrder,
} from "../src/services/orderService.js";

beforeAll(() => {
  seedDatabase(50);
});

describe("cancelOrder with reason", () => {
  it("creates an ops note containing the reason text", () => {
    const pending = listOrders(1, 100, "pending");
    const result = cancelOrder(pending.data[0].id, "Customer changed mind");
    expect(result?.note).toBeDefined();
    expect(result?.note?.content).toContain("Customer changed mind");
  });

  it("does not create a note when no reason is provided", () => {
    // Edge case: reason is undefined
    const pending = listOrders(1, 100, "pending");
    const result = cancelOrder(pending.data[1].id);
    expect(result?.note).toBeUndefined();
  });

  it("throws StatusTransitionError for cancelled orders", () => {
    // Regression guard: if the terminal-status check is removed, this fails
    const cancelled = listOrders(1, 100, "cancelled");
    expect(() => cancelOrder(cancelled.data[0].id)).toThrow(StatusTransitionError);
  });

  // ...more tests
});
```

### Weak Version

```
Write tests for the cancel order feature.
```

**Why it's weak:**
- No role → generic "helper" tests that exercise happy path only
- No framework specified → might generate Jest tests in a Vitest project
- No structure → flat list of tests with no clear coverage strategy
- No style guide → inconsistent with existing tests
- No "drop-in" constraint → may output snippets that need manual assembly

### Improved Version

The full prompt above. Key upgrades: QA role, 4-category coverage framework, regression-guard concept, style guide reference, runnable file output, and tech-stack constraints.

---

## 7. Docs Automation (Release Notes + API Docs Delta)

**Use with:** Copilot Chat or a GitHub Actions workflow that feeds the diff to Copilot.

### The Prompt

```
You are a technical writer generating two documents from a PR diff.

Analyze the diff for `feature/cancel-order-with-reason-and-ops-note` vs `develop`
and produce:

## 1. Release Notes Entry
Write a user-facing changelog entry using this exact format:

### [Feature] Cancel Order with Reason (PR #XX)
- **What changed:** (1-2 sentences, user perspective)
- **New behaviour:** (bullet list of observable changes)
- **Breaking changes:** (list any, or "None")
- **Migration steps:** (list any, or "None required")

Use present tense. Write for API consumers, not contributors.

## 2. API Docs Delta
Show the exact additions/modifications needed in `docs/api.md`:
- Use diff format (```diff blocks) showing lines to add/change
- Include the new request body schema for `POST /orders/:id/cancel`
- Update any response schemas that changed shape
- Add any new error responses (409, etc.)

Constraints:
- Do not reproduce the entire api.md — only show the delta.
- If a field is optional, mark it with `(optional)` in the schema.
- Include a curl example for each changed endpoint.
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **"Technical writer" role** | Shifts from developer-speak to user/consumer-speak. Release notes should say "you can now" not "we added." |
| **Two-document output** | A single prompt producing two related but distinct artifacts. Splitting into separate prompts would lose the shared context. |
| **Exact format for release notes** | Changelog entries need consistency. The template enforces What/New/Breaking/Migration — the 4 things every consumer needs. |
| **Diff format for API docs** | Showing a delta (not the full file) is practical — the presenter applies it directly. |
| **"API consumers, not contributors"** | Critical audience distinction. Without it, release notes read like commit messages. |
| **Optional field marking** | Prevents confusion about whether `reason` is required or optional. |
| **Curl example requirement** | API docs without examples are incomplete. This forces actionable documentation. |

### Expected Output Structure

```markdown
## 1. Release Notes Entry

### [Feature] Cancel Order with Reason (PR #42)
- **What changed:** The cancel-order endpoint now accepts an optional `reason`
  field. When provided, the system auto-creates an ops note attached to the order.
- **New behaviour:**
  - `POST /orders/:id/cancel` accepts `{ "reason": "..." }` in the request body
  - Response shape changed from `Order` to `{ order: Order, note?: OrderNote }`
  - Cancelling a delivered, cancelled, or returned order now returns `409 Conflict`
- **Breaking changes:** Response shape of `POST /orders/:id/cancel` changed
  (now wrapped in `{ order, note }`)
- **Migration steps:** Update client code to read `response.order` instead of
  using the response directly as an Order.

## 2. API Docs Delta

```diff
 ### `POST /api/orders/:id/cancel`

-Cancel an order. No request body needed.
+Cancel an order with an optional reason.

-**Response:** Updated `Order` object or `404`.
+**Request body:**
+```json
+{
+  "reason": "Customer requested cancellation"  // (optional)
+}
+```
+
+**Response (200):**
+```json
+{
+  "order": { ... },
+  "note": { "id": "...", "content": "Order cancelled: ...", ... }
+}
+```
+
+**Error responses:**
+| Status | Body | When |
+|--------|------|------|
+| `404` | `{ "error": "Order not found" }` | Invalid order ID |
+| `409` | `{ "error": "Cannot cancel order in \"delivered\" status" }` | Terminal status |
```
```

### Weak Version

```
Write release notes and update the API docs for this PR.
```

**Why it's weak:**
- No role → developer tone instead of consumer-facing
- No format → unstructured paragraphs
- No "delta" instruction → may rewrite the entire api.md
- No breaking-change section → consumers miss critical info
- No curl examples → documentation without examples

### Improved Version

The full prompt above. Key upgrades: technical writer role, two-document structure, exact release note template, diff-format for API delta, audience specification, and curl requirement.

---

## 8. Explain a CodeQL Alert and Propose Fix

**Use with:** Copilot Chat with the alert details and the flagged file open.

### The Prompt

```
You are a security engineer explaining a CodeQL alert to a mid-level developer
who has not worked with static analysis before.

Alert details:
- Rule: js/sql-injection
- File: backend/src/services/orderService.ts
- Line: 28 (inside `listOrders`)
- Message: "This query depends on a user-provided value."

Produce your response in these exact sections:

## What CodeQL Found
Explain the alert in plain English. What is the dangerous data flow?
Trace it from the HTTP request to the SQL query, naming the exact variables.

## Why It Matters
Explain the real-world impact. Include:
- A concrete exploit payload (e.g., a malicious `search` value)
- What an attacker could achieve (data exfiltration, auth bypass, etc.)
- The CWE number and OWASP Top 10 category

## The Fix
Show the minimal code change that closes the vulnerability.
- Show a BEFORE and AFTER code block
- The fix must use parameterised queries (? placeholders), not escaping/sanitisation
- The fix must not break existing functionality or tests

## Verification
How to confirm the fix works:
1. A curl command that demonstrates the exploit BEFORE the fix
2. The same curl command showing safe behaviour AFTER the fix
3. Which existing tests to re-run to confirm nothing broke

Constraints:
- Do not suggest ORMs, query builders, or architectural rewrites.
- The fix should be ≤ 5 changed lines.
- Write for a developer who will apply this fix in 5 minutes, not for a security textbook.
```

### Why It Works

| Technique | What it does |
|-----------|-------------|
| **Audience calibration** | "mid-level developer who has not worked with static analysis" — the model won't assume knowledge of data flow analysis or CWE taxonomy, but won't over-simplify either. |
| **Alert details injection** | Providing the exact rule, file, line, and message prevents the model from guessing which alert we mean. |
| **"Trace the data flow"** | The most valuable part of explaining a SAST alert. Without this instruction, the model says "user input reaches a SQL query" without showing the path. |
| **Exploit payload requirement** | Moves from theoretical to practical. A developer who sees `?search=' OR 1=1 --` returning all 520 orders understands the severity instantly. |
| **BEFORE/AFTER blocks** | The most actionable format for a fix. The developer can literally diff the blocks. |
| **"Not escaping/sanitisation" constraint** | Prevents the model from suggesting `input.replace(/'/g, "''")` — the wrong fix for SQL injection. Parameterised queries are the only correct answer. |
| **Verification section** | Closes the loop: the developer can prove the fix works without relying on re-running CodeQL (which is slow). |
| **"5 minutes" constraint** | Prevents scope creep. The answer should be surgical, not a refactoring plan. |
| **"No ORM" constraint** | Matches the repo's actual tech (raw better-sqlite3). Suggesting Prisma or Knex is technically correct but impractical for a 5-minute fix. |

### Expected Output Structure

```markdown
## What CodeQL Found
The `search` query parameter arrives from the HTTP request at
`routes/orders.ts` L17, is passed to `listOrders()` at L21, and on
`orderService.ts` L28 is interpolated directly into a SQL string:

```ts
conditions.push(`(customerName LIKE '%${search}%' OR product LIKE '%${search}%')`);
```

This creates a tainted data flow: user input → SQL string → `db.prepare().get()`.

## Why It Matters
An attacker can send:
```
GET /api/orders?search=' OR 1=1 --
```
This returns all 520 orders regardless of filter, bypassing pagination.
A more targeted payload could extract data from other tables via UNION injection.

- **CWE-89:** Improper Neutralization of Special Elements used in an SQL Command
- **OWASP Top 10:** A03:2021 — Injection

## The Fix

**Before:**
```ts
conditions.push(`(customerName LIKE '%${search}%' OR product LIKE '%${search}%')`);
```

**After:**
```ts
conditions.push("(customerName LIKE ? OR product LIKE ?)");
params.push(`%${search}%`, `%${search}%`);
```

## Verification
1. Before fix: `curl "http://localhost:3001/api/orders?search=' OR 1=1 --"` → returns all orders
2. After fix: same curl → returns 0 results (no orders match the literal string)
3. Run `npm test` — all 17 tests should still pass
```

### Weak Version

```
Explain this CodeQL alert and fix it.
```

**Why it's weak:**
- No alert details → model guesses which alert
- No audience → explanation too technical or too superficial
- No output structure → paragraphs mixing explanation and fix
- No data flow trace → "user input in SQL" with no path
- No exploit payload → abstract threat, no urgency
- No verification → developer applies fix blindly

### Improved Version

The full prompt above. Key upgrades: alert context injection, audience calibration, mandatory data flow trace, exploit payload, CWE/OWASP references, BEFORE/AFTER format, parameterised-query constraint, and verification steps.

---

## Prompt Engineering Principles — Quick Reference

These 8 prompts all apply the same core techniques. Use this table as a cheat sheet:

| Principle | What it does | Example from these prompts |
|-----------|-------------|---------------------------|
| **Role assignment** | Sets tone and expertise level | "security engineer", "QA engineer", "technical writer" |
| **Scoped passes** | Focus on one concern per prompt | "correctness-only", "performance issues only", "security vulnerabilities only" |
| **Structured output** | Exact headings and field names | `## Summary`, `**File & line:**`, `**CWE:**` |
| **Negative constraints** | Suppress noise and hallucination | "Do NOT invent changes", "Ignore performance and style", "Do not suggest ORMs" |
| **Audience calibration** | Match depth to reader | "junior dev who knows JS basics", "API consumers, not contributors" |
| **Example requirements** | Force actionable output | "Include a curl example", "proof of concept payload" |
| **Severity scales** | Enable triage | 🔴🟡🟢 with definitions per prompt |
| **Anti-hedge clause** | Get opinionated answers | "Be opinionated", "Only flag real bugs" |
