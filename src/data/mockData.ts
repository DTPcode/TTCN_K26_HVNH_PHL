// ============================================================
// Atino SyncInventory — Shared Mock Data Store
// 50 SKU (10 products × 5 variants) matching seed.sql
// Reactive in-memory store with pub/sub
// ============================================================

export type ChannelId = "store" | "shopee" | "tiktok" | "lazada" | "website";

export interface Channel {
  id: ChannelId;
  name: string;
  status: "online" | "delayed" | "error";
  lastSync: number;
  syncEnabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  basePrice: number;
  status: "active" | "inactive" | "discontinued";
  createdAt: number;
}

export interface SKU {
  sku: string;
  name: string;
  productId: string;
  size: string;
  color: string;
  price: number;
  central: number;
  lowStockThreshold: number;
  safetyBuffer: number;
  channels: Record<ChannelId, number>;
  isActive: boolean;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned";

export interface Order {
  id: string;
  orderCode: string;
  sku: string;
  channel: ChannelId;
  qty: number;
  unitPrice: number;
  total: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  note: string;
  cancelledReason?: string;
  time: number;
}

export interface SyncEvent {
  id: string;
  time: number;
  source: ChannelId;
  sku: string;
  delta: number;
  status: "success" | "processing" | "failed";
  latency: number;
}

export interface WarehouseTxn {
  id: string;
  time: number;
  type: "in" | "out" | "adjust";
  sku: string;
  qty: number;
  before: number;
  after: number;
  user: string;
  note: string;
}

export interface QueueTask {
  id: string;
  sku: string;
  target: ChannelId;
  addedAt: number;
  status: "processing" | "queued" | "failed";
  priority: boolean;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: "system_admin" | "ecommerce_admin" | "warehouse_manager";
  active: boolean;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  time: number;
  type: "transaction" | "sync" | "error" | "user_action";
  sku?: string;
  channel?: ChannelId;
  description: string;
  result: "success" | "failure";
  latency?: number;
  detail: Record<string, unknown>;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string;
  updatedAt: number;
}

export interface ChannelConfig {
  channelId: ChannelId;
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  webhookSecret: string;
  syncMode: "realtime" | "polling" | "manual";
  pollingIntervalSec: number;
  enabled: boolean;
  lastTested: number | null;
  testResult: "success" | "failed" | null;
}

export type NotificationType = "stock_out" | "stock_low" | "sync_error" | "sync_success" | "stock_request" | "stock_request_result" | "config_change" | "user_action";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: number;
  read: boolean;
  link?: string;
  targetRole?: "system_admin" | "ecommerce_admin" | "warehouse_manager" | "all";
}

export interface StockRequest {
  id: string;
  sku: string;
  skuName: string;
  qty: number;
  note: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requestedAt: number;
}

// ============================================================
// CHANNELS (5 kênh — khớp seed.sql)
// ============================================================
const now = Date.now();

export const CHANNELS: Channel[] = [
  { id: "store", name: "Cửa hàng vật lý", status: "online", lastSync: now - 12_000, syncEnabled: false },
  { id: "shopee", name: "Shopee", status: "online", lastSync: now - 8_000, syncEnabled: true },
  { id: "tiktok", name: "TikTok Shop", status: "delayed", lastSync: now - 95_000, syncEnabled: true },
  { id: "lazada", name: "Lazada", status: "online", lastSync: now - 22_000, syncEnabled: true },
  { id: "website", name: "Website Atino", status: "online", lastSync: now - 5_000, syncEnabled: false },
];

// ============================================================
// CHANNEL CONFIGS (API/Webhook per channel)
// ============================================================
export const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    channelId: "store",
    apiBaseUrl: "http://erp-pos.atino.local:8080/api/v1",
    apiKey: "erp_ak_Atino2026_store",
    apiSecret: "erp_sk_••••••••••••",
    webhookUrl: "https://sync.atino.vn/webhook/store",
    webhookSecret: "whsec_store_••••••••",
    syncMode: "realtime",
    pollingIntervalSec: 0,
    enabled: true,
    lastTested: now - 3600_000,
    testResult: "success",
  },
  {
    channelId: "shopee",
    apiBaseUrl: "https://partner.shopeemobile.com/api/v2",
    apiKey: "shopee_partner_1234567",
    apiSecret: "shopee_sk_••••••••••••",
    webhookUrl: "https://sync.atino.vn/webhook/shopee",
    webhookSecret: "whsec_shopee_••••••••",
    syncMode: "realtime",
    pollingIntervalSec: 0,
    enabled: true,
    lastTested: now - 1800_000,
    testResult: "success",
  },
  {
    channelId: "tiktok",
    apiBaseUrl: "https://open-api.tiktokglobalshop.com",
    apiKey: "tiktok_app_key_abc123",
    apiSecret: "tiktok_sk_••••••••••••",
    webhookUrl: "https://sync.atino.vn/webhook/tiktok",
    webhookSecret: "whsec_tiktok_••••••••",
    syncMode: "polling",
    pollingIntervalSec: 60,
    enabled: true,
    lastTested: now - 7200_000,
    testResult: "failed",
  },
  {
    channelId: "lazada",
    apiBaseUrl: "https://api.lazada.vn/rest",
    apiKey: "lazada_app_key_xyz789",
    apiSecret: "lazada_sk_••••••••••••",
    webhookUrl: "https://sync.atino.vn/webhook/lazada",
    webhookSecret: "whsec_lazada_••••••••",
    syncMode: "realtime",
    pollingIntervalSec: 0,
    enabled: true,
    lastTested: now - 900_000,
    testResult: "success",
  },
  {
    channelId: "website",
    apiBaseUrl: "https://api.atino.vn/v1",
    apiKey: "web_ak_atino_internal",
    apiSecret: "web_sk_••••••••••••",
    webhookUrl: "https://sync.atino.vn/webhook/website",
    webhookSecret: "whsec_web_••••••••",
    syncMode: "realtime",
    pollingIntervalSec: 0,
    enabled: true,
    lastTested: now - 600_000,
    testResult: "success",
  },
];

