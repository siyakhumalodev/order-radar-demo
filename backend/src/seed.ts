import { v4 as uuid } from "uuid";
import db from "./db.js";
import { computeRiskScore } from "./services/riskScoring.js";
import type { OrderStatus } from "./types.js";

// ──────────────────────────────────────────────
// Deterministic-ish seed data generator
// Generates 500+ realistic-looking orders
// ──────────────────────────────────────────────

const FIRST_NAMES = [
  "Alice", "Bob", "Carlos", "Diana", "Ethan", "Fiona", "George", "Hannah",
  "Ivan", "Julia", "Kevin", "Lena", "Marco", "Nina", "Oscar", "Priya",
  "Quinn", "Rosa", "Sam", "Tina", "Umar", "Vera", "Will", "Xena", "Yuki", "Zara",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Lee", "Garcia", "Müller", "Tanaka", "Patel",
  "Nguyen", "Kim", "Silva", "Brown", "Wilson", "Taylor", "Anderson",
  "Thomas", "Jackson", "White", "Harris", "Martin", "Lopez",
];

const PRODUCTS = [
  { name: "Wireless Mouse", price: 29.99 },
  { name: "Mechanical Keyboard", price: 89.99 },
  { name: "USB-C Hub", price: 49.99 },
  { name: "27\" Monitor", price: 349.99 },
  { name: "Webcam HD", price: 59.99 },
  { name: "Noise-Cancelling Headphones", price: 199.99 },
  { name: "Laptop Stand", price: 39.99 },
  { name: "Desk Lamp LED", price: 24.99 },
  { name: "Ergonomic Chair", price: 499.99 },
  { name: "External SSD 1TB", price: 109.99 },
  { name: "Bluetooth Speaker", price: 44.99 },
  { name: "Phone Charger 65W", price: 34.99 },
  { name: "Drawing Tablet", price: 229.99 },
  { name: "Smart Power Strip", price: 27.99 },
  { name: "Cable Management Kit", price: 14.99 },
];

const STREETS = [
  "123 Main St", "456 Oak Ave", "789 Pine Rd", "12 Elm Blvd",
  "55 Cedar Ln", "300 Market St", "42 River Dr", "88 Sunset Blvd",
  "101 Park Ave", "7 Maple Ct",
];

const CITIES = [
  "New York, NY 10001", "San Francisco, CA 94102", "Chicago, IL 60601",
  "Austin, TX 78701", "Seattle, WA 98101", "Denver, CO 80201",
  "Boston, MA 02101", "Portland, OR 97201", "Miami, FL 33101",
  "Atlanta, GA 30301",
];

const STATUSES: OrderStatus[] = [
  "pending", "processing", "shipped", "delivered", "cancelled", "returned",
];

const STATUS_WEIGHTS = [15, 20, 25, 30, 5, 5]; // percentage distribution

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickWeighted(statuses: OrderStatus[], weights: number[], rand: () => number): OrderStatus {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < statuses.length; i++) {
    r -= weights[i];
    if (r <= 0) return statuses[i];
  }
  return statuses[statuses.length - 1];
}

function randomDate(rand: () => number, daysBack: number): Date {
  const now = Date.now();
  const offset = Math.floor(rand() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

export function seedDatabase(count = 520): void {
  const rand = seededRandom(42);

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customerName, customerEmail, product, quantity,
      unitPrice, totalPrice, status, riskScore, shippingAddress, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO order_notes (id, orderId, author, content, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const firstName = pick(FIRST_NAMES, rand);
      const lastName = pick(LAST_NAMES, rand);
      const customerName = `${firstName} ${lastName}`;
      const customerEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      const product = pick(PRODUCTS, rand);
      const quantity = Math.floor(rand() * 10) + 1;
      const unitPrice = product.price;
      const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
      const status = pickWeighted(STATUSES, STATUS_WEIGHTS, rand);
      const street = pick(STREETS, rand);
      const city = pick(CITIES, rand);
      const shippingAddress = `${street}, ${city}`;
      const createdAt = randomDate(rand, 90);
      const updatedAt = new Date(createdAt.getTime() + Math.floor(rand() * 3 * 24 * 60 * 60 * 1000));

      const orderId = uuid();

      const riskScore = computeRiskScore({
        totalPrice,
        quantity,
        status,
        customerEmail,
      });

      insertOrder.run(
        orderId,
        customerName,
        customerEmail,
        product.name,
        quantity,
        unitPrice,
        totalPrice,
        status,
        riskScore,
        shippingAddress,
        createdAt.toISOString(),
        updatedAt.toISOString()
      );

      // Add 0–2 notes to some orders
      const noteCount = Math.floor(rand() * 3);
      for (let n = 0; n < noteCount; n++) {
        const noteAuthors = ["system", "support-agent", "warehouse"];
        const noteContents = [
          "Customer contacted about delivery ETA.",
          "Address verified by support.",
          "Flagged for manual review.",
          "Payment confirmed.",
          "Item restocked after return.",
          "Shipping label generated.",
          "Customer requested expedited shipping.",
        ];
        insertNote.run(
          uuid(),
          orderId,
          pick(noteAuthors, rand),
          pick(noteContents, rand),
          new Date(createdAt.getTime() + Math.floor(rand() * 48 * 60 * 60 * 1000)).toISOString()
        );
      }
    }
  });

  insertMany();
  console.log(`✅ Seeded ${count} orders into in-memory SQLite`);
}
