import { json, createAPIFileRoute } from "@tanstack/react-start/api";

// ============================================================
// Mock Shopee API — mô phỏng Shopee Partner API v2
// ============================================================
const MOCK_PRODUCTS = [
  { item_id: 1001, sku: "AT-POLO-BLK-S", name: "Polo Đen - S", stock: 50, price: 399000 },
  { item_id: 1002, sku: "AT-POLO-BLK-M", name: "Polo Đen - M", stock: 45, price: 399000 },
  { item_id: 1003, sku: "AT-THUN-GRY-S", name: "Thun Xám - S", stock: 55, price: 299000 },
  { item_id: 1004, sku: "AT-SOMI-WHT-M", name: "Sơ Mi Trắng - M", stock: 35, price: 499000 },
  { item_id: 1005, sku: "AT-JEAN-MED-30", name: "Jeans Medium - 30", stock: 38, price: 549000 },
];

const MOCK_ORDERS = [
  { order_sn: "SH-240617-001", status: "READY_TO_SHIP", items: [{ sku: "AT-POLO-BLK-M", qty: 2 }], total: 798000, buyer: "Nguyễn Văn A", create_time: Date.now() - 3600_000 },
  { order_sn: "SH-240617-002", status: "SHIPPED", items: [{ sku: "AT-THUN-GRY-S", qty: 1 }], total: 299000, buyer: "Trần Thị B", create_time: Date.now() - 7200_000 },
  { order_sn: "SH-240617-003", status: "COMPLETED", items: [{ sku: "AT-SOMI-WHT-M", qty: 1 }, { sku: "AT-JEAN-MED-30", qty: 1 }], total: 1048000, buyer: "Lê Hoàng C", create_time: Date.now() - 86400_000 },
];

export const APIRoute = createAPIFileRoute("/api/mock/shopee")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "ping") {
      return json({ status: "ok", channel: "shopee", message: "Shopee Partner API v2 — Mock Server", timestamp: Date.now() });
    }

    if (action === "products") {
      return json({ items: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length, request_id: `req_${Date.now()}` });
    }

    if (action === "orders") {
      return json({ orders: MOCK_ORDERS, total: MOCK_ORDERS.length, request_id: `req_${Date.now()}` });
    }

    if (action === "stock") {
      const sku = url.searchParams.get("sku");
      const product = MOCK_PRODUCTS.find((p) => p.sku === sku);
      if (product) {
        return json({ sku: product.sku, stock: product.stock, request_id: `req_${Date.now()}` });
      }
      return json({ error: "SKU not found" }, { status: 404 });
    }

    return json({
      channel: "shopee",
      api_version: "v2",
      available_actions: ["ping", "products", "orders", "stock"],
      usage: "Add ?action=ping to test connection",
    });
  },

  POST: async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const action = (body as Record<string, unknown>).action as string;

    if (action === "update_stock") {
      const { sku, qty } = body as { sku: string; qty: number };
      const product = MOCK_PRODUCTS.find((p) => p.sku === sku);
      if (product) {
        product.stock = qty;
        return json({ success: true, sku, new_stock: qty, message: `Shopee: Stock updated for ${sku}` });
      }
      return json({ success: false, error: "SKU not found" }, { status: 404 });
    }

    if (action === "simulate_order") {
      const sku = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      const order = {
        order_sn: `SH-${Date.now()}`,
        status: "READY_TO_SHIP",
        items: [{ sku: sku.sku, qty: 1 }],
        total: sku.price,
        buyer: "Khách mô phỏng",
        create_time: Date.now(),
      };
      MOCK_ORDERS.unshift(order);
      return json({ success: true, order, webhook_event: { event: "order.confirmed", data: order } });
    }

    return json({ error: "Unknown action. Use: update_stock, simulate_order" }, { status: 400 });
  },
});
