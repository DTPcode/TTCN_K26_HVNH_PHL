import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { CHANNELS, SKUS, SYNC_EVENTS, applyStockChange, fmtVN, fmtTime, type ChannelId } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/syncmonitor")({
  head: () => ({ meta: [{ title: "SyncMonitor — Atino" }, { name: "description", content: "Giám sát luồng đồng bộ tồn kho thời gian thực." }] }),
  component: () => <RequireAuth roles={["ecommerce_admin", "system_admin"]}><Page /></RequireAuth>,
});

function Page() {
  useSyncStore();
  const [activeSource, setActiveSource] = useState<ChannelId | null>(null);
  const [pickedSource, setPickedSource] = useState<ChannelId>("shopee");
  const [pickedSku, setPickedSku] = useState<string>(SKUS[0].sku);
  const [qty, setQty] = useState<number>(1);

  // Auto-rotate simulated events
  useEffect(() => {
    const t = setInterval(() => {
      const ch = CHANNELS[Math.floor(Math.random() * CHANNELS.length)].id;
      const sk = SKUS[Math.floor(Math.random() * SKUS.length)].sku;
      applyStockChange(sk, -1, ch);
      setActiveSource(ch);
      setTimeout(() => setActiveSource(null), 1400);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const trigger = () => {
    applyStockChange(pickedSku, -Math.abs(qty), pickedSource);
    setActiveSource(pickedSource);
    setTimeout(() => setActiveSource(null), 1500);
    toast.success("Đã kích hoạt giao dịch mô phỏng");
  };

  const events = SYNC_EVENTS.slice(0, 20);

  return (
    <AppShell title="SyncMonitor — Đồng bộ thời gian thực">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Luồng đồng bộ theo thời gian thực</CardTitle></CardHeader>
            <CardContent>
              <FlowDiagram active={activeSource} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Live event feed</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">Thời gian</th>
                      <th className="px-3 py-2">Kênh nguồn</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2 text-right">ΔTồn kho</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2 text-right">Độ trễ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="px-3 py-2 text-xs">{fmtTime(e.time)}</td>
                        <td className="px-3 py-2"><Badge variant="outline">{CHANNELS.find((c) => c.id === e.source)?.name}</Badge></td>
                        <td className="px-3 py-2 font-mono text-xs">{e.sku}</td>
                        <td className={`px-3 py-2 text-right font-medium ${e.delta < 0 ? "text-red-600" : "text-emerald-600"}`}>{e.delta > 0 ? `+${e.delta}` : e.delta}</td>
                        <td className="px-3 py-2">
                          {e.status === "success" && <span className="inline-flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Thành công</span>}
                          {e.status === "processing" && <span className="inline-flex items-center gap-1 text-amber-600 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý</span>}
                          {e.status === "failed" && <span className="inline-flex items-center gap-1 text-red-600 text-xs"><XCircle className="w-3.5 h-3.5" /> Thất bại</span>}
                        </td>
                        <td className="px-3 py-2 text-right text-xs">{fmtVN(e.latency)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:col-span-1 h-fit">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Channel Simulator</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Kênh phát sinh giao dịch</Label>
              <Select value={pickedSource} onValueChange={(v) => setPickedSource(v as ChannelId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">SKU</Label>
              <Select value={pickedSku} onValueChange={setPickedSku}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SKUS.map((s) => <SelectItem key={s.sku} value={s.sku}>{s.sku}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Số lượng bán</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <Button className="w-full" onClick={trigger}>Kích hoạt giao dịch</Button>
            <p className="text-[11px] text-muted-foreground">Sự kiện sẽ xuất hiện trong feed và sơ đồ sẽ nhấp nháy luồng đồng bộ.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function FlowDiagram({ active }: { active: ChannelId | null }) {
  const items = CHANNELS;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Kênh nguồn</div>
        {items.map((c) => (
          <div key={"s-" + c.id} className={`px-3 py-2 rounded-md border text-sm transition-all ${active === c.id ? "bg-primary text-primary-foreground border-primary scale-[1.02] shadow" : "bg-card"}`}>
            {c.name}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3">
        <svg width="60" height="20" className="overflow-visible">
          <line x1="0" y1="10" x2="60" y2="10" stroke={active ? "#4F46E5" : "#cbd5e1"} strokeWidth="2"
            className={active ? "flow-line-active" : ""} />
        </svg>
        <div className={`w-44 px-4 py-6 rounded-xl border-2 text-center bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 ${active ? "pulse-db" : ""}`}>
          <Database className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
          <div className="font-semibold text-sm">PostgreSQL</div>
          <div className="text-xs text-emerald-700">DB Trung tâm</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
          </div>
        </div>
        <svg width="60" height="20" className="overflow-visible">
          <line x1="0" y1="10" x2="60" y2="10" stroke={active ? "#4F46E5" : "#cbd5e1"} strokeWidth="2"
            className={active ? "flow-line-active" : ""} />
        </svg>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Kênh đích</div>
        {items.map((c) => (
          <div key={"t-" + c.id} className={`px-3 py-2 rounded-md border text-sm transition-all ${active && active !== c.id ? "bg-primary/10 border-primary/30 text-primary" : "bg-card opacity-90"}`}>
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}
