import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { USERS, fmtTime, emit, addNotification, type UserAccount } from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { ROLE_LABELS, ROLE_BADGE, type Role } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Quản lý người dùng — Atino" }, { name: "description", content: "Quản lý tài khoản nhân viên trong hệ thống Atino SyncInventory." }] }),
  component: () => <RequireAuth roles={["system_admin"]}><Page /></RequireAuth>,
});

function Page() {
  useSyncStore();
  const [open, setOpen] = useState(false);
  const [toToggle, setToToggle] = useState<UserAccount | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", role: "ecommerce_admin" as Role, password: "", confirm: "" });
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", role: "ecommerce_admin" as Role });

  const submit = () => {
    if (!form.fullName || !form.email) { toast.error("Vui lòng điền đủ thông tin"); return; }
    if (form.password.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    if (form.password !== form.confirm) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    USERS.unshift({ id: `U-${Date.now()}`, ...form, active: true, createdAt: Date.now() });
    emit();
    addNotification("user_action", `Tài khoản mới được tạo`, `Đã tạo tài khoản ${form.fullName} thành công.`, "/admin/users");
    toast.success("Tạo tài khoản thành công");
    setOpen(false);
    setForm({ fullName: "", email: "", role: "ecommerce_admin", password: "", confirm: "" });
  };

  const toggle = () => {
    if (!toToggle) return;
    toToggle.active = !toToggle.active; emit();
    toast.success(toToggle.active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    setToToggle(null);
  };

  const openEdit = (u: UserAccount) => {
    setEditUser(u);
    setEditForm({ fullName: u.fullName, email: u.email, role: u.role });
  };

  const submitEdit = () => {
    if (!editUser) return;
    if (!editForm.fullName.trim()) { toast.error("Họ tên không được để trống"); return; }
    if (!editForm.email.trim() || !editForm.email.includes("@")) { toast.error("Email không hợp lệ"); return; }
    const dup = USERS.find((u) => u.id !== editUser.id && u.email.toLowerCase() === editForm.email.toLowerCase());
    if (dup) { toast.error("Email đã tồn tại trong hệ thống"); return; }
    editUser.fullName = editForm.fullName.trim();
    editUser.email = editForm.email.trim();
    editUser.role = editForm.role;
    emit();
    toast.success("Cập nhật thông tin thành công");
    setEditUser(null);
  };

  return (
    <AppShell title="Quản lý người dùng">
      <div className="flex justify-end mb-3">
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Thêm người dùng</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2">Họ tên</th><th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Vai trò</th><th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Ngày tạo</th><th className="px-3 py-2 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {USERS.length === 0 && <tr><td colSpan={6}><EmptyState /></td></tr>}
            {USERS.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2 font-medium">{u.fullName}</td>
                <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2"><Badge className={`border ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</Badge></td>
                <td className="px-3 py-2">
                  <Badge className={u.active ? "bg-emerald-100 text-emerald-700 border-0" : "bg-slate-200 text-slate-700 border-0"}>
                    {u.active ? "Hoạt động" : "Đã khóa"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs">{fmtTime(u.createdAt)}</td>
                <td className="px-3 py-2 text-right space-x-1">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(u)}>
                    <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                  </Button>
                  <Button size="sm" variant="ghost" className={u.active ? "text-red-600" : "text-emerald-600"} onClick={() => setToToggle(u)}>
                    {u.active ? "Khóa" : "Mở khóa"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm người dùng mới</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Họ và tên</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <Label>Vai trò</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                  <SelectItem value="ecommerce_admin">Admin TMĐT</SelectItem>
                  <SelectItem value="warehouse_manager">Quản lý Kho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Mật khẩu</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><Label>Xác nhận mật khẩu</Label><Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={submit}>Tạo tài khoản</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toToggle !== null} onOpenChange={(o) => !o && setToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toToggle?.active ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {toToggle?.active ? "Người dùng sẽ không thể đăng nhập cho tới khi được mở khóa." : "Người dùng có thể đăng nhập trở lại sau khi mở khóa."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={toggle}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Chỉnh sửa thông tin người dùng */}
      <Dialog open={editUser !== null} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Họ và tên</Label>
              <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Vai trò</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                  <SelectItem value="ecommerce_admin">Admin TMĐT</SelectItem>
                  <SelectItem value="warehouse_manager">Quản lý Kho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Hủy</Button>
            <Button onClick={submitEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
