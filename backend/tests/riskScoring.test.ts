import { describe, it, expect } from "vitest";
import { computeRiskScore, batchComputeRiskScores } from "../src/services/riskScoring.js";

describe("computeRiskScore", () => {
  it("returns 0 for a small, simple order", () => {
    const score = computeRiskScore({
      totalPrice: 10,
      quantity: 1,
      status: "delivered",
      customerEmail: "alice@gmail.com",
    });
    // Score should be very low for a cheap, delivered, gmail order
    expect(score).toBeLessThanOrEqual(10);
  });

  it("returns higher score for expensive orders", () => {
    const cheap = computeRiskScore({
      totalPrice: 50,
      quantity: 1,
      status: "pending",
      customerEmail: "bob@gmail.com",
    });
    const expensive = computeRiskScore({
      totalPrice: 6000,
      quantity: 1,
      status: "pending",
      customerEmail: "bob@gmail.com",
    });
    expect(expensive).toBeGreaterThan(cheap);
  });

  it("returns higher score for bulk orders", () => {
    const small = computeRiskScore({
      totalPrice: 500,
      quantity: 2,
      status: "processing",
      customerEmail: "carol@example.com",
    });
    const bulk = computeRiskScore({
      totalPrice: 500,
      quantity: 60,
      status: "processing",
      customerEmail: "carol@example.com",
    });
    expect(bulk).toBeGreaterThan(small);
  });

  it("increases score for cancelled orders", () => {
    const delivered = computeRiskScore({
      totalPrice: 1500,
      quantity: 3,
      status: "delivered",
      customerEmail: "dave@company.com",
    });
    const cancelled = computeRiskScore({
      totalPrice: 1500,
      quantity: 3,
      status: "cancelled",
      customerEmail: "dave@company.com",
    });
    expect(cancelled).toBeGreaterThan(delivered);
  });

  it("clamps score to max 100", () => {
    const score = computeRiskScore({
      totalPrice: 99999,
      quantity: 100,
      status: "cancelled",
      customerEmail: "suspicious@test.ru",
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  // INTENTIONALLY MISSING EDGE-CASE TESTS (for demo purposes):
  // - What happens when customerEmail has no "@"?
  // - What happens with negative quantity?
  // - What happens with totalPrice = 0?
  // - What about the 1.15 multiplier accuracy?
});

describe("batchComputeRiskScores", () => {
  it("returns a map with scores for all orders", () => {
    const orders = [
      { totalPrice: 100, quantity: 1, status: "pending", customerEmail: "a@gmail.com" },
      { totalPrice: 5000, quantity: 50, status: "cancelled", customerEmail: "b@test.cn" },
    ];
    const result = batchComputeRiskScores(orders);
    expect(result.size).toBe(2);
    expect(result.get(0)).toBeDefined();
    expect(result.get(1)).toBeDefined();
    expect(result.get(1)!).toBeGreaterThan(result.get(0)!);
  });
});
