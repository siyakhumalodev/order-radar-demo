import { Request, Response, NextFunction } from "express";

// ──────────────────────────────────────────────
// Auth middleware
// ──────────────────────────────────────────────

const API_KEY = process.env.API_KEY;

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (!API_KEY) {
    res.status(503).json({ error: "Service unavailable – API key is not configured" });
    return;
  }

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
