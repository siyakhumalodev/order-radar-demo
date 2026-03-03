import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrder, cancelOrder as apiCancel } from "../api/client";
import type { Order } from "../types";
import StatusBadge from "../components/StatusBadge";
import CancelModal from "../components/CancelModal";
import NotesPanel from "../components/NotesPanel";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState("");
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchOrder(id)
      .then(setOrder)
      .catch(() => setError("Order not found"));
  }, [id]);

  const handleCancel = async (reason: string) => {
    if (!id) return;
    try {
      const updated = await apiCancel(id, reason);
      setOrder(updated);
      setShowCancel(false);
    } catch (err) {
      console.error("Failed to cancel order", err);
      setCancelError("Failed to cancel order. Please try again.");
      setShowCancel(false);
    }
  };

  const handleCancelClick = () => { setCancelError(""); setShowCancel(true); };

  if (error) {
    return (
      <div className="mt-2">
        <p>{error}</p>
        <Link to="/">← Back to orders</Link>
      </div>
    );
  }

  if (!order) {
    return <p className="mt-2 text-muted">Loading…</p>;
  }

  const riskLevel =
    order.riskScore >= 60 ? "High" : order.riskScore >= 30 ? "Medium" : "Low";

  return (
    <div>
      <Link to="/" style={{ fontSize: "0.875rem" }}>
        ← Back to orders
      </Link>

      <h2 style={{ margin: "0.75rem 0" }}>
        Order {order.id.slice(0, 8)}…
      </h2>

      <div className="detail-grid">
        <div className="detail-card">
          <label>Customer</label>
          <div className="value">{order.customerName}</div>
          <div className="text-muted" style={{ fontSize: "0.8rem" }}>
            {order.customerEmail}
          </div>
        </div>
        <div className="detail-card">
          <label>Product</label>
          <div className="value">{order.product}</div>
          <div className="text-muted" style={{ fontSize: "0.8rem" }}>
            Qty: {order.quantity} × ${order.unitPrice.toFixed(2)}
          </div>
        </div>
        <div className="detail-card">
          <label>Total</label>
          <div className="value">${order.totalPrice.toFixed(2)}</div>
        </div>
        <div className="detail-card">
          <label>Status</label>
          <div className="value">
            <StatusBadge status={order.status} />
          </div>
        </div>
        <div className="detail-card">
          <label>Risk Score</label>
          <div className="value">
            {order.riskScore} — {riskLevel}
          </div>
        </div>
        <div className="detail-card">
          <label>Shipping Address</label>
          <div className="value" style={{ fontSize: "0.875rem" }}>
            {order.shippingAddress}
          </div>
        </div>
        <div className="detail-card">
          <label>Created</label>
          <div className="value" style={{ fontSize: "0.875rem" }}>
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="detail-card">
          <label>Last Updated</label>
          <div className="value" style={{ fontSize: "0.875rem" }}>
            {new Date(order.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {order.status !== "cancelled" && (
        <>
          {cancelError && (
            <p className="mt-1" style={{ color: "red", fontSize: "0.875rem" }}>
              {cancelError}
            </p>
          )}
          <button
            className="btn-danger mt-1"
            onClick={handleCancelClick}
          >
            Cancel Order
          </button>
        </>
      )}

      {showCancel && (
        <CancelModal
          order={order}
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
        />
      )}

      <NotesPanel orderId={order.id} />
    </div>
  );
}
