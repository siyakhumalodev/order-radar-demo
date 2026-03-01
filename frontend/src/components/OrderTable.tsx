import { Link } from "react-router-dom";
import type { Order } from "../types";
import StatusBadge from "./StatusBadge";

function RiskBar({ score }: { score: number }) {
  const level = score >= 60 ? "risk-high" : score >= 30 ? "risk-medium" : "risk-low";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span className="risk-bar">
        <span
          className={`risk-bar-fill ${level}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </span>
      <span style={{ fontSize: "0.75rem" }}>{score}</span>
    </span>
  );
}

interface Props {
  orders: Order[];
}

export default function OrderTable({ orders }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Product</th>
          <th>Qty</th>
          <th style={{ textAlign: "right" }}>Total</th>
          <th>Status</th>
          <th>Risk</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>
              <Link to={`/orders/${o.id}`}>{o.id.slice(0, 8)}…</Link>
            </td>
            <td>{o.customerName}</td>
            <td>{o.product}</td>
            <td>{o.quantity}</td>
            <td className="text-right">${o.totalPrice.toFixed(2)}</td>
            <td>
              <StatusBadge status={o.status} />
            </td>
            <td>
              <RiskBar score={o.riskScore} />
            </td>
            <td className="text-muted">
              {new Date(o.createdAt).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