// ============================================================
// NOTIFICATIONS (thông báo hệ thống)
// ============================================================
export const NOTIFICATIONS: Notification[] = [
  { id: "NTF-001", type: "stock_out", title: "Hết hàng: AT-THUN-NAV-L", message: "Thun Navy - L đã hết hàng hoàn toàn. Cần nhập bổ sung ngay.", time: now - 1000 * 60 * 15, read: false, link: "/alerts" },
  { id: "NTF-002", type: "stock_low", title: "Sắp hết hàng: AT-QAAU-GRY-30", message: "Quần Âu Xám - 30 chỉ còn 1 sản phẩm, dưới ngưỡng cảnh báo.", time: now - 1000 * 60 * 30, read: false, link: "/alerts" },
  { id: "NTF-003", type: "stock_low", title: "Sắp hết hàng: AT-SOMI-WHT-L", message: "Sơ Mi Trắng - L chỉ còn 2 sản phẩm, dưới ngưỡng cảnh báo.", time: now - 1000 * 60 * 45, read: false, link: "/alerts" },
  { id: "NTF-004", type: "sync_error", title: "Lỗi đồng bộ kênh TikTok Shop", message: "Không thể kết nối API TikTok Shop. Vui lòng kiểm tra cấu hình.", time: now - 1000 * 60 * 60, read: false, link: "/channels" },
  { id: "NTF-005", type: "sync_success", title: "Đồng bộ tồn kho thành công", message: "Đã đồng bộ 50 SKU ra tất cả kênh bán hàng thành công.", time: now - 1000 * 60 * 90, read: true },
  { id: "NTF-006", type: "stock_request", title: "Yêu cầu nhập hàng AT-JOGG-BLK-L", message: "Đã tạo yêu cầu nhập 30 sản phẩm Jogger Đen - L.", time: now - 1000 * 60 * 120, read: true, link: "/alerts?tab=requests" },
  { id: "NTF-007", type: "config_change", title: "Cấu hình hệ thống đã cập nhật", message: "Safety Buffer đã được thay đổi từ 2 → 5.", time: now - 1000 * 60 * 180, read: true, link: "/admin/config" },
  { id: "NTF-008", type: "user_action", title: "Tài khoản mới được tạo", message: "Tài khoản Hoàng Văn Long (Quản lý Kho) đã được tạo thành công.", time: now - 1000 * 60 * 240, read: true, link: "/admin/users" },
];

// ============================================================
// STOCK REQUESTS (yêu cầu nhập hàng)
// ============================================================
export const STOCK_REQUESTS: StockRequest[] = [];

