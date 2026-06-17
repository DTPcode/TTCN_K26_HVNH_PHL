import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { SKUS, WAREHOUSE_TXNS, addWarehouseTxn, fmtVN, fmtTime } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/warehouse/transactions")({
  head: () => ({ meta: [{ title: "Nhập / Xuất kho — Atino" }, { name: "description", content: "Quản lý nhập, xuất kho và lịch sử biến động tồn kho." }] }),
  component: () => <RequireAuth roles={["warehouse_manager", "system_admin"]}><Page /></RequireAuth>,
});

function Page() {
  useSyncStore();
  const { user } = useAuth();

  return (
    <AppShell title="Nhập kho / Xuất kho">
      <Tabs defaultValue="in">
        <TabsList>
          <TabsTrigger value="in">Nhập kho</TabsTrigger>
          <TabsTrigger value="out">Xuất kho</TabsTrigger>
        </TabsList>
        <TabsContent value="in"><TxnForm type="in" userName={user?.fullName ?? "Hệ thống"} /></TabsContent>
        <TabsContent value="out"><TxnForm type="out" userName={user?.fullName ?? "Hệ thống"} /></TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-sm">Lịch sử giao dịch gần đây</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2">Thời gian</th>
                <th className="px-3 py-2">Loại</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Tên SP</th>
                <th className="px-3 py-2 text-right">Số lượng</th>
                <th className="px-3 py-2 text-right">Tồn trước</th>
                <th className="px-3 py-2 text-right">Tồn sau</th>
                <th className="px-3 py-2">Người thực hiện</th>
                <th className="px-3 py-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {WAREHOUSE_TXNS.length === 0 && (<tr><td colSpan={9}><EmptyState /></td></tr>)}
              {WAREHOUSE_TXNS.slice(0, 20).map((t) => {
                const name = SKUS.find((s) => s.sku === t.sku)?.name ?? "—";
                return (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-2 text-xs">{fmtTime(t.time)}</td>
                    <td className="px-3 py-2">
                      <Badge className={t.type === "in" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>
                        {t.type === "in" ? "Nhập" : "Xuất"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{t.sku}</td>
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2 text-right">{fmtVN(t.qty)}</td>
                    <td className="px-3 py-2 text-right">{fmtVN(t.before)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmtVN(t.after)}</td>
                    <td className="px-3 py-2">{t.user}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{t.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function TxnForm({ type, userName }: { type: "in" | "out"; userName: string }) {
  const [sku, setSku] = useState(SKUS[0].sku);
  const [qty, setQty] = useState(1);
  const [partner, setPartner] = useState("");
  const [docNo, setDocNo] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (qty < 1) { toast.error("Số lượng không hợp lệ"); return; }
    addWarehouseTxn({
      type, sku, qty, user: userName,
      note: [type === "in" ? `NCC: ${partner}` : `Lý do: ${partner}`, docNo && `Phiếu: ${docNo}`, note].filter(Boolean).join(" · "),
    });
    toast.success(type === "in" ? "Nhập kho thành công" : "Xuất kho thành công");
    setQty(1); setPartner(""); setDocNo(""); setNote("");
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Chọn SKU</Label>
          <Select value={sku} onValueChange={setSku}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SKUS.map((s) => <SelectItem key={s.sku} value={s.sku}>{s.sku} — {s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Số lượng {type === "in" ? "nhập" : "xuất"}</Label>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
        </div>
        <div>
          <Label>{type === "in" ? "Nhà cung cấp" : "Lý do xuất"}</Label>
          <Input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder={type === "in" ? "Công ty Việt Tiến..." : "Chuyển chi nhánh, lỗi sản phẩm..."} />
        </div>
        <div>
          <Label>Số phiếu {type === "in" ? "nhập" : "xuất"}</Label>
          <Input value={docNo} onChange={(e) => setDocNo(e.target.value)} placeholder="PN-2026-001" />
        </div>
        <div className="md:col-span-2">
          <Label>Ghi chú</Label>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={submit}>Xác nhận {type === "in" ? "nhập kho" : "xuất kho"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
