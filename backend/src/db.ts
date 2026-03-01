import Database from "better-sqlite3";

// In-memory SQLite – fast, zero-config, perfect for demos
const db = new Database(":memory:");

// Enable WAL for better concurrency (no-op in memory but good habit)
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id            TEXT PRIMARY KEY,
    customerName  TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    product       TEXT NOT NULL,
    quantity      INTEGER NOT NULL,
    unitPrice     REAL NOT NULL,
    totalPrice    REAL NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    riskScore     REAL NOT NULL DEFAULT 0,
    shippingAddress TEXT NOT NULL,
    createdAt     TEXT NOT NULL,
    updatedAt     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_notes (
    id        TEXT PRIMARY KEY,
    orderId   TEXT NOT NULL,
    author    TEXT NOT NULL,
    content   TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt);
  CREATE INDEX IF NOT EXISTS idx_notes_orderId ON order_notes(orderId);
`);

export default db;
