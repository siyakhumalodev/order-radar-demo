import express from "express";
import cors from "cors";
import ordersRouter from "./routes/orders.js";
import notesRouter from "./routes/notes.js";
import { seedDatabase } from "./seed.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────
app.use("/api/orders", ordersRouter);
app.use("/api/orders", notesRouter);

// ── Health check ──────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Seed & Start ──────────────────────────────
seedDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Order Radar API running on http://localhost:${PORT}`);
});

export default app;
