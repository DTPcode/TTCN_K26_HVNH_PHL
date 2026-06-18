import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { SKUS, PRODUCTS, STOCK_REQUESTS, fmtVN, fmtRel, createStockRequest, approveStockRequest, rejectStockRequest, type SKU } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, PackageX, Search, TrendingDown, ClipboardPlus, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Cảnh báo tồn kho — Atino SyncInventory" },
      { name: "description", content: "Danh sách SKU sắp hết hàng và hết hàng cần xử lý." },
    ],
  }),
  component: () => (
    <RequireAuth roles={["ecommerce_admin", "system_admin", "warehouse_manager"]}>
      <AppShell title="Cảnh báo tồn kho">
        <AlertsBody />
      </AppShell>
    </RequireAuth>
  ),
});

type AlertTab = "low" | "out" | "requests";

function getInitialTab(): AlertTab {
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "requests") return "requests";
    if (t === "out") return "out";
  } catch {}
  return "low";
}

function AlertsBody() {
  useSyncStore();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<AlertTab>(getInitialTab);

  // Khi URL thay đổi (ví dụ từ notification click), đồng bộ tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "requests") setTab("requests");
    else if (t === "out") setTab("out");
  }, []);
  const [requestSku, setRequestSku] = useState<SKU | null>(null);
  const [reqQty, setReqQty] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isWarehouse = user?.role === "warehouse_manager" || user?.role === "system_admin";

  // Không cần useMemo vì useSyncStore() đã trigger re-render khi data thay đổi
  const outOfStock = SKUS.filter((s) => s.isActive && s.central === 0);
  const lowStock = SKUS.filter((s) => s.isActive && s.central > 0 && s.central <= s.lowStockThreshold);
  const pendingRequests = STOCK_REQUESTS.filter((r) => r.status === "pending").length;

  const filtered = (tab === "low" ? lowStock : outOfStock).filter(
    (s) => s.sku.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openRequestDialog = (sku: SKU) => {
    setRequestSku(sku);
    setReqQty("");
    setReqNote("");
  };

  const submitRequest = () => {
    if (!requestSku) return;
    const qty = parseInt(reqQty);
    if (!reqQty || isNaN(qty) || qty <= 0) {
      toast.error("Số lượng cần nhập phải lớn hơn 0");
      return;
    }
    setSubmitting(true);
    // Simulate API call delay
    setTimeout(() => {
      createStockRequest(requestSku.sku, requestSku.name, qty, reqNote, user?.fullName || "Hệ thống");
      toast.success("Đã gửi yêu cầu nhập hàng thành công");
      setRequestSku(null);
      setSubmitting(false);
    }, 800);
  };

  const handleApprove = (requestId: string) => {
    const success = approveStockRequest(requestId, user?.fullName || "Quản lý Kho");
    if (success) {
      toast.success("Đã duyệt yêu cầu nhập hàng. Tồn kho đã được cập nhật.");
    }
  };

  const handleReject = () => {
    if (!rejectingId) return;
    const success = rejectStockRequest(rejectingId, user?.fullName || "Quản lý Kho", rejectReason || undefined);
    if (success) {
      toast.error("Yêu cầu nhập hàng đã bị từ chối.");
    }
    setRejectingId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 grid place-items-center">
              <PackageX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{outOfStock.length}</div>
              <div className="text-xs text-muted-foreground">Hết hàng hoàn toàn</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 grid place-items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{lowStock.length}</div>
              <div className="text-xs text-muted-foreground">Sắp hết hàng</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 grid place-items-center">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{SKUS.filter((s) => s.isActive && s.central > s.lowStockThreshold).length}</div>
              <div className="text-xs text-muted-foreground">Tồn kho bình thường</div>
            </div>
          </CardContent>
        </Card>
        <Card className={pendingRequests > 0 ? "ring-2 ring-blue-200" : ""}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 grid place-items-center">
              <ClipboardPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{pendingRequests}</div>
              <div className="text-xs text-muted-foreground">Yêu cầu chờ duyệt</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as AlertTab)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="low" className="gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Sắp hết hàng
              <Badge variant="secondary" className="ml-1 text-xs">{lowStock.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="out" className="gap-1.5">
              <PackageX className="w-3.5 h-3.5" /> Hết hàng
              <Badge variant="destructive" className="ml-1 text-xs">{outOfStock.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5">
              <ClipboardPlus className="w-3.5 h-3.5" /> Yêu cầu nhập hàng
              {pendingRequests > 0 && (
                <Badge className="ml-1 text-xs bg-blue-500 text-white hover:bg-blue-500">{pendingRequests}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          {tab !== "requests" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo SKU hoặc tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        <TabsContent value="low" className="mt-4">
          <AlertTable items={filtered} type="low" onRequestImport={openRequestDialog} />
        </TabsContent>
        <TabsContent value="out" className="mt-4">
          <AlertTable items={filtered} type="out" onRequestImport={openRequestDialog} />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <StockRequestsTable isWarehouse={isWarehouse} onApprove={handleApprove} onReject={(id) => { setRejectingId(id); setRejectReason(""); }} />
        </TabsContent>
      </Tabs>

      {/* Dialog Yêu cầu nhập hàng */}
      <Dialog open={requestSku !== null} onOpenChange={(o) => !o && setRequestSku(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu nhập hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Sản phẩm</Label>
              <div className="mt-1 text-sm font-medium">{requestSku?.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{requestSku?.sku}</div>
            </div>
            <div>
              <Label>Số lượng cần nhập <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="1"
                placeholder="Nhập số lượng..."
                value={reqQty}
                onChange={(e) => setReqQty(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Ghi chú thêm (nếu có)..."
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestSku(null)}>Hủy</Button>
            <Button onClick={submitRequest} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Đang gửi...</>
              ) : (
                <><ClipboardPlus className="w-4 h-4 mr-1" /> Gửi yêu cầu</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Dialog từ chối yêu cầu nhập hàng */}
      <Dialog open={rejectingId !== null} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu nhập hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn từ chối yêu cầu nhập hàng này? Thông báo sẽ được gửi đến người yêu cầu.
            </p>
            <div>
              <Label>Lý do từ chối</Label>
              <Textarea
                placeholder="Nhập lý do từ chối (nếu có)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="w-4 h-4 mr-1" /> Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertTable({ items, type, onRequestImport }: { items: typeof SKUS; type: "low" | "out"; onRequestImport: (sku: SKU) => void }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState message={type === "low" ? "Không có SKU nào sắp hết hàng 🎉" : "Không có SKU nào hết hàng 🎉"} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-2.5">SKU</th>
              <th className="px-4 py-2.5">Tên sản phẩm</th>
              <th className="px-4 py-2.5">Sản phẩm cha</th>
              <th className="px-4 py-2.5 text-right">Tồn kho</th>
              <th className="px-4 py-2.5 text-right">Ngưỡng</th>
              <th className="px-4 py-2.5 text-center">Trạng thái</th>
              <th className="px-4 py-2.5 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => {
              const product = PRODUCTS.find((p) => p.id === s.productId);
              return (
                <tr key={s.sku} className={`border-t ${type === "out" ? "bg-red-50/50" : "bg-amber-50/30"}`}>
                  <td className="px-4 py-2.5 font-mono text-xs">{s.sku}</td>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{product?.name || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-bold">
                    <span className={type === "out" ? "text-red-600" : "text-amber-600"}>
                      {fmtVN(s.central)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{s.lowStockThreshold}</td>
                  <td className="px-4 py-2.5 text-center">
                    {type === "out" ? (
                      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Hết hàng</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Sắp hết</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      onClick={() => onRequestImport(s)}
                    >
                      <ClipboardPlus className="w-3.5 h-3.5" /> Yêu cầu nhập
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function StockRequestsTable({ isWarehouse, onApprove, onReject }: { isWarehouse: boolean; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  if (STOCK_REQUESTS.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState message="Chưa có yêu cầu nhập hàng nào 📋" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-2.5">Mã yêu cầu</th>
              <th className="px-4 py-2.5">SKU</th>
              <th className="px-4 py-2.5">Tên sản phẩm</th>
              <th className="px-4 py-2.5 text-right">Số lượng</th>
              <th className="px-4 py-2.5">Ghi chú</th>
              <th className="px-4 py-2.5 text-center">Trạng thái</th>
              <th className="px-4 py-2.5">Người yêu cầu</th>
              <th className="px-4 py-2.5">Thời gian</th>
              {isWarehouse && <th className="px-4 py-2.5 text-center">Hành động</th>}
            </tr>
          </thead>
          <tbody>
            {STOCK_REQUESTS.map((r) => (
              <tr key={r.id} className={`border-t ${r.status === "pending" ? "bg-yellow-50/30" : ""}`}>
                <td className="px-4 py-2.5 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.sku}</td>
                <td className="px-4 py-2.5 font-medium">{r.skuName}</td>
                <td className="px-4 py-2.5 text-right font-bold">{fmtVN(r.qty)}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.note || "—"}</td>
                <td className="px-4 py-2.5 text-center">
                  {r.status === "pending" && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 gap-1">
                      <Clock className="w-3 h-3" /> Chờ duyệt
                    </Badge>
                  )}
                  {r.status === "approved" && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                    </Badge>
                  )}
                  {r.status === "rejected" && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1">
                      <XCircle className="w-3 h-3" /> Từ chối
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">{r.requestedBy}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{fmtRel(r.requestedAt)}</td>
                {isWarehouse && (
                  <td className="px-4 py-2.5 text-center">
                    {r.status === "pending" ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => onApprove(r.id)}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7 text-red-700 border-red-300 hover:bg-red-50"
                          onClick={() => onReject(r.id)}
                        >
                          <XCircle className="w-3 h-3" /> Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Đã xử lý</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
