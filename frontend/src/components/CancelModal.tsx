import { useState } from "react";
import type { Order } from "../types";

interface Props {
  order: Order;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export default function CancelModal({ order, onConfirm, onClose }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(reason);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Cancel Order</h2>
        <p>
          Are you sure you want to cancel order{" "}
          <strong>{order.id.slice(0, 8)}…</strong> for{" "}
          <strong>{order.customerName}</strong>?
        </p>
        <p className="mt-1 text-muted" style={{ fontSize: "0.875rem" }}>
          Product: {order.product} — ${order.totalPrice.toFixed(2)}
        </p>
        <div style={{ margin: "0.75rem 0" }}>
          <label htmlFor="cancel-reason" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
            Reason (optional)
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose} disabled={confirming}>
            Keep Order
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? "Cancelling…" : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