// ============================================================
// PRODUCTS (10 sản phẩm — khớp seed.sql)
// ============================================================
export const PRODUCTS: Product[] = [
  { id: "p1", name: "Áo Polo Pique Classic", slug: "ao-polo-pique-classic", category: "Áo Polo", brand: "Atino", basePrice: 399000, status: "active", createdAt: now - 86400000 * 60 },
  { id: "p2", name: "Áo Thun Cotton Compact", slug: "ao-thun-cotton-compact", category: "Áo Thun", brand: "Atino", basePrice: 299000, status: "active", createdAt: now - 86400000 * 55 },
  { id: "p3", name: "Sơ Mi Oxford Slim Fit", slug: "so-mi-oxford-slim-fit", category: "Áo Sơ Mi", brand: "Atino", basePrice: 499000, status: "active", createdAt: now - 86400000 * 50 },
  { id: "p4", name: "Quần Âu Wool Blend", slug: "quan-au-wool-blend", category: "Quần Âu", brand: "Atino", basePrice: 599000, status: "active", createdAt: now - 86400000 * 45 },
  { id: "p5", name: "Quần Jeans Slim Fit", slug: "quan-jeans-slim-fit", category: "Quần Jeans", brand: "Atino", basePrice: 549000, status: "active", createdAt: now - 86400000 * 40 },
  { id: "p6", name: "Quần Short Kaki", slug: "quan-short-kaki", category: "Quần Short", brand: "Atino", basePrice: 349000, status: "active", createdAt: now - 86400000 * 35 },
  { id: "p7", name: "Áo Khoác Bomber", slug: "ao-khoac-bomber", category: "Áo Khoác", brand: "Atino", basePrice: 699000, status: "active", createdAt: now - 86400000 * 30 },
  { id: "p8", name: "Hoodie French Terry", slug: "hoodie-french-terry", category: "Áo Hoodie", brand: "Atino", basePrice: 599000, status: "active", createdAt: now - 86400000 * 25 },
  { id: "p9", name: "Áo Vest Công Sở", slug: "ao-vest-cong-so", category: "Áo Vest", brand: "Atino", basePrice: 899000, status: "active", createdAt: now - 86400000 * 20 },
  { id: "p10", name: "Quần Jogger Thể Thao", slug: "quan-jogger-the-thao", category: "Quần Jogger", brand: "Atino", basePrice: 399000, status: "active", createdAt: now - 86400000 * 15 },
];

