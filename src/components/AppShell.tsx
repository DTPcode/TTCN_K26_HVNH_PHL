import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, Settings, Activity, FileText, Store, LogOut,
  Package, AlertTriangle, ShoppingCart, Boxes, ArrowDownToLine, History,
  RefreshCw, ChevronLeft, ChevronRight, Radio,
} from "lucide-react";
import { useAuth, ROLE_LABELS, ROLE_BADGE, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { NotificationPanel } from "@/components/NotificationPanel";

interface NavItem { to: string; label: string; icon: typeof Users; }

const NAV: Record<Role, NavItem[]> = {
  system_admin: [
    { to: "/admin/sync-engine", label: "Giám sát Sync Engine", icon: Activity },
    { to: "/admin/users", label: "Quản lý người dùng", icon: Users },
    { to: "/admin/config", label: "Cấu hình hệ thống", icon: Settings },
    { to: "/admin/logs", label: "Nhật ký hệ thống", icon: FileText },
  ],
  ecommerce_admin: [
    { to: "/dashboard/ecommerce", label: "Tổng quan kinh doanh", icon: LayoutDashboard },
    { to: "/channels", label: "Trạng thái đồng bộ kênh", icon: Store },
    { to: "/orders", label: "Quản lý đơn hàng", icon: ShoppingCart },
    { to: "/alerts", label: "Cảnh báo tồn kho", icon: AlertTriangle },
    { to: "/syncmonitor", label: "SyncMonitor", icon: Radio },
    { to: "/products", label: "Quản lý sản phẩm", icon: Package },
  ],
  warehouse_manager: [
    { to: "/inventory", label: "Tồn kho thực tế", icon: Boxes },
    { to: "/warehouse/transactions", label: "Nhập kho / Xuất kho", icon: ArrowDownToLine },
    { to: "/warehouse/history", label: "Lịch sử biến động", icon: History },
    { to: "/alerts", label: "Cảnh báo tồn kho", icon: AlertTriangle },
    { to: "/warehouse/sync", label: "Trạng thái đồng bộ", icon: RefreshCw },
  ],
};

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;
  const nav = NAV[user.role];

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`${collapsed ? "w-16" : "w-64"} bg-sidebar text-sidebar-foreground flex flex-col transition-all border-r border-sidebar-border`}
      >
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-sidebar-primary grid place-items-center font-bold text-sidebar-primary-foreground">A</div>
              <div>
                <div className="font-bold text-base tracking-tight">ATINO</div>
                <div className="text-[10px] text-sidebar-foreground/60 -mt-0.5">SyncInventory</div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-sidebar-primary grid place-items-center font-bold text-sidebar-primary-foreground mx-auto">A</div>
          )}
        </div>
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {nav.map((item, i) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={`${item.to}-${i}`}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b flex items-center justify-between px-6">
          <div>
            <div className="text-xs text-muted-foreground">Atino SyncInventory</div>
            <h1 className="text-base font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <div className="flex items-center gap-2 px-3 py-1.5 border rounded-full bg-muted/40">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                {user.fullName.split(" ").pop()?.[0]}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-medium">{user.fullName}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ROLE_BADGE[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-1" /> Đăng xuất
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => { logout(); navigate({ to: "/login" }); }}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function EmptyState({ message = "Không có dữ liệu phù hợp" }: { message?: string }) {
  return (
    <div className="py-12 grid place-items-center text-center text-muted-foreground">
      <Package className="w-10 h-10 mb-2 opacity-40" />
      <div className="text-sm">{message}</div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 flex-1 rounded shimmer" />
          ))}
        </div>
      ))}
    </div>
  );
}
