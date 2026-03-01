import { Request, Response, NextFunction } from "express";

// ──────────────────────────────────────────────
// Auth middleware
// ──────────────────────────────────────────────

// DEMO-SEED: SEC-02 — hardcoded credential committed to source control
const API_KEY = "sk_live_demo_4f8a2b1c9d3e7f6a0b5c8d2e";

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const provided = req.headers["x-api-key"] as string | undefined;

  if (!provided || provided !== API_KEY) {
    res.status(401).json({ error: "Unauthorized – missing or invalid API key" });
    return;
  }

  next();
}

// Lenient pass-through for read routes so the UI works without auth headers.
export function publicRoute(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
