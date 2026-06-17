// Shared mock data store for Atino SyncInventory.
// Mutations happen in-memory and notify subscribers so screens re-render.

export type ChannelId = "store" | "shopee" | "tiktok" | "lazada" | "website";

export interface Channel {
  id: ChannelId;
  name: string;
  status: "online" | "delayed" | "error";
  lastSync: number;
}

export interface SKU {
  sku: string;
  name: string;
  central: number;
  channels: Record<ChannelId, number>;
}

export interface Order {
  id: string;
  sku: string;
  channel: ChannelId;
  qty: number;
  time: number;
  total: number;
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
  type: "in" | "out";
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

const now = Date.now();

export const CHANNELS: Channel[] = [
  { id: "store", name: "Cửa hàng", status: "online", lastSync: now - 12_000 },
  { id: "shopee", name: "Shopee", status: "online", lastSync: now - 8_000 },
  { id: "tiktok", name: "TikTok Shop", status: "delayed", lastSync: now - 95_000 },
  { id: "lazada", name: "Lazada", status: "online", lastSync: now - 22_000 },
  { id: "website", name: "Website", status: "error", lastSync: now - 320_000 },
];

const baseSkus: Array<Omit<SKU, "channels"> & { variance: number }> = [
  { sku: "AT-POLO-001-M", name: "Áo Polo Basic Nam - M", central: 124, variance: 0 },
  { sku: "AT-POLO-001-L", name: "Áo Polo Basic Nam - L", central: 87, variance: 0 },
  { sku: "AT-JEANS-002-L", name: "Quần Jeans Slim Fit - L", central: 56, variance: 1 },
  { sku: "AT-JEANS-002-XL", name: "Quần Jeans Slim Fit - XL", central: 3, variance: 0 },
  { sku: "AT-SHIRT-003-M", name: "Áo Sơ Mi Trắng Nam - M", central: 0, variance: 0 },
  { sku: "AT-DRESS-004-S", name: "Đầm Hoa Nữ - S", central: 2, variance: 0 },
  { sku: "AT-TSHIRT-005-M", name: "Áo Thun Cotton - M", central: 210, variance: 2 },
  { sku: "AT-HOODIE-006-L", name: "Áo Hoodie Nỉ - L", central: 45, variance: 0 },
  { sku: "AT-SKIRT-007-S", name: "Chân Váy Xếp Ly - S", central: 3, variance: 0 },
  { sku: "AT-JACKET-008-M", name: "Áo Khoác Bomber - M", central: 31, variance: 0 },
];

export const SKUS: SKU[] = baseSkus.map((s) => ({
  sku: s.sku,
  name: s.name,
  central: s.central,
  channels: {
    store: Math.max(0, s.central - s.variance),
    shopee: Math.max(0, s.central - (s.variance > 0 ? 1 : 0)),
    tiktok: Math.max(0, s.central),
    lazada: Math.max(0, s.central - s.variance),
    website: Math.max(0, s.central),
  },
}));

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const channelIds: ChannelId[] = ["store", "shopee", "tiktok", "lazada", "website"];

export const ORDERS: Order[] = Array.from({ length: 20 }, (_, i) => {
  const sku = rand(SKUS);
  return {
    id: `OD-${1000 + i}`,
    sku: sku.sku,
    channel: rand(channelIds),
    qty: 1 + Math.floor(Math.random() * 3),
    time: now - i * 1000 * 60 * 17,
    total: (200_000 + Math.floor(Math.random() * 600_000)),
  };
});

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

export const WAREHOUSE_TXNS: WarehouseTxn[] = [
  {
    id: "WH-001", time: now - 1000 * 60 * 60 * 3, type: "in", sku: "AT-POLO-001-M",
    qty: 50, before: 74, after: 124, user: "Lê Văn Kho", note: "Nhập lô mới từ NCC Việt Tiến",
  },
  {
    id: "WH-002", time: now - 1000 * 60 * 60 * 8, type: "out", sku: "AT-JEANS-002-XL",
    qty: 12, before: 15, after: 3, user: "Lê Văn Kho", note: "Xuất chuyển kho CN HCM",
  },
];

export const QUEUE: QueueTask[] = [
  { id: "Q-001", sku: "AT-JEANS-002-XL", target: "shopee", addedAt: now - 4_000, status: "processing", priority: true },
  { id: "Q-002", sku: "AT-DRESS-004-S", target: "tiktok", addedAt: now - 9_000, status: "queued", priority: true },
  { id: "Q-003", sku: "AT-SKIRT-007-S", target: "website", addedAt: now - 14_000, status: "queued", priority: true },
  { id: "Q-004", sku: "AT-POLO-001-M", target: "lazada", addedAt: now - 22_000, status: "queued", priority: false },
  { id: "Q-005", sku: "AT-TSHIRT-005-M", target: "shopee", addedAt: now - 31_000, status: "queued", priority: false },
  { id: "Q-006", sku: "AT-HOODIE-006-L", target: "tiktok", addedAt: now - 45_000, status: "failed", priority: false },
];

export const USERS: UserAccount[] = [
  { id: "U-1", fullName: "Nguyễn Quản Trị", email: "admin@atino.vn", role: "system_admin", active: true, createdAt: now - 1000 * 60 * 60 * 24 * 120 },
  { id: "U-2", fullName: "Trần Thị TMĐT", email: "ecom@atino.vn", role: "ecommerce_admin", active: true, createdAt: now - 1000 * 60 * 60 * 24 * 90 },
  { id: "U-3", fullName: "Lê Văn Kho", email: "kho@atino.vn", role: "warehouse_manager", active: true, createdAt: now - 1000 * 60 * 60 * 24 * 60 },
  { id: "U-4", fullName: "Phạm Minh Anh", email: "anh.pm@atino.vn", role: "ecommerce_admin", active: false, createdAt: now - 1000 * 60 * 60 * 24 * 30 },
  { id: "U-5", fullName: "Hoàng Văn Long", email: "long.hv@atino.vn", role: "warehouse_manager", active: true, createdAt: now - 1000 * 60 * 60 * 24 * 10 },
];

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

// --- Reactive store ---
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function emit(): void {
  listeners.forEach((l) => l());
}

export function applyStockChange(sku: string, delta: number, source: ChannelId, user = "Hệ thống"): SyncEvent {
  const s = SKUS.find((x) => x.sku === sku);
  const ev: SyncEvent = {
    id: `EV-${Date.now()}`,
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
    channelIds.forEach((c) => { s.channels[c] = Math.max(0, s.channels[c] + delta); });
  }
  void user;
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
  channelIds.forEach((c) => { s.channels[c] = after; });
  WAREHOUSE_TXNS.unshift({
    ...t,
    id: `WH-${Date.now()}`,
    time: Date.now(),
    before,
    after,
  });
  // also log a sync event
  SYNC_EVENTS.unshift({
    id: `EV-${Date.now()}`,
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
  channelIds.forEach((c) => { s.channels[c] = newCentral; });
  SYNC_EVENTS.unshift({
    id: `EV-${Date.now()}`,
    time: Date.now(),
    source: "store",
    sku,
    delta,
    status: "success",
    latency: 70,
  });
  emit();
}

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

export function useMockSubscribe(): number {
  // Minimal reactive hook implemented at point of use to keep this file framework-free.
  // Components import useSyncStore from '@/lib/useSyncStore' instead.
  return 0;
}
