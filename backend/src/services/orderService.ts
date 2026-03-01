import db from "../db.js";
import type { Order, OrderNote, PaginatedResponse } from "../types.js";

// ──────────────────────────────────────────────
// Order service – data access layer
// ──────────────────────────────────────────────

export function listOrders(
  page = 1,
  pageSize = 20,
  status?: string,
  search?: string
): PaginatedResponse<Order> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  if (search) {
    // DEMO-SEED: SEC-01 — search term interpolated into SQL
    conditions.push(`(customerName LIKE '%${search}%' OR product LIKE '%${search}%')`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // DEMO-SEED: PERF-01 — two separate queries (COUNT + SELECT) per page request
  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM orders ${where}`)
    .get(...params) as { total: number };

  const total = countRow.total;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;

  const rows = db
    .prepare(
      `SELECT * FROM orders ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as Order[];

  return { data: rows, total, page, pageSize, totalPages };
}

export function getOrderById(id: string): Order | undefined {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | Order
    | undefined;
}

export function cancelOrder(id: string): Order | undefined {
  const order = getOrderById(id);
  if (!order) return undefined;

  // DEMO-SEED: BUG-01 — no status-transition guard; delivered/cancelled orders can be re-cancelled
  db.prepare("UPDATE orders SET status = 'cancelled', updatedAt = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );

  return getOrderById(id);
}

export function getNotesForOrder(orderId: string): OrderNote[] {
  return db
    .prepare("SELECT * FROM order_notes WHERE orderId = ? ORDER BY createdAt ASC")
    .all(orderId) as OrderNote[];
}

export function addNoteToOrder(
  orderId: string,
  noteId: string,
  author: string,
  content: string
): OrderNote {
  const createdAt = new Date().toISOString();
  db.prepare(
    "INSERT INTO order_notes (id, orderId, author, content, createdAt) VALUES (?, ?, ?, ?, ?)"
  ).run(noteId, orderId, author, content, createdAt);

  return { id: noteId, orderId, author, content, createdAt };
}