// ============================================================
// SKUS (50 biến thể — khớp seed.sql)
// ============================================================
function makeVariants(): SKU[] {
  const defs: Array<{ pid: string; sku: string; name: string; size: string; color: string; price: number; qty: number }> = [
    // Áo Polo Pique Classic
    { pid: "p1", sku: "AT-POLO-BLK-S", name: "Polo Đen - S", size: "S", color: "Đen", price: 399000, qty: 50 },
    { pid: "p1", sku: "AT-POLO-BLK-M", name: "Polo Đen - M", size: "M", color: "Đen", price: 399000, qty: 45 },
    { pid: "p1", sku: "AT-POLO-BLK-L", name: "Polo Đen - L", size: "L", color: "Đen", price: 399000, qty: 38 },
    { pid: "p1", sku: "AT-POLO-BLK-XL", name: "Polo Đen - XL", size: "XL", color: "Đen", price: 399000, qty: 22 },
    { pid: "p1", sku: "AT-POLO-WHT-M", name: "Polo Trắng - M", size: "M", color: "Trắng", price: 399000, qty: 60 },
    // Áo Thun Cotton Compact
    { pid: "p2", sku: "AT-THUN-GRY-S", name: "Thun Xám - S", size: "S", color: "Xám", price: 299000, qty: 55 },
    { pid: "p2", sku: "AT-THUN-GRY-M", name: "Thun Xám - M", size: "M", color: "Xám", price: 299000, qty: 42 },
    { pid: "p2", sku: "AT-THUN-GRY-L", name: "Thun Xám - L", size: "L", color: "Xám", price: 299000, qty: 30 },
    { pid: "p2", sku: "AT-THUN-NAV-M", name: "Thun Navy - M", size: "M", color: "Xanh Navy", price: 299000, qty: 3 },
    { pid: "p2", sku: "AT-THUN-NAV-L", name: "Thun Navy - L", size: "L", color: "Xanh Navy", price: 299000, qty: 0 },
    // Sơ Mi Oxford Slim Fit
    { pid: "p3", sku: "AT-SOMI-WHT-S", name: "Sơ Mi Trắng - S", size: "S", color: "Trắng", price: 499000, qty: 48 },
    { pid: "p3", sku: "AT-SOMI-WHT-M", name: "Sơ Mi Trắng - M", size: "M", color: "Trắng", price: 499000, qty: 35 },
    { pid: "p3", sku: "AT-SOMI-WHT-L", name: "Sơ Mi Trắng - L", size: "L", color: "Trắng", price: 499000, qty: 2 },
    { pid: "p3", sku: "AT-SOMI-BLU-M", name: "Sơ Mi Xanh Nhạt - M", size: "M", color: "Xanh Nhạt", price: 499000, qty: 40 },
    { pid: "p3", sku: "AT-SOMI-BLU-L", name: "Sơ Mi Xanh Nhạt - L", size: "L", color: "Xanh Nhạt", price: 499000, qty: 28 },
    // Quần Âu Wool Blend
    { pid: "p4", sku: "AT-QAAU-BLK-29", name: "Quần Âu Đen - 29", size: "29", color: "Đen", price: 599000, qty: 25 },
    { pid: "p4", sku: "AT-QAAU-BLK-30", name: "Quần Âu Đen - 30", size: "30", color: "Đen", price: 599000, qty: 50 },
    { pid: "p4", sku: "AT-QAAU-BLK-31", name: "Quần Âu Đen - 31", size: "31", color: "Đen", price: 599000, qty: 44 },
    { pid: "p4", sku: "AT-QAAU-GRY-30", name: "Quần Âu Xám - 30", size: "30", color: "Xám", price: 599000, qty: 1 },
    { pid: "p4", sku: "AT-QAAU-GRY-32", name: "Quần Âu Xám - 32", size: "32", color: "Xám", price: 599000, qty: 33 },
    // Quần Jeans Slim Fit
    { pid: "p5", sku: "AT-JEAN-MED-29", name: "Jeans Medium - 29", size: "29", color: "Medium Wash", price: 549000, qty: 50 },
    { pid: "p5", sku: "AT-JEAN-MED-30", name: "Jeans Medium - 30", size: "30", color: "Medium Wash", price: 549000, qty: 38 },
    { pid: "p5", sku: "AT-JEAN-MED-31", name: "Jeans Medium - 31", size: "31", color: "Medium Wash", price: 549000, qty: 20 },
    { pid: "p5", sku: "AT-JEAN-DRK-30", name: "Jeans Dark - 30", size: "30", color: "Dark Wash", price: 549000, qty: 15 },
    { pid: "p5", sku: "AT-JEAN-DRK-32", name: "Jeans Dark - 32", size: "32", color: "Dark Wash", price: 549000, qty: 0 },
    // Quần Short Kaki
    { pid: "p6", sku: "AT-SHRT-BEI-S", name: "Short Be - S", size: "S", color: "Be", price: 349000, qty: 50 },
    { pid: "p6", sku: "AT-SHRT-BEI-M", name: "Short Be - M", size: "M", color: "Be", price: 349000, qty: 45 },
    { pid: "p6", sku: "AT-SHRT-BEI-L", name: "Short Be - L", size: "L", color: "Be", price: 349000, qty: 32 },
    { pid: "p6", sku: "AT-SHRT-GRN-M", name: "Short Xanh Rêu - M", size: "M", color: "Xanh Rêu", price: 349000, qty: 18 },
    { pid: "p6", sku: "AT-SHRT-GRN-L", name: "Short Xanh Rêu - L", size: "L", color: "Xanh Rêu", price: 349000, qty: 50 },
    // Áo Khoác Bomber
    { pid: "p7", sku: "AT-BOMB-BLK-M", name: "Bomber Đen - M", size: "M", color: "Đen", price: 699000, qty: 30 },
    { pid: "p7", sku: "AT-BOMB-BLK-L", name: "Bomber Đen - L", size: "L", color: "Đen", price: 699000, qty: 25 },
    { pid: "p7", sku: "AT-BOMB-BLK-XL", name: "Bomber Đen - XL", size: "XL", color: "Đen", price: 699000, qty: 3 },
    { pid: "p7", sku: "AT-BOMB-GRN-M", name: "Bomber Xanh Rêu - M", size: "M", color: "Xanh Rêu", price: 699000, qty: 40 },
    { pid: "p7", sku: "AT-BOMB-GRN-L", name: "Bomber Xanh Rêu - L", size: "L", color: "Xanh Rêu", price: 699000, qty: 50 },
    // Hoodie French Terry
    { pid: "p8", sku: "AT-HOOD-BLK-M", name: "Hoodie Đen - M", size: "M", color: "Đen", price: 599000, qty: 50 },
    { pid: "p8", sku: "AT-HOOD-BLK-L", name: "Hoodie Đen - L", size: "L", color: "Đen", price: 599000, qty: 42 },
    { pid: "p8", sku: "AT-HOOD-BLK-XL", name: "Hoodie Đen - XL", size: "XL", color: "Đen", price: 599000, qty: 2 },
    { pid: "p8", sku: "AT-HOOD-GRY-M", name: "Hoodie Xám - M", size: "M", color: "Xám", price: 599000, qty: 35 },
    { pid: "p8", sku: "AT-HOOD-GRY-L", name: "Hoodie Xám - L", size: "L", color: "Xám", price: 599000, qty: 50 },
    // Áo Vest Công Sở
    { pid: "p9", sku: "AT-VEST-BLK-M", name: "Vest Đen - M", size: "M", color: "Đen", price: 899000, qty: 20 },
    { pid: "p9", sku: "AT-VEST-BLK-L", name: "Vest Đen - L", size: "L", color: "Đen", price: 899000, qty: 15 },
    { pid: "p9", sku: "AT-VEST-BLK-XL", name: "Vest Đen - XL", size: "XL", color: "Đen", price: 899000, qty: 50 },
    { pid: "p9", sku: "AT-VEST-NAV-M", name: "Vest Navy - M", size: "M", color: "Xanh Navy", price: 899000, qty: 1 },
    { pid: "p9", sku: "AT-VEST-NAV-L", name: "Vest Navy - L", size: "L", color: "Xanh Navy", price: 899000, qty: 28 },
    // Quần Jogger Thể Thao
    { pid: "p10", sku: "AT-JOGG-BLK-S", name: "Jogger Đen - S", size: "S", color: "Đen", price: 399000, qty: 50 },
    { pid: "p10", sku: "AT-JOGG-BLK-M", name: "Jogger Đen - M", size: "M", color: "Đen", price: 399000, qty: 40 },
    { pid: "p10", sku: "AT-JOGG-BLK-L", name: "Jogger Đen - L", size: "L", color: "Đen", price: 399000, qty: 0 },
    { pid: "p10", sku: "AT-JOGG-GRY-M", name: "Jogger Xám - M", size: "M", color: "Xám", price: 399000, qty: 22 },
    { pid: "p10", sku: "AT-JOGG-GRY-L", name: "Jogger Xám - L", size: "L", color: "Xám", price: 399000, qty: 50 },
  ];

  const buf = 2; // default_safety_buffer = 2 (khớp SETTINGS)

  return defs.map((d) => {
    const channelQty = Math.max(0, d.qty - buf);
    return {
      sku: d.sku,
      name: d.name,
      productId: d.pid,
      size: d.size,
      color: d.color,
      price: d.price,
      central: d.qty,
      lowStockThreshold: 3,
      safetyBuffer: buf,
      channels: {
        store: d.qty,         // Cửa hàng vật lý = tồn kho trung tâm (không buffer)
        shopee: channelQty,   // Tất cả kênh TMĐT = central - safetyBuffer
        tiktok: channelQty,
        lazada: channelQty,
        website: channelQty,
      },
      isActive: true,
    };
  });
}

