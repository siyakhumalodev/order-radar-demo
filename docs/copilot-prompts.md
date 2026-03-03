# Copilot Prompt Playbook — Webinar Demo Script

> **For:** Webinar presenter. Follow the numbered steps in order.
> Each step has a **Setup** (what to do/show), a **Prompt** (copy-paste into Copilot), and **Talking Points** (what to tell the audience).
> All prompts target the `order-radar-demo` repository on branch `feature/cancel-order-with-reason-and-ops-note` compared to `develop`.

---

## Pre-Demo Checklist

- [ ] Clone the repo and check out branch `feature/cancel-order-with-reason-and-ops-note`
- [ ] Run `npm run install:all` to install all dependencies
- [ ] Run `npm run dev` and confirm both servers start (frontend :5173, backend :3001)
- [ ] Open the repo in VS Code with the GitHub Copilot extension installed
- [ ] Open a browser tab to the GitHub PR creation page (or an existing PR for this branch → `develop`)
- [ ] Have `docs/demo-seeded-issues.md` open in a separate tab as your cheat sheet

---

## Table of Contents

| Step | Topic | Time Est. |
|------|-------|-----------|
| [1](#step-1--pr-description-generation) | PR Description Generation | 5 min |
| [2](#step-2--pr-review--correctness-pass) | PR Review — Correctness Pass | 5 min |
| [3](#step-3--pr-review--performance-pass) | PR Review — Performance Pass | 5 min |
| [4](#step-4--pr-review--security-pass) | PR Review — Security Pass | 5 min |
| [5](#step-5--explain-complex-code-in-3-layers) | Explain Complex Code in 3 Layers | 5 min |
| [6](#step-6--generate-regression-tests-from-diff) | Generate Regression Tests from Diff | 5 min |
| [7](#step-7--docs-automation-release-notes--api-docs-delta) | Docs Automation (Release Notes + API Docs Delta) | 5 min |
| [8](#step-8--explain-a-codeql-alert-and-propose-fix) | Explain a CodeQL Alert and Propose Fix | 5 min |
| [Ref](#prompt-engineering-principles--quick-reference) | Prompt Engineering Principles — Quick Reference | — |

---

## Step 1 — PR Description Generation

### 1.1 Setup

1. Open the GitHub PR creation page for `feature/cancel-order-with-reason-and-ops-note` → `develop`.
2. Open Copilot Chat in the PR creation view (or in VS Code with the diff context).

### 1.2 Prompt (copy-paste)

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

### 1.3 What to expect

Copilot should produce a structured PR description with 4 sections. Look for:

- **Summary** — mentions the optional `reason` field and ops-note auto-creation.
- **Changes** — grouped under Backend / Frontend / Tests headings.
- **How to Test** — includes a `curl` command to cancel with a reason.
- **Risks** — may flag missing `docs/api.md` updates or the `customerEmail`-as-author issue.

### 1.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **Role assignment** | "senior engineer writing a PR description" anchors tone — professional, concise, reviewer-oriented. |
| **Explicit section headings** | Forces structured output. Without them, Copilot returns a wall of text. |
| **Grouping instruction** | "grouped by area" prevents a flat list of 12 files with no organisation. |
| **Negative constraint** | "Do NOT invent changes" prevents hallucination. |
| **"Risks" section** | Trains the model to self-audit rather than hiding uncertainty. |

### 1.5 Weak version (show for contrast)

```
Summarize this PR.
```

Why it's weak: no role, no output structure, no constraints, no reviewer focus. The result reads like a commit message, not a PR description.

---

## Step 2 — PR Review — Correctness Pass

### 2.1 Setup

1. Open the PR for this branch on GitHub, or open Copilot Chat in VS Code.
2. Attach the changed files to the conversation (or use the PR review context).

> **Cheat sheet:** This prompt should find **BUG-01** (cancel without status guard), **BUG-02** (missing try-catch), and **BUG-03** (email without `@`). See `docs/demo-seeded-issues.md`.

### 2.2 Prompt (copy-paste)

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

### 2.3 What to expect

| Seeded Issue | What Copilot should find |
|--------------|--------------------------|
| **BUG-01** | `cancelOrder()` sets status to `cancelled` regardless of current status — delivered/cancelled orders can be cancelled again. |
| **BUG-02** | `POST /:id/cancel` handler has no `try-catch` — an unexpected DB error crashes the Node process. |
| **BUG-03** | `e.split("@")[1]` returns `undefined` for emails without `@` — malformed emails silently score as "custom domain" (+4 risk). |

### 2.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **Single-pass scoping** | "correctness-only" prevents diluting findings across categories. Focused passes find **more** per category. |
| **Numbered checklist** | The 4 sub-categories act as a mental framework the model follows sequentially. |
| **Severity emoji scale** | Gives reviewers instant visual triage — without it every finding reads as equal. |
| **"Only flag real bugs"** | Suppresses the model's tendency to pad output with nits to appear thorough. |
| **Negative scoping** | "Ignore performance, style, naming, and security" prevents comment noise. |

### 2.5 Weak version (show for contrast)

```
Review this code for bugs.
```

Why it's weak: "bugs" is unbounded (mixes style/perf/security), no output structure, no severity scale, no role.

---

## Step 3 — PR Review — Performance Pass

### 3.1 Setup

1. Stay in the same PR or Copilot Chat session.
2. Start a **new conversation** so findings don't bleed between passes.

> **Cheat sheet:** This prompt should find **PERF-01** (double query), **PERF-02** (search debounce), and **PERF-03** (inline allocations in render). See `docs/demo-seeded-issues.md`.

### 3.2 Prompt (copy-paste)

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

### 3.3 What to expect

| Seeded Issue | What Copilot should find |
|--------------|--------------------------|
| **PERF-01** | Two separate queries per page (COUNT then SELECT). On large datasets, doubles I/O. |
| **PERF-02** | Search `<input>` fires an API request on every keystroke — typing "keyboard" sends 8 requests. |
| **PERF-03** | `new Date().toLocaleDateString()` called inline per row per render; inline style objects re-created each render. |

### 3.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **Tech stack declaration** | "Node.js + React" gives the model the right perf heuristics — it won't suggest Java patterns. |
| **4-category checklist** | Covers backend I/O, caching, frontend rendering, and algorithms — the top perf problem families. |
| **"Impact" field** | Forces quantification: "8 API calls per search" is actionable; "this could be slow" is not. |
| **"Concrete code change"** | Prevents vague "consider using memoization" recommendations. |

### 3.5 Weak version (show for contrast)

```
Are there any performance issues in this code?
```

Why it's weak: yes/no question invites a one-word answer, no checklist, no output structure, no severity.

---

## Step 4 — PR Review — Security Pass

### 4.1 Setup

1. Start a **new conversation** in Copilot Chat.
2. Attach the changed files or use the PR context.

> **Cheat sheet:** This prompt should find **SEC-01** (SQL injection), **SEC-02** (hardcoded credential), **SEC-03** (missing auth on cancel), and **SEC-04** (PII in logs). See `docs/demo-seeded-issues.md`.

### 4.2 Prompt (copy-paste)

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

### 4.3 What to expect

| Seeded Issue | What Copilot should find |
|--------------|--------------------------|
| **SEC-01** | `search` parameter string-interpolated into SQL WHERE clause. Payload: `?search=' OR 1=1 --` returns all 520 orders. |
| **SEC-02** | Hardcoded credential `sk_live_demo_…` in `middleware/auth.ts`. Secret scanning should flag the `sk_live_` prefix. |
| **SEC-03** | `POST /:id/cancel` has no authentication middleware — write operation is unprotected. |
| **SEC-04** | On successful cancel, the full order object (including `customerEmail` and `shippingAddress`) is logged to stdout — PII leak. |

### 4.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **"Security engineer" role** | Shifts the model from "helpful assistant" to adversarial mindset — it looks for exploits, not suggestions. |
| **OWASP-aligned categories** | Injection, auth, secrets, data exposure cover the top vulnerability families. |
| **CWE requirement** | Forces precise classification, not just "this is a security issue." |
| **Proof of concept** | The most powerful constraint — forces the model to demonstrate exploitability. If it can't write a PoC, it's probably not a real finding. |
| **"Minimal code change"** | Prevents suggestions like "rewrite the entire auth layer." Good security fixes are surgical. |
| **Last negative constraint** | "Don't suggest defense-in-depth unless concrete vulnerability" suppresses noise like "add rate limiting, CSP headers, HSTS…" |

### 4.5 Weak version (show for contrast)

```
Check this code for security issues.
```

Why it's weak: no adversarial role, no categories (may only check injection), no PoC, no CWE, no output structure.

---

## Step 5 — Explain Complex Code in 3 Layers

### 5.1 Setup

1. Open `backend/src/services/riskScoring.ts` in VS Code.
2. Open Copilot Chat with the file in context.
3. Point out to the audience: this file is intentionally written in "legacy" style with nested conditionals and magic numbers.

### 5.2 Prompt (copy-paste)

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

### 5.3 What to expect

Copilot should produce three distinct sections:

- **Junior** — an analogy (e.g., credit score calculator), plain language, ~5 sentences.
- **Senior** — bullet points covering: magic number thresholds, nested if-else code smell, `else { s += 0 }` dead code, `e.split("@")[1]` risk.
- **Architecture** — opinionated bullets: scoring belongs in a rules engine, no score-breakdown observability, config should be externalized, runtime throw kills the request.

### 5.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **3-layer structure** | Matches real teams: onboarding, peer review, and design review are different audiences. |
| **Audience calibration** | "knows JavaScript basics but never seen a scoring algorithm" tells the model exactly what to assume. |
| **Analogy request** | Makes the junior section memorable — without asking, the model outputs dry definitions. |
| **"Be opinionated"** | Unlocks the model's strongest mode. Without it, the model hedges with "depending on requirements…" |
| **"Do not rewrite"** | Prevents the model from turning an explanation into a refactoring exercise. |

### 5.5 Weak version (show for contrast)

```
Explain this code.
```

Why it's weak: no audience, no structure, no constraints. Defaults to a single monolithic paragraph at a generic skill level.

---

## Step 6 — Generate Regression Tests from Diff

### 6.1 Setup

1. Open Copilot Chat in VS Code.
2. Attach the diff or the changed files for context.
3. Have `backend/tests/orders.test.ts` open so Copilot can reference the existing test patterns.

### 6.2 Prompt (copy-paste)

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

### 6.3 What to expect

A complete, runnable `cancel-reason.test.ts` file with tests covering:

| Category | Example test |
|----------|--------------|
| **Happy path** | Cancelling a pending order with a reason creates an ops note containing the reason text. |
| **Edge case** | Cancelling without a reason does not create a note (or creates one with default text). |
| **Error path** | Cancelling a delivered order throws `StatusTransitionError` / returns 409. |
| **Regression guard** | If the status-guard check is removed, this test fails — proving BUG-01 fix is in place. |

### 6.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **"QA engineer" role** | Shifts from "write a test" to "think about what can break" — adversarial mindset. |
| **4-category framework** | Happy, edge, error, regression ensures full coverage, not just the happy path. |
| **"Regression guards"** | The highest-value test type — tests that break if the fix is reverted. Unique concept to highlight. |
| **Style guide reference** | "Use existing patterns in orders.test.ts" ensures generated tests match codebase conventions. |
| **"Drop in and run"** | Forces complete output — correct imports, no placeholders, no `// TODO`. |
| **Anti-mock constraint** | Matches existing strategy (real in-memory SQLite). Without it, the model generates mock-heavy tests that test nothing. |

### 6.5 Weak version (show for contrast)

```
Write tests for the cancel order feature.
```

Why it's weak: no role, no framework specified (might generate Jest), no structure, no style guide, may output snippets that need manual assembly.

### 6.6 Live verification (optional)

If time permits, drop the generated file into `backend/tests/` and run:

```bash
npx vitest run cancel-reason
```

Show the audience whether the tests pass or fail — and discuss why.

---

## Step 7 — Docs Automation (Release Notes + API Docs Delta)

### 7.1 Setup

1. Open Copilot Chat in VS Code.
2. Attach the diff or use the PR context.
3. Have `docs/api.md` and `docs/changelog-template.md` open for reference.

### 7.2 Prompt (copy-paste)

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

### 7.3 What to expect

**Release Notes** should include:

- **What changed** — cancel endpoint now accepts an optional `reason` field; system auto-creates ops notes.
- **Breaking changes** — response shape changed from `Order` to `{ order, note }`.
- **Migration steps** — update client code to read `response.order`.

**API Docs Delta** should show a `diff` block updating `POST /api/orders/:id/cancel` with:

- New request body schema (`{ "reason": "..." }` marked optional)
- New response schema (`{ order: {...}, note?: {...} }`)
- New error responses (404, 409)
- A `curl` example

### 7.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **"Technical writer" role** | Shifts from developer-speak to consumer-facing language. |
| **Two-document output** | One prompt producing two related artifacts uses shared context efficiently. |
| **Exact changelog format** | What/New/Breaking/Migration — the 4 things every consumer needs. |
| **Diff format for API docs** | Showing a delta (not the full file) is practical — apply it directly. |
| **"API consumers, not contributors"** | Critical distinction — without it, release notes read like commit messages. |

### 7.5 Weak version (show for contrast)

```
Write release notes and update the API docs for this PR.
```

Why it's weak: no role, no format, no "delta" instruction, no breaking-change section, no curl examples.

---

## Step 8 — Explain a CodeQL Alert and Propose Fix

### 8.1 Setup

1. Open `backend/src/services/orderService.ts` in VS Code.
2. Navigate to the `listOrders` function (around line 28).
3. Open Copilot Chat.

> **Cheat sheet:** This targets **SEC-01** — the SQL injection in the search parameter. See `docs/demo-seeded-issues.md`.

### 8.2 Prompt (copy-paste)

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

### 8.3 What to expect

**What CodeQL Found** — traces the flow: HTTP request `search` param → `routes/orders.ts` → `listOrders()` → string-interpolated into SQL.

**Why It Matters** — includes:

- Exploit: `curl "http://localhost:3001/api/orders?search=' OR 1=1 --"` returns all 520 orders.
- CWE-89 / OWASP A03:2021 — Injection.

**The Fix** — BEFORE/AFTER blocks showing the change from string interpolation to `?` placeholders:

```ts
// BEFORE
conditions.push(`(customerName LIKE '%${search}%' OR product LIKE '%${search}%')`);

// AFTER
conditions.push("(customerName LIKE ? OR product LIKE ?)");
params.push(`%${search}%`, `%${search}%`);
```

**Verification** — curl commands showing the exploit before and `npm test` confirmation after.

### 8.4 Talking points

| Technique | Why it matters |
|-----------|----------------|
| **Audience calibration** | "mid-level dev who hasn't used static analysis" — model won't assume SAST knowledge but won't over-simplify. |
| **Alert details injection** | Providing rule, file, line, and message prevents the model from guessing which alert. |
| **"Trace the data flow"** | Most valuable part of explaining a SAST alert. Without it, you get "user input reaches SQL" with no path. |
| **Exploit payload** | `?search=' OR 1=1 --` returning all 520 orders creates instant understanding of severity. |
| **BEFORE/AFTER blocks** | Most actionable fix format — the developer can literally diff the blocks. |
| **"Not escaping/sanitisation"** | Prevents the wrong fix (`input.replace(/'/g, "''")`) — parameterised queries are the only correct answer. |
| **"5 minutes" constraint** | Prevents scope creep — the answer should be surgical, not a refactoring plan. |

### 8.5 Weak version (show for contrast)

```
Explain this CodeQL alert and fix it.
```

Why it's weak: no alert details (model guesses), no audience, no data flow trace, no exploit payload, no output structure.

### 8.6 Live verification (optional)

If time permits, demonstrate the exploit live:

```bash
# BEFORE fix — returns all 520 orders
curl "http://localhost:3001/api/orders?search=' OR 1=1 --"

# AFTER fix — returns 0 results (literal string match)
curl "http://localhost:3001/api/orders?search=' OR 1=1 --"
```

---

## Prompt Engineering Principles — Quick Reference

These 8 steps all apply the same core techniques. Use this table as a closing slide or handout:

| # | Principle | What it does | Example from this demo |
|---|-----------|-------------|------------------------|
| 1 | **Role assignment** | Sets tone and expertise level | "security engineer", "QA engineer", "technical writer" |
| 2 | **Scoped passes** | Focus on one concern per prompt | "correctness-only", "performance issues only", "security vulnerabilities only" |
| 3 | **Structured output** | Exact headings and field names | `## Summary`, `**File & line:**`, `**CWE:**` |
| 4 | **Negative constraints** | Suppress noise and hallucination | "Do NOT invent changes", "Ignore performance and style", "Do not suggest ORMs" |
| 5 | **Audience calibration** | Match depth to reader | "junior dev who knows JS basics", "API consumers, not contributors" |
| 6 | **Example requirements** | Force actionable output | "Include a curl example", "proof of concept payload" |
| 7 | **Severity scales** | Enable triage | 🔴🟡🟢 with definitions per prompt |
| 8 | **Anti-hedge clause** | Get opinionated answers | "Be opinionated", "Only flag real bugs" |

### Key takeaway for the audience

> **A great prompt is a contract.** It specifies the role, the scope, the output format, what to include, and what to exclude. The more precise the contract, the more useful and repeatable the output.
