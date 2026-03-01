import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import {
  getNotesForOrder,
  addNoteToOrder,
} from "../services/orderService.js";
import { getOrderById } from "../services/orderService.js";

const router = Router();

// GET /api/orders/:orderId/notes
router.get("/:orderId/notes", (req: Request, res: Response) => {
  const order = getOrderById(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const notes = getNotesForOrder(req.params.orderId);
  res.json(notes);
});

// POST /api/orders/:orderId/notes
router.post("/:orderId/notes", (req: Request, res: Response) => {
  const order = getOrderById(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const { author, content } = req.body;

  if (!author || !content) {
    res.status(400).json({ error: "author and content are required" });
    return;
  }

  const note = addNoteToOrder(req.params.orderId, uuid(), author, content);
  res.status(201).json(note);
});

export default router;
