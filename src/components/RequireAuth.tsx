import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/auth";

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login" });
    else if (roles && !roles.includes(user.role)) navigate({ to: "/login" });
  }, [ready, user, roles, navigate]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Đang tải...
      </div>
    );
  }
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
