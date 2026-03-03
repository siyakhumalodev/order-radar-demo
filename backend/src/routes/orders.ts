import { Router, Request, Response } from "express";
import {
  listOrders,
  getOrderById,
  cancelOrder,
} from "../services/orderService.js";

const router = Router();

// GET /api/orders?page=1&pageSize=20&status=pending&search=alice
router.get("/", (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  try {
    const result = listOrders(page, pageSize, status, search);
    res.json(result);
  } catch (err) {
    console.error("Error listing orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id
router.get("/:id", (req: Request, res: Response) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

// POST /api/orders/:id/cancel
// DEMO-SEED: BUG-02 — cancel handler has no try-catch (compare with GET / above)
// DEMO-SEED: SEC-03 — write operation has no authentication middleware
router.post("/:id/cancel", (req: Request, res: Response) => {
  const { reason } = req.body ?? {};
  const result = cancelOrder(req.params.id, reason);

  if (!result) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // DEMO-SEED: SEC-04 — logs full order object including customer PII
  console.log("Order cancelled:", JSON.stringify(result.order));

  res.json(result);
});

export default router;
