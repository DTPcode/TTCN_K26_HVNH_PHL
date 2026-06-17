import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { QUEUE, CHANNELS, fmtVN, fmtRel, emit } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Activity, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sync-engine")({
  head: () => ({ meta: [{ title: "Giám sát Sync Engine — Atino" }, { name: "description", content: "Giám sát hàng đợi đồng bộ và hiệu năng Sync Engine." }] }),
  component: () => <RequireAuth roles={["system_admin"]}><Page /></RequireAuth>,
});

function Page() {
  useSyncStore();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const processing = QUEUE.filter((t) => t.status === "processing").length;
  const queued = QUEUE.filter((t) => t.status === "queued").length;
  const failed = QUEUE.filter((t) => t.status === "failed").length;
  const priority = QUEUE.filter((t) => t.priority);
  const normal = QUEUE.filter((t) => !t.priority);

  const latency = Array.from({ length: 60 }, (_, i) => ({
    t: `${60 - i}p`,
    db: 30 + Math.round(Math.sin(i / 6) * 15 + Math.random() * 20),
    ch: 800 + Math.round(Math.sin(i / 9) * 300 + Math.random() * 400),
  }));

  const retry = (id: string) => {
    const task = QUEUE.find((q) => q.id === id);
    if (task) { task.status = "processing"; emit(); }
    toast.success("Tác vụ đã được retry");
  };
  const remove = (id: string) => {
    const idx = QUEUE.findIndex((q) => q.id === id);
    if (idx >= 0) { QUEUE.splice(idx, 1); emit(); }
    toast.success("Đã xóa tác vụ");
    setConfirmDel(null);
  };

  return (
    <AppShell title="Giám sát Sync Engine">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={<Activity className="w-5 h-5" />} label="Tác vụ đang xử lý" value={fmtVN(processing)} />
        <MetricCard icon={<Clock className="w-5 h-5" />} label="Tác vụ trong hàng đợi" value={fmtVN(queued)} />
        <MetricCard icon={<AlertCircle className="w-5 h-5" />} label="Tác vụ thất bại" value={fmtVN(failed)} danger={failed > 0} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-sm">Hàng đợi đồng bộ</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="priority">
            <TabsList>
              <TabsTrigger value="priority">Priority Queue ({priority.length})</TabsTrigger>
              <TabsTrigger value="normal">Queue thường ({normal.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="priority"><QueueTable rows={priority} highlight onRetry={retry} onDelete={setConfirmDel} /></TabsContent>
            <TabsContent value="normal"><QueueTable rows={normal} onRetry={retry} onDelete={setConfirmDel} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Hiệu năng</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Perf label="Độ trễ ghi DB" value="avg 48ms" good />
            <Perf label="Thời gian đồng bộ kênh" value="avg 1.4s" good />
            <Perf label="Tốc độ xử lý" value="312 giao dịch/phút" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Độ trễ đồng bộ (60 phút gần đây)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="t" fontSize={10} interval={9} />
                <YAxis yAxisId="left" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" fontSize={10} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="db" name="DB Write (ms)" stroke="#4F46E5" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="ch" name="Channel Sync (ms)" stroke="#10B981" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmDel !== null} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tác vụ?</AlertDialogTitle>
            <AlertDialogDescription>Tác vụ sẽ bị xóa khỏi hàng đợi và không thể khôi phục.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && remove(confirmDel)}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function MetricCard({ icon, label, value, danger }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
  return (
    <Card><CardContent className="p-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span><span className={danger ? "text-destructive" : "text-primary"}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold mt-2 ${danger ? "text-destructive" : ""}`}>{value}</div>
    </CardContent></Card>
  );
}

function Perf({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${good ? "text-emerald-600" : ""}`}>
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${good ? "bg-emerald-500" : "bg-amber-500"}`} />{value}
      </span>
    </div>
  );
}

function QueueTable({ rows, highlight, onRetry, onDelete }: { rows: typeof QUEUE; highlight?: boolean; onRetry: (id: string) => void; onDelete: (id: string) => void }) {
  if (rows.length === 0) return <EmptyState message="Hàng đợi trống" />;
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr className="text-left">
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Kênh đích</th>
            <th className="px-3 py-2">Thời gian thêm</th>
            <th className="px-3 py-2">Trạng thái</th>
            <th className="px-3 py-2 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className={`border-t ${highlight ? "bg-amber-50/60" : ""}`}>
              <td className="px-3 py-2 font-mono text-xs">{t.id}</td>
              <td className="px-3 py-2 font-mono text-xs">{t.sku}</td>
              <td className="px-3 py-2">{CHANNELS.find((c) => c.id === t.target)?.name}</td>
              <td className="px-3 py-2 text-xs">{fmtRel(t.addedAt)}</td>
              <td className="px-3 py-2">
                <Badge className={
                  t.status === "processing" ? "bg-blue-100 text-blue-700 border-0" :
                  t.status === "failed" ? "bg-red-100 text-red-700 border-0" :
                  "bg-slate-100 text-slate-700 border-0"
                }>{t.status === "processing" ? "Đang xử lý" : t.status === "failed" ? "Thất bại" : "Chờ"}</Badge>
              </td>
              <td className="px-3 py-2 text-right space-x-1">
                <Button size="sm" variant="outline" onClick={() => onRetry(t.id)}>Retry</Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(t.id)}>Xóa</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
