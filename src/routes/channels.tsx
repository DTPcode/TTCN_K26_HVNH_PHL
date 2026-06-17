import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { CHANNELS, SKUS, fmtVN, fmtRel } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/channels")({
  head: () => ({ meta: [{ title: "Trạng thái đồng bộ kênh — Atino" }, { name: "description", content: "Trạng thái đồng bộ chi tiết theo từng kênh bán hàng." }] }),
  component: () => <RequireAuth roles={["ecommerce_admin", "system_admin"]}>
    <AppShell title="Trạng thái đồng bộ kênh"><Body /></AppShell>
  </RequireAuth>,
});

function Body() {
  useSyncStore();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {CHANNELS.map((c) => {
        const color = c.status === "online" ? "text-emerald-600" : c.status === "delayed" ? "text-amber-600" : "text-red-600";
        const dot = c.status === "online" ? "bg-emerald-500" : c.status === "delayed" ? "bg-amber-500" : "bg-red-500";
        return (
          <Card key={c.id}><CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{c.name}</h3>
              <span className={`inline-flex items-center gap-1.5 text-sm ${color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                {c.status === "online" ? "Online" : c.status === "delayed" ? "Trễ đồng bộ" : "Lỗi kết nối"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Đồng bộ lần cuối: {fmtRel(c.lastSync)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-muted-foreground text-xs">SKU đồng bộ</div><div className="font-semibold">{fmtVN(SKUS.length)}</div></div>
              <div><div className="text-muted-foreground text-xs">Tổng tồn kho</div><div className="font-semibold">{fmtVN(SKUS.reduce((a, s) => a + s.channels[c.id], 0))}</div></div>
            </div>
          </CardContent></Card>
        );
      })}
    </div>
  );
}
