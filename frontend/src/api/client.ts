import type { Order, OrderNote, PaginatedResponse } from "../types";

const BASE = "/api";

export async function fetchOrders(
  page = 1,
  pageSize = 20,
  status?: string,
  search?: string
): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  const res = await fetch(`${BASE}/orders?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
  return res.json();
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch order: ${res.statusText}`);
  return res.json();
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const res = await fetch(`${BASE}/orders/${id}/cancel`, {
    method: "POST",
    headers,
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(`Failed to cancel order: ${res.statusText}`);
  const data = await res.json();
  return data.order;
}

export async function fetchNotes(orderId: string): Promise<OrderNote[]> {
  const res = await fetch(`${BASE}/orders/${orderId}/notes`);
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.statusText}`);
  return res.json();
}

export async function addNote(
  orderId: string,
  author: string,
  content: string
): Promise<OrderNote> {
  const res = await fetch(`${BASE}/orders/${orderId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author, content }),
  });
  if (!res.ok) throw new Error(`Failed to add note: ${res.statusText}`);
  return res.json();
}