export const SKUS: SKU[] = makeVariants();

// ============================================================
// SYSTEM SETTINGS (khớp seed.sql)
// ============================================================
export const SETTINGS: SystemSetting[] = [
  { key: "default_low_stock_threshold", value: "3", description: "Ngưỡng cảnh báo tồn kho thấp mặc định cho toàn hệ thống", updatedAt: now - 86400000 * 7 },
  { key: "default_safety_buffer", value: "2", description: "Ngưỡng đệm an toàn mặc định khi đồng bộ tồn kho ra sàn TMĐT", updatedAt: now - 86400000 * 7 },
  { key: "sync_interval_seconds", value: "300", description: "Khoảng thời gian đồng bộ định kỳ giữa các kênh (giây)", updatedAt: now - 86400000 * 7 },
  { key: "sync_max_retries", value: "3", description: "Số lần retry tối đa khi đồng bộ thất bại", updatedAt: now - 86400000 * 7 },
  { key: "priority_queue_threshold", value: "5", description: "Ngưỡng tồn kho để ưu tiên xử lý đồng bộ (Priority Queue)", updatedAt: now - 86400000 * 7 },
];

// ============================================================
// ORDERS (20 đơn hàng mẫu với trạng thái đầy đủ)
// ============================================================
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const channelIds: ChannelId[] = ["store", "shopee", "tiktok", "lazada", "website"];
const customerNames = ["Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Minh Đức", "Hoàng Thị Thanh", "Vũ Đình Khoa", "Đỗ Thị Mai", "Bùi Quang Nam", "Ngô Thanh Phong", "Dương Thị Quỳnh"];
const addresses = ["123 Lê Lợi, Q.1, TP.HCM", "45 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội", "78 Nguyễn Huệ, Q.1, TP.HCM", "12 Phan Đình Phùng, Ba Đình, Hà Nội", "90 Hai Bà Trưng, Q.3, TP.HCM"];

export const ORDERS: Order[] = Array.from({ length: 25 }, (_, i) => {
  const sku = rand(SKUS);
  const cName = rand(customerNames);
  const qty = 1 + Math.floor(Math.random() * 3);
  const status = i < 3 ? "pending" : i < 6 ? "confirmed" : i < 10 ? "processing" : i < 14 ? "shipping" : i < 20 ? "delivered" : i < 23 ? "cancelled" : "returned";
  return {
    id: `OD-${String(1000 + i).padStart(6, "0")}`,
    orderCode: `ORD-${new Date(now - i * 1000 * 60 * 47).toISOString().slice(2, 10).replace(/-/g, "")}-${String(i + 1).padStart(6, "0")}`,
    sku: sku.sku,
    channel: rand(channelIds),
    qty,
    unitPrice: sku.price,
    total: qty * sku.price,
    status: status as OrderStatus,
    customerName: cName,
    customerPhone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    customerEmail: `${cName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").split(" ").pop()}${i}@gmail.com`,
    shippingAddress: rand(addresses),
    note: i % 5 === 0 ? "Giao giờ hành chính" : "",
    cancelledReason: status === "cancelled" ? "Khách hàng yêu cầu hủy" : undefined,
    time: now - i * 1000 * 60 * 47,
  };
});

