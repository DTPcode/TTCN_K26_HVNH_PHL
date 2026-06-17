import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { SKUS, PRODUCTS, fmtVN, fmtRel } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AlertTriangle, PackageX, Search, TrendingDown } from "lucide-react";

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

function AlertsBody() {
  useSyncStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"low" | "out">("low");

  // Không cần useMemo vì useSyncStore() đã trigger re-render khi data thay đổi
  const outOfStock = SKUS.filter((s) => s.isActive && s.central === 0);
  const lowStock = SKUS.filter((s) => s.isActive && s.central > 0 && s.central <= s.lowStockThreshold);

  const filtered = (tab === "low" ? lowStock : outOfStock).filter(
    (s) => s.sku.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div>

      {/* Tabs + Search */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "low" | "out")}>
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
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo SKU hoặc tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="low" className="mt-4">
          <AlertTable items={filtered} type="low" />
        </TabsContent>
        <TabsContent value="out" className="mt-4">
          <AlertTable items={filtered} type="out" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertTable({ items, type }: { items: typeof SKUS; type: "low" | "out" }) {
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
