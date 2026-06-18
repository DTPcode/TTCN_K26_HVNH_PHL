import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import {
  ORDERS, CHANNELS, SKUS, fmtVN, fmtTime, fmtCurrency,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  type Order, type OrderStatus,
} from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search, Eye, ShoppingCart, Package, User, MapPin, Phone, Mail, FileText,
} from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Quản lý đơn hàng — Atino SyncInventory" },
      { name: "description", content: "Danh sách đơn hàng từ tất cả kênh bán hàng với bộ lọc và chi tiết." },
    ],
  }),
  component: () => (
    <RequireAuth roles={["ecommerce_admin", "system_admin"]}>
      <AppShell title="Quản lý đơn hàng">
        <OrdersBody />
      </AppShell>
    </RequireAuth>
  ),
});

function OrdersBody() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return ORDERS.filter((o) => {
      if (channelFilter !== "all" && o.channel !== channelFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return o.id.toLowerCase().includes(q) || o.orderCode.toLowerCase().includes(q) || o.sku.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, channelFilter, statusFilter]);

  // Summary stats
  const totalOrders = ORDERS.length;
  const totalRevenue = ORDERS.filter((o) => o.status !== "cancelled" && o.status !== "returned").reduce((a, o) => a + o.total, 0);
  const pendingCount = ORDERS.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{fmtVN(totalOrders)}</div>
              <div className="text-xs text-muted-foreground">Tổng đơn hàng</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 grid place-items-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{fmtCurrency(totalRevenue)}</div>
              <div className="text-xs text-muted-foreground">Doanh thu (trừ hủy/trả)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 grid place-items-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Chờ xác nhận</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mã đơn, SKU, khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-72"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả kênh</SelectItem>
            {CHANNELS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground ml-auto">
          Hiển thị {filtered.length}/{ORDERS.length} đơn
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState message="Không tìm thấy đơn hàng nào" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2.5">Mã đơn</th>
                  <th className="px-4 py-2.5">Thời gian</th>
                  <th className="px-4 py-2.5">Kênh</th>
                  <th className="px-4 py-2.5">Khách hàng</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5 text-right">SL</th>
                  <th className="px-4 py-2.5 text-right">Tổng tiền</th>
                  <th className="px-4 py-2.5 text-center">Trạng thái</th>
                  <th className="px-4 py-2.5 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs">{o.id}</td>
                    <td className="px-4 py-2.5 text-xs">{fmtTime(o.time)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline">{CHANNELS.find((c) => c.id === o.channel)?.name}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{o.sku}</td>
                    <td className="px-4 py-2.5 text-right">{fmtVN(o.qty)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{fmtCurrency(o.total)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={`${ORDER_STATUS_COLORS[o.status]} hover:${ORDER_STATUS_COLORS[o.status].split(" ")[0]}`}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Button variant="ghost" size="sm" onClick={() => setViewOrder(o)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      {viewOrder && (
        <OrderDetailDialog order={viewOrder} onClose={() => setViewOrder(null)} />
      )}
    </div>
  );
}

function OrderDetailDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const product = SKUS.find((s) => s.sku === order.sku);
  const channel = CHANNELS.find((c) => c.id === order.channel);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Chi tiết đơn hàng {order.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Mã đơn hàng</div>
              <div className="font-mono font-medium">{order.id}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Thời gian</div>
              <div>{fmtTime(order.time)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Kênh bán</div>
              <Badge variant="outline">{channel?.name}</Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Trạng thái</div>
              <Badge className={ORDER_STATUS_COLORS[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Thông tin khách hàng
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {order.customerName}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                {order.customerPhone}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {order.customerEmail}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {order.shippingAddress}
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Details */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Sản phẩm
            </h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{product?.name || order.sku}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{order.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">SL: {order.qty} × {fmtCurrency(order.unitPrice)}</div>
                  <div className="font-bold text-lg">{fmtCurrency(order.total)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Note / Cancel Reason */}
          {(order.note || order.cancelledReason) && (
            <>
              <Separator />
              <div className="text-sm">
                {order.note && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                    <span>Ghi chú: {order.note}</span>
                  </div>
                )}
                {order.cancelledReason && (
                  <div className="flex items-start gap-2 text-red-600 mt-1">
                    <FileText className="w-3.5 h-3.5 mt-0.5" />
                    <span>Lý do hủy: {order.cancelledReason}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
