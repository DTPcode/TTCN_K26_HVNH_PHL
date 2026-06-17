import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { CHANNELS, SKUS, ORDERS, fmtVN, fmtRel } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Boxes, Package, Receipt, AlertTriangle, Store, ShoppingBag, Music2, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/dashboard/ecommerce")({
  head: () => ({ meta: [{ title: "Tổng quan kinh doanh — Atino" }, { name: "description", content: "Dashboard kinh doanh đa kênh Atino." }] }),
  component: () => <RequireAuth roles={["ecommerce_admin", "system_admin"]}><Page /></RequireAuth>,
});

const CHANNEL_ICON = { store: Store, shopee: ShoppingBag, tiktok: Music2, lazada: ShoppingBag, website: Globe } as const;

function Page() {
  useSyncStore();
  const totalCentral = SKUS.reduce((a, s) => a + s.central, 0);
  const todayCount = ORDERS.filter((o) => Date.now() - o.time < 24 * 3600_000).length;
  const alerts = SKUS.filter((s) => s.central <= 3);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, store: 0, shopee: 0, tiktok: 0, lazada: 0, website: 0 };
  });
  // populate randomly but deterministically per day
  days.forEach((d, i) => {
    d.store = 5 + (i * 3) % 12;
    d.shopee = 8 + (i * 5) % 18;
    d.tiktok = 4 + (i * 4) % 14;
    d.lazada = 3 + (i * 2) % 9;
    d.website = 2 + (i * 3) % 7;
  });

  return (
    <AppShell title="Tổng quan kinh doanh">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Package className="w-5 h-5" />} label="SKU đang kinh doanh" value={fmtVN(SKUS.length)} />
        <Kpi icon={<Boxes className="w-5 h-5" />} label="Tồn kho trung tâm" value={fmtVN(totalCentral)} suffix="sp" />
        <Kpi icon={<Receipt className="w-5 h-5" />} label="Giao dịch hôm nay" value={fmtVN(todayCount)} />
        <Kpi icon={<AlertTriangle className="w-5 h-5" />} label="Cảnh báo tồn kho" value={fmtVN(alerts.length)} accent={alerts.length > 0 ? "danger" : undefined} />
      </div>

      <h2 className="text-sm font-semibold mt-8 mb-3">Trạng thái đồng bộ kênh</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CHANNELS.map((c) => {
          const Icon = CHANNEL_ICON[c.id];
          const synced = SKUS.length;
          const color =
            c.status === "online" ? "bg-emerald-500" : c.status === "delayed" ? "bg-amber-500" : "bg-red-500";
          return (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                </div>
                <div className="text-xs text-muted-foreground">Đồng bộ lần cuối: {fmtRel(c.lastSync)}</div>
                <div className="text-xs mt-1">{fmtVN(synced)} SKU đã đồng bộ</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Cảnh báo tồn kho</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead className="text-right">Tồn trung tâm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SKUS.filter((s) => s.central <= 5).map((s) => {
                  const status = s.central === 0 ? "Hết hàng" : s.central <= 3 ? "Sắp hết" : "Bình thường";
                  const cls = s.central === 0 ? "bg-red-100 text-red-700" : s.central <= 3 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
                  return (
                    <TableRow key={s.sku}>
                      <TableCell className="font-mono text-xs">{s.sku}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right">{fmtVN(s.central)}</TableCell>
                      <TableCell><Badge className={cls + " border-0"}>{status}</Badge></TableCell>
                      <TableCell><Button size="sm" variant="outline">Yêu cầu nhập</Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Giao dịch theo kênh (7 ngày)</CardTitle></CardHeader>
          <CardContent className="pt-0 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="store" stackId="a" fill="#4F46E5" />
                <Bar dataKey="shopee" stackId="a" fill="#F97316" />
                <Bar dataKey="tiktok" stackId="a" fill="#EC4899" />
                <Bar dataKey="lazada" stackId="a" fill="#0EA5E9" />
                <Bar dataKey="website" stackId="a" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({ icon, label, value, suffix, accent }: { icon: React.ReactNode; label: string; value: string; suffix?: string; accent?: "danger" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>{label}</span>
          <span className={accent === "danger" ? "text-destructive" : "text-primary"}>{icon}</span>
        </div>
        <div className={`mt-2 text-2xl font-bold ${accent === "danger" ? "text-destructive" : ""}`}>
          {value} {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
