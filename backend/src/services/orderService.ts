import db from "../db.js";
import { v4 as uuid } from "uuid";
import type { Order, OrderNote, PaginatedResponse } from "../types.js";

// ──────────────────────────────────────────────
// Order service – data access layer
// ──────────────────────────────────────────────

/** Statuses that cannot transition to any other status. */
const TERMINAL_STATUSES = new Set(["cancelled", "delivered", "returned"]);

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

// DEMO-SEED: BUG-01 — no status guard; delivered/cancelled orders can be cancelled again
export function cancelOrder(id: string, reason?: string): { order: Order; note?: OrderNote } | undefined {
  const order = getOrderById(id);
  if (!order) return undefined;

  const now = new Date().toISOString();

  db.prepare("UPDATE orders SET status = 'cancelled', updatedAt = ? WHERE id = ?").run(
    now,
    id
  );

  // Auto-create an ops note when cancelling
  let opsNote: OrderNote | undefined;
  if (reason) {
    opsNote = addNoteToOrder(id, uuid(), order.customerEmail, `Order cancelled: ${reason}`);
  }

  return { order: getOrderById(id)!, note: opsNote };
}

/**
 * Thrown when an order is in a terminal status and cannot be cancelled.
 */
export class StatusTransitionError extends Error {
  public readonly currentStatus: string;
  constructor(status: string) {
    super(`Cannot cancel order in "${status}" status`);
    this.name = "StatusTransitionError";
    this.currentStatus = status;
  }
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
