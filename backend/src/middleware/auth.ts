import { Request, Response, NextFunction } from "express";

// ══════════════════════════════════════════════════════════════════════
// Auth middleware
//
// DEMO-SEEDED ISSUE (security #2): This middleware uses a hardcoded
// API key. In a real app this would come from environment variables
// or a secrets vault. The key is also checked via simple string
// comparison (no timing-safe compare).
//
// DEMO-SEEDED ISSUE (security #3): The "secret" is committed to
// source control – a classic secret-scanning finding.
// ══════════════════════════════════════════════════════════════════════

const API_KEY = "sk_live_demo_4f8a2b1c9d3e7f6a0b5c8d2e"; // fake key for demo

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const provided = req.headers["x-api-key"] as string | undefined;

  // DEMO-SEEDED ISSUE (security #4): No rate limiting or brute-force
  // protection on the API key check.
  if (!provided || provided !== API_KEY) {
    res.status(401).json({ error: "Unauthorized – missing or invalid API key" });
    return;
  }

  next();
}

// A lenient "public" middleware that just lets everything through.
// Used on read routes for the demo so the UI works without auth headers.
export function publicRoute(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
