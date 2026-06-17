import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "system_admin" | "ecommerce_admin" | "warehouse_manager";

export interface User {
  username: string;
  fullName: string;
  role: Role;
  email: string;
}

const USERS: Record<string, { password: string; user: User; locked?: boolean }> = {
  admin: {
    password: "123456",
    user: { username: "admin", fullName: "Nguyễn Quản Trị", role: "system_admin", email: "admin@atino.vn" },
  },
  ecommerce: {
    password: "123456",
    user: { username: "ecommerce", fullName: "Trần Thị TMĐT", role: "ecommerce_admin", email: "ecom@atino.vn" },
  },
  warehouse: {
    password: "123456",
    user: { username: "warehouse", fullName: "Lê Văn Kho", role: "warehouse_manager", email: "kho@atino.vn" },
  },
};

interface AuthCtx {
  user: User | null;
  login: (u: string, p: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("atino_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login: AuthCtx["login"] = (username, password) => {
    const rec = USERS[username.trim().toLowerCase()];
    if (!rec) return { ok: false, error: "Tài khoản không tồn tại" };
    if (rec.locked) return { ok: false, error: "Tài khoản đã bị khóa" };
    if (rec.password !== password) return { ok: false, error: "Mật khẩu không đúng" };
    setUser(rec.user);
    localStorage.setItem("atino_user", JSON.stringify(rec.user));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("atino_user");
  };

  return <Ctx.Provider value={{ user, login, logout, ready }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export const ROLE_LABELS: Record<Role, string> = {
  system_admin: "System Admin",
  ecommerce_admin: "Admin TMĐT",
  warehouse_manager: "Quản lý Kho",
};

export const ROLE_BADGE: Record<Role, string> = {
  system_admin: "bg-purple-100 text-purple-700 border-purple-200",
  ecommerce_admin: "bg-blue-100 text-blue-700 border-blue-200",
  warehouse_manager: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function defaultRouteFor(role: Role): string {
  if (role === "system_admin") return "/admin/sync-engine";
  if (role === "ecommerce_admin") return "/dashboard/ecommerce";
  return "/inventory";
}
