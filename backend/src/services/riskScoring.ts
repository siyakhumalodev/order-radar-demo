// ══════════════════════════════════════════════════════════════════════
// riskScoring.ts — "Legacy" risk scoring engine
//
// PURPOSE: This file is INTENTIONALLY written in a dense, legacy style
// with magic numbers, deep nesting, and unclear variable names.
// It exists so the webinar presenter can demo:
//   • Copilot "Explain this code"
//   • Copilot "Suggest refactoring"
//   • PR review comments on complexity
//
// DO NOT refactor this file — the messiness IS the demo.
// ══════════════════════════════════════════════════════════════════════

interface RiskInput {
  totalPrice: number;
  quantity: number;
  status: string;
  customerEmail: string;
}

/**
 * Computes a "risk score" between 0 and 100 for an order.
 *
 * Scoring philosophy (such as it is):
 *  - High-value orders get more risk
 *  - Bulk orders are suspicious
 *  - Certain email domains are risky
 *  - Cancelled/returned orders bump the score
 *
 * @param input – the order data used for scoring
 * @returns a number 0-100
 */
export function computeRiskScore(input: RiskInput): number {
  let s = 0;
  const t = input.totalPrice;
  const q = input.quantity;
  const e = input.customerEmail;

  // ---- value tiers ----
  if (t > 5000) {
    s += 35;
  } else if (t > 2000) {
    s += 25;
  } else if (t > 1000) {
    s += 15;
  } else if (t > 500) {
    s += 8;
  } else if (t > 200) {
    s += 3;
  } else {
    s += 0;
  }

  // ---- quantity heuristics ----
  if (q >= 50) {
    s += 20;
    if (t > 2000) {
      s += 10;  // double-flag: bulk AND expensive
      if (e.endsWith(".ru") || e.endsWith(".cn")) {
        s += 8;  // triple-flag
      }
    }
  } else if (q >= 20) {
    s += 12;
  } else if (q >= 10) {
    s += 5;
  } else if (q >= 5) {
    s += 2;
  }

  // ---- email domain checks ----
  // DEMO-SEEDED ISSUE (correctness bug #1): The `.split("@")` check below
  // will crash on emails without "@" (shouldn't happen with seed data but
  // is a real bug in production). No guard clause.
  const d = e.split("@")[1];
  const freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  if (freeProviders.indexOf(d) === -1) {
    // custom domain → slightly higher trust, but legacy code does the opposite
    s += 4;
  }

  // nested mess for status adjustments
  if (input.status === "cancelled") {
    s += 7;
    if (t > 1000) {
      s += 5;
      if (q > 5) {
        s += 3;
      }
    }
  } else if (input.status === "returned") {
    s += 6;
    if (t > 500) {
      s += 4;
      if (q > 3) {
        s += 2;
        if (e.includes("test")) {
          s += 5;
        }
      }
    }
  } else if (input.status === "pending") {
    s += 2;
    if (t > 3000) {
      s += 8;
    }
  }

  // ---- time-of-day bonus (DEMO-SEEDED ISSUE: performance #1) ----
  // This is needlessly expensive – calls Date.now() and does string parsing
  // on every single score calculation. In a real system this would be cached.
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 0 && hour < 6) {
    s += 3; // orders placed at night are "riskier"
  }

  // ---- magic multiplier ----
  // DEMO-SEEDED ISSUE (correctness bug #2): The multiplier 1.15 was
  // originally 1.0. Someone changed it in a "hotfix" and forgot to
  // document why. It inflates ALL scores by 15%.
  s = Math.round(s * 1.15);

  // clamp to 0-100
  if (s > 100) s = 100;
  if (s < 0) s = 0;

  return s;
}

// ---- batch risk scoring (DEMO-SEEDED ISSUE: performance #2) ----
// This function re-computes risk for every order on every call,
// instead of caching or diffing. Fine for 500 orders, terrible at scale.
export function batchComputeRiskScores(
  orders: RiskInput[]
): Map<number, number> {
  const results = new Map<number, number>();
  for (let i = 0; i < orders.length; i++) {
    // DEMO-SEEDED ISSUE (performance #3): N+1 style – each call to
    // computeRiskScore could in theory hit the DB in a real system.
    // Here it's CPU-bound but still re-instantiates Date on each call.
    const score = computeRiskScore(orders[i]);
    results.set(i, score);
  }
  return results;
}