// ============================================================
// SYNC EVENTS
// ============================================================
export const SYNC_EVENTS: SyncEvent[] = Array.from({ length: 50 }, (_, i) => {
  const sku = rand(SKUS);
  return {
    id: `EV-${10000 + i}`,
    time: now - i * 1000 * 11,
    source: rand(channelIds),
    sku: sku.sku,
    delta: -1 - Math.floor(Math.random() * 3),
    status: Math.random() < 0.85 ? "success" : Math.random() < 0.5 ? "processing" : "failed",
    latency: 40 + Math.floor(Math.random() * 300),
  };
});

// ============================================================
// WAREHOUSE TRANSACTIONS
// ============================================================
export const WAREHOUSE_TXNS: WarehouseTxn[] = [
  { id: "WH-001", time: now - 1000 * 60 * 60 * 3, type: "in", sku: "AT-POLO-BLK-M", qty: 50, before: 0, after: 50, user: "Phạm Đức Kho", note: "Nhập lô mới từ NCC" },
  { id: "WH-002", time: now - 1000 * 60 * 60 * 5, type: "out", sku: "AT-JEAN-DRK-32", qty: 12, before: 12, after: 0, user: "Phạm Đức Kho", note: "Xuất chuyển kho CN HCM" },
  { id: "WH-003", time: now - 1000 * 60 * 60 * 8, type: "in", sku: "AT-THUN-NAV-M", qty: 20, before: 0, after: 20, user: "Phạm Đức Kho", note: "Nhập bổ sung sau kiểm kê" },
  { id: "WH-004", time: now - 1000 * 60 * 60 * 12, type: "adjust", sku: "AT-SOMI-WHT-L", qty: 2, before: 5, after: 2, user: "Phạm Đức Kho", note: "Kiểm kê phát hiện thiếu 3 sản phẩm" },
];

// ============================================================
// SYNC QUEUE
// ============================================================
export const QUEUE: QueueTask[] = [
  { id: "Q-001", sku: "AT-QAAU-GRY-30", target: "shopee", addedAt: now - 4_000, status: "processing", priority: true },
  { id: "Q-002", sku: "AT-VEST-NAV-M", target: "tiktok", addedAt: now - 9_000, status: "queued", priority: true },
  { id: "Q-003", sku: "AT-THUN-NAV-M", target: "lazada", addedAt: now - 14_000, status: "queued", priority: true },
  { id: "Q-004", sku: "AT-POLO-BLK-M", target: "lazada", addedAt: now - 22_000, status: "queued", priority: false },
  { id: "Q-005", sku: "AT-HOOD-BLK-M", target: "shopee", addedAt: now - 31_000, status: "queued", priority: false },
  { id: "Q-006", sku: "AT-BOMB-BLK-L", target: "tiktok", addedAt: now - 45_000, status: "failed", priority: false },
];

// ============================================================
// USERS
// ============================================================
export const USERS: UserAccount[] = [
  { id: "U-1", fullName: "Nguyễn Văn Admin", email: "admin@atino.vn", role: "system_admin", active: true, createdAt: now - 86400000 * 120 },
  { id: "U-2", fullName: "Trần Thị Ecom", email: "ecom@atino.vn", role: "ecommerce_admin", active: true, createdAt: now - 86400000 * 90 },
  { id: "U-3", fullName: "Phạm Đức Kho", email: "warehouse@atino.vn", role: "warehouse_manager", active: true, createdAt: now - 86400000 * 60 },
  { id: "U-4", fullName: "Phạm Minh Anh", email: "anh.pm@atino.vn", role: "ecommerce_admin", active: false, createdAt: now - 86400000 * 30 },
  { id: "U-5", fullName: "Hoàng Văn Long", email: "long.hv@atino.vn", role: "warehouse_manager", active: true, createdAt: now - 86400000 * 10 },
];

// ============================================================
// LOGS
// ============================================================
export const LOGS: LogEntry[] = Array.from({ length: 60 }, (_, i) => {
  const types: LogEntry["type"][] = ["transaction", "sync", "error", "user_action"];
  const t = types[i % 4];
  const sku = rand(SKUS);
  const ch = rand(channelIds);
  return {
    id: `LOG-${20000 + i}`,
    time: now - i * 1000 * 60 * 4,
    type: t,
    sku: t === "user_action" ? undefined : sku.sku,
    channel: t === "user_action" ? undefined : ch,
    description:
      t === "transaction" ? `Giao dịch bán -${1 + (i % 3)} tại ${ch}` :
      t === "sync" ? `Đồng bộ tồn kho tới ${ch}` :
      t === "error" ? `Lỗi kết nối API ${ch}` :
      `Người dùng admin đăng nhập`,
    result: t === "error" ? "failure" : (i % 11 === 0 ? "failure" : "success"),
    latency: 40 + Math.floor(Math.random() * 400),
    detail: { source: ch, payload: { sku: sku.sku, qty: 1 + (i % 3) }, requestId: `req_${i}` },
  };
});

