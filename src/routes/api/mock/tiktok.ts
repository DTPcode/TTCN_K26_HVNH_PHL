import { json, createAPIFileRoute } from "@tanstack/react-start/api";

// ============================================================
// Mock TikTok Shop API — mô phỏng TikTok Shop Open Platform
// ============================================================
const MOCK_PRODUCTS = [
  { product_id: "TK-2001", sku: "AT-POLO-BLK-M", name: "Polo Đen - M", stock: 45, price: 399000 },
  { product_id: "TK-2002", sku: "AT-BOMB-BLK-L", name: "Bomber Đen - L", stock: 25, price: 699000 },
  { product_id: "TK-2003", sku: "AT-HOOD-BLK-M", name: "Hoodie Đen - M", stock: 50, price: 599000 },
];

const MOCK_ORDERS = [
  { order_id: "TK-ORD-001", status: "AWAITING_SHIPMENT", items: [{ sku: "AT-POLO-BLK-M", qty: 1 }], total: 399000, buyer: "TikTok User 1", create_time: Date.now() - 5400_000 },
  { order_id: "TK-ORD-002", status: "SHIPPED", items: [{ sku: "AT-BOMB-BLK-L", qty: 1 }], total: 699000, buyer: "TikTok User 2", create_time: Date.now() - 10800_000 },
];

export const APIRoute = createAPIFileRoute("/api/mock/tiktok")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "ping") {
      return json({ status: "ok", channel: "tiktok", message: "TikTok Shop Open Platform — Mock Server", timestamp: Date.now() });
    }
    if (action === "products") {
      return json({ products: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length });
    }
    if (action === "orders") {
      return json({ orders: MOCK_ORDERS, total: MOCK_ORDERS.length });
    }

    return json({ channel: "tiktok", api_version: "v2", available_actions: ["ping", "products", "orders"] });
  },

  POST: async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const action = (body as Record<string, unknown>).action as string;

    if (action === "update_stock") {
      const { sku, qty } = body as { sku: string; qty: number };
      const product = MOCK_PRODUCTS.find((p) => p.sku === sku);
      if (product) { product.stock = qty; return json({ success: true, sku, new_stock: qty }); }
      return json({ success: false, error: "SKU not found" }, { status: 404 });
    }

    if (action === "simulate_order") {
      const sku = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      const order = { order_id: `TK-${Date.now()}`, status: "AWAITING_SHIPMENT", items: [{ sku: sku.sku, qty: 1 }], total: sku.price, buyer: "TikTok Mock Buyer", create_time: Date.now() };
      MOCK_ORDERS.unshift(order);
      return json({ success: true, order });
    }

    return json({ error: "Unknown action" }, { status: 400 });
  },
});
