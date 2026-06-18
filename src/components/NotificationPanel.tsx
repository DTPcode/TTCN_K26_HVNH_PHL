import { useState } from "react";
import {
  NOTIFICATIONS, markNotificationRead, markAllNotificationsRead, fmtRel,
  type Notification, type NotificationType,
} from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell, PackageX, AlertTriangle, Wifi, WifiOff, ClipboardList,
  Settings, UserPlus, CheckCheck, ClipboardCheck,
} from "lucide-react";

const ICON_MAP: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  stock_out: { icon: PackageX, color: "text-red-500" },
  stock_low: { icon: AlertTriangle, color: "text-amber-500" },
  sync_error: { icon: WifiOff, color: "text-red-500" },
  sync_success: { icon: Wifi, color: "text-emerald-500" },
  stock_request: { icon: ClipboardList, color: "text-blue-500" },
  stock_request_result: { icon: ClipboardCheck, color: "text-teal-500" },
  config_change: { icon: Settings, color: "text-purple-500" },
  user_action: { icon: UserPlus, color: "text-indigo-500" },
};

export function NotificationPanel() {
  useSyncStore();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Lọc thông báo theo role của user hiện tại
  const myNotifications = NOTIFICATIONS.filter((n) => {
    if (!n.targetRole || n.targetRole === "all") return true;
    if (user?.role === "system_admin") return true; // System admin thấy hết
    return n.targetRole === user?.role;
  });

  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const handleClick = (n: Notification) => {
    markNotificationRead(n.id);
    if (n.link) {
      // Dùng window.location để đảm bảo query params (?tab=requests) được parse đúng
      window.location.href = n.link;
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-muted rounded-md" aria-label="Thông báo" id="notification-bell">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 text-[10px] bg-destructive text-destructive-foreground rounded-full grid place-items-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-muted-foreground"
              onClick={() => markAllNotificationsRead()}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {NOTIFICATIONS.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Không có thông báo nào
            </div>
          ) : (
            <div className="divide-y">
              {myNotifications.slice(0, 20).map((n) => {
                const cfg = ICON_MAP[n.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      !n.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
                      !n.read ? "bg-white shadow-sm border" : "bg-muted"
                    }`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.read ? "font-semibold" : "font-medium text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">{fmtRel(n.time)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
