import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth, defaultRouteFor } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — Atino SyncInventory" },
      { name: "description", content: "Đăng nhập vào hệ thống quản lý đồng bộ tồn kho đa kênh của Atino." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: defaultRouteFor(user.role) });
  }, [ready, user, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.ok) { setErr(res.error); return; }
      toast.success("Đăng nhập thành công");
    }, 350);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-background to-indigo-100 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-black tracking-tight text-primary">ATINO</div>
            <div className="text-xs text-muted-foreground mt-1">SyncInventory · Quản lý đồng bộ đa kênh</div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u">Tên đăng nhập</Label>
              <Input id="u" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin / ecommerce / warehouse" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Mật khẩu</Label>
              <div className="relative">
                <Input id="p" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {err && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {err}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Đăng nhập
            </Button>
          </form>
          <div className="text-[11px] text-muted-foreground mt-6 leading-relaxed border-t pt-4">
            <div className="font-medium mb-1 text-foreground">Tài khoản demo:</div>
            admin / 123456 (System Admin)<br />
            ecommerce / 123456 (Admin TMĐT)<br />
            warehouse / 123456 (Quản lý Kho)
          </div>
        </div>
      </div>
    </div>
  );
}
