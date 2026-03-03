import { Router, Request, Response } from "express";
import {
  listOrders,
  getOrderById,
  cancelOrder,
  StatusTransitionError,
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
// DEMO-SEED: SEC-03 — write operation has no authentication middleware
router.post("/:id/cancel", (req: Request, res: Response) => {
  const { reason } = req.body ?? {};

  if (reason !== undefined && typeof reason !== "string") {
    res.status(400).json({ error: "Invalid reason; must be a string" });
    return;
  }

  try {
    const result = cancelOrder(req.params.id, reason);

    if (!result) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    console.log("Order cancelled:", {
      orderId: result.order?.id,
      status: result.order?.status,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof StatusTransitionError) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error("Error cancelling order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
