import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { SKUS, CHANNELS, manualAdjust, fmtVN, getGlobalSafetyBuffer } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Tồn kho thực tế — Atino" }, { name: "description", content: "Quản lý tồn kho thực tế trên 5 kênh bán hàng Atino." }] }),
  component: () => <RequireAuth roles={["warehouse_manager", "system_admin", "ecommerce_admin"]}><Page /></RequireAuth>,
});

type Filter = "all" | "low" | "out" | "diverge";

function Page() {
  useSyncStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [newQty, setNewQty] = useState(0);
  const [reason, setReason] = useState("Kiểm kê thực tế");
  const [note, setNote] = useState("");

  const rows = useMemo(() => {
    return SKUS.filter((s) => {
      const matchQ = !q || s.sku.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase());
      const diverge = CHANNELS.some((c) => {
        const buf = (c.id === "store") ? 0 : getGlobalSafetyBuffer();
        const expected = Math.max(0, s.central - buf);
        return s.channels[c.id] !== expected;
      });
      if (filter === "low" && s.central > 3) return false;
      if (filter === "out" && s.central !== 0) return false;
      if (filter === "diverge" && !diverge) return false;
      return matchQ;
    });
  }, [q, filter]);

  const openEdit = (sku: string) => {
    const s = SKUS.find((x) => x.sku === sku)!;
    setEditing(sku);
    setNewQty(s.central);
    setReason("Kiểm kê thực tế");
    setNote("");
  };

  const submit = () => {
    if (editing == null) return;
    manualAdjust(editing, newQty);
    toast.success("Cập nhật tồn kho thành công");
    setEditing(null);
  };

  return (
    <AppShell title="Tồn kho thực tế">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo SKU hoặc tên..." className="pl-8" />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="low">Sắp hết (≤3)</SelectItem>
              <SelectItem value="out">Hết hàng</SelectItem>
              <SelectItem value="diverge">Lệch dữ liệu</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Tên sản phẩm</th>
                <th className="px-3 py-2 text-right">Tồn TT</th>
                {CHANNELS.map((c) => <th key={c.id} className="px-3 py-2 text-right">{c.name}</th>)}
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9}><EmptyState /></td></tr>
              )}
              {rows.map((s) => {
                const synced = CHANNELS.every((c) => {
                  const buf = (c.id === "store") ? 0 : getGlobalSafetyBuffer();
                  const expected = Math.max(0, s.central - buf);
                  return s.channels[c.id] === expected;
                });
                return (
                  <tr key={s.sku} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{s.sku}</td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmtVN(s.central)}</td>
                    {CHANNELS.map((c) => {
                      const v = s.channels[c.id];
                      const buf = (c.id === "store") ? 0 : getGlobalSafetyBuffer();
                      const expected = Math.max(0, s.central - buf);
                      const ok = v === expected;
                      return (
                        <td key={c.id} className="px-3 py-2 text-right">
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            {fmtVN(v)}
                            <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2">
                      {synced
                        ? <Badge className="bg-emerald-100 text-emerald-700 border-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Đồng bộ</Badge>
                        : <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="w-3 h-3 mr-1" /> Lệch dữ liệu</Badge>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s.sku)}>Cập nhật thủ công</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cập nhật tồn kho thủ công</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground">SKU: <span className="font-mono text-foreground">{editing}</span></div>
              <div>Tồn trung tâm hiện tại: <b>{fmtVN(SKUS.find((s) => s.sku === editing)?.central ?? 0)}</b></div>
              <div>
                <Label>Số lượng mới</Label>
                <Input type="number" min={0} value={newQty} onChange={(e) => setNewQty(Math.max(0, parseInt(e.target.value) || 0))} />
              </div>
              <div>
                <Label>Lý do điều chỉnh</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kiểm kê thực tế">Kiểm kê thực tế</SelectItem>
                    <SelectItem value="Xử lý sai lệch">Xử lý sai lệch</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={submit}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