// ============================================================
// REACTIVE STORE (pub/sub)
// ============================================================
type Listener = () => void;
const listeners = new Set<Listener>();
let _idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}${++_idCounter}-${Date.now()}`;
}
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function emit(): void {
  listeners.forEach((l) => l());
}

// ============================================================
// MUTATIONS
// ============================================================
export function applyStockChange(sku: string, delta: number, source: ChannelId, _user = "Hệ thống"): SyncEvent {
  const s = SKUS.find((x) => x.sku === sku);
  const ev: SyncEvent = {
    id: nextId("EV-"),
    time: Date.now(),
    source,
    sku,
    delta,
    status: "processing",
    latency: 60 + Math.floor(Math.random() * 250),
  };
  SYNC_EVENTS.unshift(ev);
  if (s) {
    s.central = Math.max(0, s.central + delta);
    // Kênh TMĐT nhận qty đã trừ safetyBuffer (nghiệp vụ Buffer an toàn)
    channelIds.forEach((c) => {
      const buf = (c === "store") ? 0 : s.safetyBuffer;
      s.channels[c] = Math.max(0, s.central - buf);
    });
    // Auto notification khi tồn kho thay đổi ngưỡng — gửi cho cả ecommerce_admin và warehouse_manager
    if (s.central === 0) {
      addNotification("stock_out", `Hết hàng: ${sku}`, `${s.name} đã hết hàng hoàn toàn. Cần nhập bổ sung ngay.`, "/alerts", "all");
    } else if (s.central > 0 && s.central <= s.lowStockThreshold) {
      addNotification("stock_low", `Sắp hết hàng: ${sku}`, `${s.name} chỉ còn ${s.central} sản phẩm, dưới ngưỡng cảnh báo.`, "/alerts", "all");
    }
  }
  emit();
  setTimeout(() => {
    ev.status = Math.random() < 0.92 ? "success" : "failed";
    emit();
  }, 1200);
  return ev;
}

export function addWarehouseTxn(t: Omit<WarehouseTxn, "id" | "time" | "before" | "after">): void {
  const s = SKUS.find((x) => x.sku === t.sku);
  if (!s) return;
  const before = s.central;
  const after = Math.max(0, before + (t.type === "in" ? t.qty : -t.qty));
  s.central = after;
  channelIds.forEach((c) => {
    const buf = (c === "store") ? 0 : s.safetyBuffer;
    s.channels[c] = Math.max(0, after - buf);
  });
  WAREHOUSE_TXNS.unshift({
    ...t,
    id: nextId("WH-"),
    time: Date.now(),
    before,
    after,
  });
  SYNC_EVENTS.unshift({
    id: nextId("EV-"),
    time: Date.now(),
    source: "store",
    sku: t.sku,
    delta: t.type === "in" ? t.qty : -t.qty,
    status: "success",
    latency: 80 + Math.floor(Math.random() * 200),
  });
  emit();
}

export function manualAdjust(sku: string, newCentral: number): void {
  const s = SKUS.find((x) => x.sku === sku);
  if (!s) return;
  const delta = newCentral - s.central;
  s.central = newCentral;
  channelIds.forEach((c) => {
    const buf = (c === "store") ? 0 : s.safetyBuffer;
    s.channels[c] = Math.max(0, newCentral - buf);
  });
  SYNC_EVENTS.unshift({
    id: nextId("EV-"),
    time: Date.now(),
    source: "store",
    sku,
    delta,
    status: "success",
    latency: 70,
  });
  emit();
}

export function updateSetting(key: string, value: string): void {
  const s = SETTINGS.find((x) => x.key === key);
  if (s) {
    const oldValue = s.value;
    s.value = value;
    s.updatedAt = Date.now();
    if (oldValue !== value) {
      addNotification("config_change", `Cấu hình "${s.description}" đã cập nhật`, `Giá trị thay đổi: ${oldValue} → ${value}`, "/admin/config");
    }
  }
  emit();
}

export function updateChannelConfig(channelId: ChannelId, updates: Partial<Omit<ChannelConfig, "channelId">>): void {
  const cfg = CHANNEL_CONFIGS.find((c) => c.channelId === channelId);
  if (cfg) Object.assign(cfg, updates);
  emit();
}

export function testChannelConnection(channelId: ChannelId): Promise<boolean> {
  return new Promise((resolve) => {
    const cfg = CHANNEL_CONFIGS.find((c) => c.channelId === channelId);
    if (!cfg) { resolve(false); return; }
    // Simulate API test with random success (90% chance)
    setTimeout(() => {
      const success = Math.random() < 0.9;
      cfg.lastTested = Date.now();
      cfg.testResult = success ? "success" : "failed";
      emit();
      resolve(success);
    }, 800 + Math.floor(Math.random() * 1200));
  });
}

export function addProduct(p: Omit<Product, "id" | "createdAt">): Product {
  const prod: Product = { ...p, id: `p${Date.now()}`, createdAt: Date.now() };
  PRODUCTS.push(prod);
  emit();
  return prod;
}

export function updateProduct(id: string, updates: Partial<Pick<Product, "name" | "category" | "basePrice" | "status">>): void {
  const p = PRODUCTS.find((x) => x.id === id);
  if (p) Object.assign(p, updates);
  emit();
}

// ============================================================
// FORMATTERS
// ============================================================
export function fmtVN(n: number): string {
  return n.toLocaleString("vi-VN");
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString("vi-VN", { hour12: false });
}

export function fmtRel(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return `${d}s trước`;
  if (d < 3600) return `${Math.floor(d / 60)} phút trước`;
  if (d < 86400) return `${Math.floor(d / 3600)} giờ trước`;
  return `${Math.floor(d / 86400)} ngày trước`;
}

export function fmtCurrency(n: number): string {
  return n.toLocaleString("vi-VN") + " ₫";
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  returned: "Trả hàng",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipping: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  returned: "bg-orange-100 text-orange-800 border-orange-200",
};

export function useMockSubscribe(): number {
  return 0;
}

// ============================================================
// NOTIFICATION MUTATIONS
// ============================================================
export function addNotification(type: NotificationType, title: string, message: string, link?: string, targetRole?: Notification["targetRole"]): void {
  NOTIFICATIONS.unshift({
    id: nextId("NTF-"),
    type,
    title,
    message,
    time: Date.now(),
    read: false,
    link,
    targetRole: targetRole || "all",
  });
  // Keep only latest 50 notifications
  if (NOTIFICATIONS.length > 50) NOTIFICATIONS.length = 50;
  emit();
}

export function markNotificationRead(id: string): void {
  const n = NOTIFICATIONS.find((x) => x.id === id);
  if (n) n.read = true;
  emit();
}

export function markAllNotificationsRead(): void {
  NOTIFICATIONS.forEach((n) => (n.read = true));
  emit();
}

// ============================================================
// STOCK REQUEST MUTATIONS
// ============================================================
export function createStockRequest(sku: string, skuName: string, qty: number, note: string, requestedBy: string): void {
  STOCK_REQUESTS.unshift({
    id: nextId("SR-"),
    sku,
    skuName,
    qty,
    note,
    status: "pending",
    requestedBy,
    requestedAt: Date.now(),
  });
  // Gửi thông báo cho Quản lý Kho
  addNotification(
    "stock_request",
    `Yêu cầu nhập hàng ${sku}`,
    `${requestedBy} yêu cầu nhập ${qty} sản phẩm ${skuName}. Vui lòng duyệt tại trang Cảnh báo tồn kho.`,
    "/alerts?tab=requests",
    "warehouse_manager"
  );
}

export function approveStockRequest(requestId: string, approvedBy: string): boolean {
  const req = STOCK_REQUESTS.find((r) => r.id === requestId);
  if (!req || req.status !== "pending") return false;

  req.status = "approved";

  // Tự động nhập kho — gọi addWarehouseTxn
  addWarehouseTxn({
    type: "in",
    sku: req.sku,
    qty: req.qty,
    user: approvedBy,
    note: `Nhập kho theo yêu cầu ${req.id} từ ${req.requestedBy}${req.note ? " — " + req.note : ""}`,
  });

  // Gửi thông báo ngược cho Admin TMĐT
  addNotification(
    "stock_request_result",
    `Yêu cầu nhập ${req.sku} đã được duyệt`,
    `${approvedBy} đã duyệt yêu cầu nhập ${req.qty} sản phẩm ${req.skuName}. Tồn kho đã được cập nhật.`,
    "/alerts?tab=requests",
    "ecommerce_admin"
  );

  return true;
}

export function rejectStockRequest(requestId: string, rejectedBy: string, reason?: string): boolean {
  const req = STOCK_REQUESTS.find((r) => r.id === requestId);
  if (!req || req.status !== "pending") return false;

  req.status = "rejected";

  // Gửi thông báo ngược cho Admin TMĐT
  addNotification(
    "stock_request_result",
    `Yêu cầu nhập ${req.sku} đã bị từ chối`,
    `${rejectedBy} đã từ chối yêu cầu nhập ${req.qty} sản phẩm ${req.skuName}.${reason ? " Lý do: " + reason : ""}`,
    "/alerts?tab=requests",
    "ecommerce_admin"
  );

  return true;
}
