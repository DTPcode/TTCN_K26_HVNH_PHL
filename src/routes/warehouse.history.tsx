import { createFileRoute } from "@tanstack/react-router";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { WAREHOUSE_TXNS, SKUS, fmtVN, fmtTime } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/warehouse/history")({
  head: () => ({ meta: [{ title: "Lịch sử biến động tồn kho — Atino" }, { name: "description", content: "Lịch sử biến động tồn kho theo SKU." }] }),
  component: () => <RequireAuth roles={["warehouse_manager", "system_admin"]}>
    <AppShell title="Lịch sử biến động tồn kho"><Body /></AppShell>
  </RequireAuth>,
});

function Body() {
  useSyncStore();
  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr className="text-left">
            <th className="px-3 py-2">Thời gian</th><th className="px-3 py-2">Loại</th>
            <th className="px-3 py-2">SKU</th><th className="px-3 py-2">Tên SP</th>
            <th className="px-3 py-2 text-right">SL</th><th className="px-3 py-2 text-right">Trước</th>
            <th className="px-3 py-2 text-right">Sau</th><th className="px-3 py-2">Người thực hiện</th>
          </tr>
        </thead>
        <tbody>
          {WAREHOUSE_TXNS.length === 0 && <tr><td colSpan={8}><EmptyState /></td></tr>}
          {WAREHOUSE_TXNS.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-3 py-2 text-xs">{fmtTime(t.time)}</td>
              <td className="px-3 py-2"><Badge className={t.type === "in" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>{t.type === "in" ? "Nhập" : "Xuất"}</Badge></td>
              <td className="px-3 py-2 font-mono text-xs">{t.sku}</td>
              <td className="px-3 py-2">{SKUS.find((s) => s.sku === t.sku)?.name ?? "—"}</td>
              <td className="px-3 py-2 text-right">{fmtVN(t.qty)}</td>
              <td className="px-3 py-2 text-right">{fmtVN(t.before)}</td>
              <td className="px-3 py-2 text-right font-semibold">{fmtVN(t.after)}</td>
              <td className="px-3 py-2">{t.user}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent></Card>
  );
}
