# API Reference

Base URL: `http://localhost:3001/api`

---

## Health Check

### `GET /api/health`

Returns server status.

**Response:**
```json
{ "status": "ok", "timestamp": "2026-03-01T12:00:00.000Z" }
```

---

## Orders

### `GET /api/orders`

List orders with pagination, filtering, and search.

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page |
| `status` | string | — | Filter by order status |
| `search` | string | — | Search customer name or product |

**Response:**
```json
{
  "data": [ { ... } ],
  "total": 520,
  "page": 1,
  "pageSize": 20,
  "totalPages": 26
}
```

### `GET /api/orders/:id`

Get a single order by ID.

**Response:** `Order` object or `404`.

### `POST /api/orders/:id/cancel`

Cancel an order. No request body needed.

**Response:** Updated `Order` object or `404`.

---

## Notes

### `GET /api/orders/:orderId/notes`

Get all notes for an order.

**Response:** `OrderNote[]`

### `POST /api/orders/:orderId/notes`

Add a note to an order.

**Request body:**
```json
{
  "author": "support-agent",
  "content": "Customer called about delivery."
}
```

**Response:** `201` with created `OrderNote`.

---

## Data Types

### Order

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `customerName` | string | Full name |
| `customerEmail` | string | Email address |
| `product` | string | Product name |
| `quantity` | number | Units ordered |
| `unitPrice` | number | Per-unit price |
| `totalPrice` | number | quantity × unitPrice |
| `status` | OrderStatus | Current status |
| `riskScore` | number (0-100) | Computed risk level |
| `shippingAddress` | string | Full address |
| `createdAt` | string (ISO) | Creation timestamp |
| `updatedAt` | string (ISO) | Last update timestamp |

### OrderStatus

`"pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned"`

### OrderNote

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Note ID |
| `orderId` | string | Parent order ID |
| `author` | string | Who wrote the note |
| `content` | string | Note body |
| `createdAt` | string (ISO) | Timestamp |
