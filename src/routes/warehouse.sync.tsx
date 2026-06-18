import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { CHANNELS, SKUS, fmtVN, fmtRel, type ChannelId } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, RefreshCw, CheckCircle, AlertTriangle, XCircle, ArrowRightLeft,
} from "lucide-react";

export const Route = createFileRoute("/warehouse/sync")({
  head: () => ({
    meta: [
      { title: "Trạng thái đồng bộ — Atino SyncInventory" },
      { name: "description", content: "Giám sát trạng thái đồng bộ tồn kho giữa kho trung tâm và các kênh bán hàng." },
    ],
  }),
  component: () => (
    <RequireAuth roles={["warehouse_manager", "system_admin"]}>
      <AppShell title="Trạng thái đồng bộ tồn kho">
        <SyncBody />
      </AppShell>
    </RequireAuth>
  ),
});

function SyncBody() {
  useSyncStore();
  const [search, setSearch] = useState("");
  const [onlyDiff, setOnlyDiff] = useState(false);

  const ecomChannels = CHANNELS.filter((c) => c.syncEnabled);

  const skuDiffData = useMemo(() => {
    return SKUS.filter((s) => s.isActive).map((s) => {
      const diffs: Record<ChannelId, number> = {} as Record<ChannelId, number>;
      let hasDiff = false;
      ecomChannels.forEach((c) => {
        const diff = s.channels[c.id] - s.central;
        diffs[c.id] = diff;
        if (diff !== 0) hasDiff = true;
      });
      return { ...s, diffs, hasDiff };
    });
  }, [ecomChannels]);

  const filtered = skuDiffData.filter((s) => {
    if (onlyDiff && !s.hasDiff) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    }
    return true;
  });

  const totalDiffCount = skuDiffData.filter((s) => s.hasDiff).length;

  return (
    <div className="space-y-5">
      {/* Channel Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ecomChannels.map((c) => {
          const Icon = c.status === "online" ? CheckCircle : c.status === "delayed" ? AlertTriangle : XCircle;
          const colorCls = c.status === "online" ? "text-emerald-600 bg-emerald-100" : c.status === "delayed" ? "text-amber-600 bg-amber-100" : "text-red-600 bg-red-100";
          const statusLabel = c.status === "online" ? "Đồng bộ tốt" : c.status === "delayed" ? "Trễ đồng bộ" : "Lỗi kết nối";
          const totalQty = SKUS.filter((s) => s.isActive).reduce((a, s) => a + s.channels[c.id], 0);
          return (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg grid place-items-center ${colorCls}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{statusLabel}</div>
                    </div>
                  </div>
                  <RefreshCw className="w-4 h-4 text-muted-foreground/50" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Tổng tồn kho</div>
                    <div className="font-semibold">{fmtVN(totalQty)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Lần sync cuối</div>
                    <div className="font-semibold text-xs">{fmtRel(c.lastSync)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm theo SKU hoặc tên..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyDiff}
              onChange={(e) => setOnlyDiff(e.target.checked)}
              className="rounded border-input"
            />
            Chỉ hiện sai lệch
          </label>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRightLeft className="w-4 h-4" />
          <span>{totalDiffCount} SKU có sai lệch / {skuDiffData.length} tổng SKU</span>
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState message="Không có dữ liệu phù hợp" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2.5 sticky left-0 bg-muted/50">SKU</th>
                  <th className="px-4 py-2.5">Tên sản phẩm</th>
                  <th className="px-4 py-2.5 text-right">Kho trung tâm</th>
                  {ecomChannels.map((c) => (
                    <th key={c.id} className="px-4 py-2.5 text-right">{c.name}</th>
                  ))}
                  <th className="px-4 py-2.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.sku} className={`border-t transition-colors ${s.hasDiff ? "bg-amber-50/40" : "hover:bg-muted/20"}`}>
                    <td className="px-4 py-2.5 font-mono text-xs sticky left-0 bg-inherit">{s.sku}</td>
                    <td className="px-4 py-2.5">{s.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{fmtVN(s.central)}</td>
                    {ecomChannels.map((c) => {
                      const diff = s.diffs[c.id];
                      return (
                        <td key={c.id} className="px-4 py-2.5 text-right">
                          <span className="font-medium">{fmtVN(s.channels[c.id])}</span>
                          {diff !== 0 && (
                            <span className={`ml-1.5 text-xs font-semibold ${diff > 0 ? "text-blue-600" : "text-red-600"}`}>
                              ({diff > 0 ? "+" : ""}{diff})
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-center">
                      {s.hasDiff ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Sai lệch</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Đồng bộ</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
