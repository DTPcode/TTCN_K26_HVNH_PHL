import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { LOGS, CHANNELS, fmtTime, fmtVN, type LogEntry, type ChannelId } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Nhật ký hệ thống — Atino" }, { name: "description", content: "Tra cứu nhật ký giao dịch, đồng bộ và lỗi hệ thống Atino." }] }),
  component: () => <RequireAuth roles={["system_admin"]}><Page /></RequireAuth>,
});

const TYPE_LABEL: Record<LogEntry["type"], string> = {
  transaction: "Giao dịch", sync: "Đồng bộ", error: "Lỗi hệ thống", user_action: "Thao tác người dùng",
};

function Page() {
  const [type, setType] = useState<LogEntry["type"] | "all">("all");
  const [sku, setSku] = useState("");
  const [channel, setChannel] = useState<ChannelId | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<LogEntry | null>(null);

  const filtered = useMemo(() => {
    return LOGS.filter((l) => {
      if (type !== "all" && l.type !== type) return false;
      if (sku && !l.sku?.toLowerCase().includes(sku.toLowerCase())) return false;
      if (channel !== "all" && l.channel !== channel) return false;
      if (from && l.time < new Date(from).getTime()) return false;
      if (to && l.time > new Date(to).getTime() + 86400_000) return false;
      return true;
    });
  }, [type, sku, channel, from, to]);

  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell title="Nhật ký hệ thống">
      <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <div><Label className="text-xs">Từ ngày</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label className="text-xs">Đến ngày</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div>
          <Label className="text-xs">Loại log</Label>
          <Select value={type} onValueChange={(v) => setType(v as LogEntry["type"] | "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="transaction">Giao dịch</SelectItem>
              <SelectItem value="sync">Đồng bộ</SelectItem>
              <SelectItem value="error">Lỗi hệ thống</SelectItem>
              <SelectItem value="user_action">Thao tác người dùng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="AT-..." /></div>
        <div>
          <Label className="text-xs">Kênh</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as ChannelId | "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {CHANNELS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button className="flex-1" onClick={() => setPage(1)}>Lọc</Button>
          <Button variant="outline" onClick={() => toast("Tính năng đang phát triển")}>Xuất CSV</Button>
        </div>
      </CardContent></Card>

      <Card className="mt-4"><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2">Thời gian</th><th className="px-3 py-2">Loại</th>
              <th className="px-3 py-2">SKU</th><th className="px-3 py-2">Kênh</th>
              <th className="px-3 py-2">Mô tả</th><th className="px-3 py-2">Kết quả</th>
              <th className="px-3 py-2 text-right">Độ trễ</th><th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {rows.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-2 text-xs">{fmtTime(l.time)}</td>
                <td className="px-3 py-2"><Badge variant="outline">{TYPE_LABEL[l.type]}</Badge></td>
                <td className="px-3 py-2 font-mono text-xs">{l.sku ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{l.channel ? CHANNELS.find((c) => c.id === l.channel)?.name : "—"}</td>
                <td className="px-3 py-2">{l.description}</td>
                <td className="px-3 py-2">
                  <Badge className={l.result === "success" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                    {l.result === "success" ? "Thành công" : "Thất bại"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right text-xs">{l.latency ? `${fmtVN(l.latency)} ms` : "—"}</td>
                <td className="px-3 py-2 text-right"><Button size="sm" variant="ghost" onClick={() => setDetail(l)}>Chi tiết</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <div className="flex justify-between items-center mt-3 text-sm">
        <div className="text-muted-foreground">Tổng {fmtVN(filtered.length)} bản ghi</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span>Trang {page} / {pages}</span>
          <Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <Sheet open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-[480px] sm:max-w-md">
          <SheetHeader><SheetTitle>Chi tiết log</SheetTitle></SheetHeader>
          {detail && (
            <div className="space-y-2 text-sm mt-4 px-4">
              <Row k="ID" v={detail.id} />
              <Row k="Thời gian" v={fmtTime(detail.time)} />
              <Row k="Loại" v={TYPE_LABEL[detail.type]} />
              <Row k="SKU" v={detail.sku ?? "—"} />
              <Row k="Kênh" v={detail.channel ? CHANNELS.find((c) => c.id === detail.channel)?.name ?? "—" : "—"} />
              <Row k="Mô tả" v={detail.description} />
              <Row k="Kết quả" v={detail.result === "success" ? "Thành công" : "Thất bại"} />
              <Row k="Độ trễ" v={detail.latency ? `${detail.latency} ms` : "—"} />
              <div className="pt-3">
                <div className="text-xs text-muted-foreground mb-1">Detail JSON</div>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">{JSON.stringify(detail.detail, null, 2)}</pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
