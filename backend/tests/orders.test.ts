import { describe, it, expect, beforeAll } from "vitest";
import { seedDatabase } from "../src/seed.js";
import {
  listOrders,
  getOrderById,
  cancelOrder,
  getNotesForOrder,
  addNoteToOrder,
  StatusTransitionError,
} from "../src/services/orderService.js";

// Seed the in-memory DB once before all tests
beforeAll(() => {
  seedDatabase(50); // smaller set for fast tests
});

describe("orderService", () => {
  describe("listOrders", () => {
    it("returns paginated orders", () => {
      const result = listOrders(1, 10);
      expect(result.data.length).toBeLessThanOrEqual(10);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it("filters by status", () => {
      const result = listOrders(1, 100, "pending");
      for (const order of result.data) {
        expect(order.status).toBe("pending");
      }
    });

    it("returns empty data for out-of-range page", () => {
      const result = listOrders(999, 10);
      expect(result.data.length).toBe(0);
    });

    // INTENTIONALLY MISSING: test for SQL injection via search param
  });

  describe("getOrderById", () => {
    it("returns an order when it exists", () => {
      const all = listOrders(1, 1);
      const id = all.data[0].id;
      const order = getOrderById(id);
      expect(order).toBeDefined();
      expect(order!.id).toBe(id);
    });

    it("returns undefined for non-existent id", () => {
      const order = getOrderById("non-existent-id");
      expect(order).toBeUndefined();
    });
  });

  describe("cancelOrder", () => {
    it("cancels a pending order", () => {
      const pending = listOrders(1, 100, "pending");
      if (pending.data.length === 0) return; // skip if no pending orders

      const result = cancelOrder(pending.data[0].id);
      expect(result).toBeDefined();
      expect(result!.order.status).toBe("cancelled");
    });

    it("returns undefined for non-existent order", () => {
      const result = cancelOrder("fake-id");
      expect(result).toBeUndefined();
    });

    it("cancels with a reason and creates an ops note", () => {
      const pending = listOrders(1, 100, "pending");
      if (pending.data.length < 2) return;

      const result = cancelOrder(pending.data[1].id, "Customer changed their mind");
      expect(result).toBeDefined();
      expect(result!.order.status).toBe("cancelled");
      expect(result!.note).toBeDefined();
      expect(result!.note!.content).toContain("Customer changed their mind");
    });

    it("cancels without a reason and does not create a note", () => {
      const processing = listOrders(1, 100, "processing");
      if (processing.data.length === 0) return;

      const result = cancelOrder(processing.data[0].id);
      expect(result).toBeDefined();
      expect(result!.order.status).toBe("cancelled");
      expect(result!.note).toBeUndefined();
    });

    it("throws StatusTransitionError for already-cancelled orders", () => {
      // Self-contained: cancel an order here, then attempt a second cancel
      const pending = listOrders(1, 100, "pending");
      const processing = listOrders(1, 100, "processing");
      const sourceList = pending.data.length > 0 ? pending : processing;
      if (!sourceList || sourceList.data.length === 0) return;

      const orderId = sourceList.data[0].id;
      const firstResult = cancelOrder(orderId);
      expect(firstResult).toBeDefined();
      expect(firstResult!.order.status).toBe("cancelled");

      expect(() => cancelOrder(orderId)).toThrow(StatusTransitionError);
    });

    // INTENTIONALLY MISSING: test that cancelling a "delivered" order should fail
  });

  describe("notes", () => {
    it("adds and retrieves notes", () => {
      const all = listOrders(1, 1);
      const orderId = all.data[0].id;

      const note = addNoteToOrder(orderId, "test-note-1", "tester", "Hello world");
      expect(note.id).toBe("test-note-1");
      expect(note.content).toBe("Hello world");

      const notes = getNotesForOrder(orderId);
      const found = notes.find((n) => n.id === "test-note-1");
      expect(found).toBeDefined();
    });
  });
});
