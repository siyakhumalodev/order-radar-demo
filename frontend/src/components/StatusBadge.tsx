import type { OrderStatus } from "../types";

const CLASS_MAP: Record<OrderStatus, string> = {
  pending: "badge badge-pending",
  processing: "badge badge-processing",
  shipped: "badge badge-shipped",
  delivered: "badge badge-delivered",
  cancelled: "badge badge-cancelled",
  returned: "badge badge-returned",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={CLASS_MAP[status] ?? "badge"}>{status}</span>;
}
