import { createFileRoute } from "@tanstack/react-router";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ORDERS, CHANNELS, SKUS, fmtVN, fmtTime } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Quản lý đơn hàng — Atino" }, { name: "description", content: "Danh sách đơn hàng từ tất cả kênh bán hàng." }] }),
  component: () => <RequireAuth roles={["ecommerce_admin", "system_admin"]}>
    <AppShell title="Quản lý đơn hàng">
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2">Mã đơn</th><th className="px-3 py-2">Thời gian</th>
              <th className="px-3 py-2">Kênh</th><th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Sản phẩm</th><th className="px-3 py-2 text-right">SL</th>
              <th className="px-3 py-2 text-right">Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.length === 0 && <tr><td colSpan={7}><EmptyState /></td></tr>}
            {ORDERS.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                <td className="px-3 py-2 text-xs">{fmtTime(o.time)}</td>
                <td className="px-3 py-2"><Badge variant="outline">{CHANNELS.find((c) => c.id === o.channel)?.name}</Badge></td>
                <td className="px-3 py-2 font-mono text-xs">{o.sku}</td>
                <td className="px-3 py-2">{SKUS.find((s) => s.sku === o.sku)?.name}</td>
                <td className="px-3 py-2 text-right">{fmtVN(o.qty)}</td>
                <td className="px-3 py-2 text-right font-semibold">{fmtVN(o.total)} ₫</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </AppShell>
  </RequireAuth>,
});
