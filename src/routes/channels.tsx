import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { CHANNELS, SKUS, PRODUCTS, fmtVN, fmtRel, getGlobalSafetyBuffer, type ChannelId } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Trạng thái đồng bộ kênh — Atino" },
      { name: "description", content: "Trạng thái đồng bộ chi tiết theo từng kênh bán hàng." },
    ],
  }),
  component: () => (
    <RequireAuth roles={["ecommerce_admin", "system_admin"]}>
      <AppShell title="Trạng thái đồng bộ kênh">
        <Body />
      </AppShell>
    </RequireAuth>
  ),
});

const channelIds: ChannelId[] = ["store", "shopee", "tiktok", "lazada", "website"];

function Body() {
  useSyncStore();
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<ChannelId | "all">("all");

  // Tạo danh sách sản phẩm cha để filter
  const productOptions = useMemo(
    () => PRODUCTS.map((p) => ({ id: p.id, name: p.name })),
    [],
  );

  // Bảng chi tiết SKU theo kênh
  const skuRows = useMemo(() => {
    return SKUS.filter((s) => s.isActive).map((s) => {
      const product = PRODUCTS.find((p) => p.id === s.productId);
      return { ...s, productName: product?.name || "" };
    });
  }, []);

  const filtered = skuRows.filter((s) => {
    if (filterProduct !== "all" && s.productId !== filterProduct) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.sku.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !s.productName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Kênh nào hiển thị trong bảng
  const displayChannels = filterChannel === "all"
    ? CHANNELS
    : CHANNELS.filter((c) => c.id === filterChannel);

  return (
    <div className="space-y-5">
      {/* Channel Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {CHANNELS.map((c) => {
          const Icon = c.status === "online" ? CheckCircle : c.status === "delayed" ? AlertTriangle : XCircle;
          const color = c.status === "online" ? "text-emerald-600" : c.status === "delayed" ? "text-amber-600" : "text-red-600";
          const dot = c.status === "online" ? "bg-emerald-500" : c.status === "delayed" ? "bg-amber-500" : "bg-red-500";
          const iconBg = c.status === "online" ? "bg-emerald-100" : c.status === "delayed" ? "bg-amber-100" : "bg-red-100";
          const totalQty = SKUS.filter((s) => s.isActive).reduce((a, s) => a + s.channels[c.id], 0);
          const isSelected = filterChannel === c.id;
          return (
            <Card
              key={c.id}
              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilterChannel(isSelected ? "all" : c.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg grid place-items-center ${iconBg} ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    {c.status === "online" ? "Online" : c.status === "delayed" ? "Trễ" : "Lỗi"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Đồng bộ lần cuối: {fmtRel(c.lastSync)}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">SKU</div>
                    <div className="font-semibold">{fmtVN(SKUS.filter((s) => s.isActive).length)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Tổng tồn kho</div>
                    <div className="font-semibold">{fmtVN(totalQty)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm SKU, tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-60"
            />
          </div>
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tất cả sản phẩm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả sản phẩm</SelectItem>
              {productOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filtered.length} / {skuRows.length} SKU
          {filterChannel !== "all" && (
            <button
              onClick={() => setFilterChannel("all")}
              className="ml-2 text-xs text-primary hover:underline"
            >
              Xem tất cả kênh
            </button>
          )}
        </div>
      </div>

      {/* SKU × Channel Detail Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState message="Không có dữ liệu phù hợp" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2.5 sticky left-0 bg-muted/50 z-10">SKU</th>
                  <th className="px-4 py-2.5">Tên biến thể</th>
                  <th className="px-4 py-2.5">Sản phẩm</th>
                  <th className="px-4 py-2.5 text-right">Kho trung tâm</th>
                  {displayChannels.map((c) => (
                    <th key={c.id} className="px-4 py-2.5 text-right">{c.name}</th>
                  ))}
                  <th className="px-4 py-2.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  // Kiểm tra sai lệch: channel ≠ expected (central - buffer)
                  let hasDiff = false;
                  displayChannels.forEach((c) => {
                    const buf = (c.id === "store") ? 0 : getGlobalSafetyBuffer();
                    const expected = Math.max(0, s.central - buf);
                    if (s.channels[c.id] !== expected) hasDiff = true;
                  });

                  return (
                    <tr
                      key={s.sku}
                      className={`border-t transition-colors ${hasDiff ? "bg-amber-50/40" : "hover:bg-muted/20"}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs sticky left-0 bg-inherit z-10">{s.sku}</td>
                      <td className="px-4 py-2.5">{s.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{s.productName}</td>
                      <td className="px-4 py-2.5 text-right font-bold">{fmtVN(s.central)}</td>
                      {displayChannels.map((c) => {
                        const buf = (c.id === "store") ? 0 : getGlobalSafetyBuffer();
                        const expected = Math.max(0, s.central - buf);
                        const diff = s.channels[c.id] - expected;
                        return (
                          <td key={c.id} className="px-4 py-2.5 text-right">
                            <span className="font-medium">{fmtVN(s.channels[c.id])}</span>
                            {diff !== 0 ? (
                              <span className={`ml-1 text-xs font-semibold ${diff > 0 ? "text-blue-600" : "text-red-600"}`}>
                                ({diff > 0 ? "+" : ""}{diff})
                              </span>
                            ) : buf > 0 ? (
                              <span className="ml-1 text-xs text-muted-foreground/50">
                                buf-{buf}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center">
                        {hasDiff ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Sai lệch</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Đồng bộ</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
