import { useEffect, useState, useCallback } from "react";
import { fetchOrders } from "../api/client";
import type { Order, OrderStatus, PaginatedResponse } from "../types";
import OrderTable from "../components/OrderTable";

const STATUSES: (OrderStatus | "")[] = [
  "",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export default function OrdersListPage() {
  const [result, setResult] = useState<PaginatedResponse<Order> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrders(
        page,
        20,
        status || undefined,
        search || undefined
      );
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h2 style={{ margin: "1rem 0" }}>Orders</h2>

      <div className="controls">
        <input
          type="text"
          placeholder="Search customer or product…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
        {loading && <span className="text-muted">Loading…</span>}
      </div>

      {result && (
        <>
          <p className="text-muted mb-1" style={{ fontSize: "0.8rem" }}>
            Showing {result.data.length} of {result.total} orders
          </p>
          <OrderTable orders={result.data} />

          <div className="pagination">
            <button
              className="btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              Page {result.page} of {result.totalPages}
            </span>
            <button
              className="btn-ghost"
              disabled={page >= result.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
