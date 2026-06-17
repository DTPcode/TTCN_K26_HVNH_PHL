import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, defaultRouteFor } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (user) navigate({ to: defaultRouteFor(user.role) });
    else navigate({ to: "/login" });
  }, [user, ready, navigate]);

  return (
    <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
      Đang tải Atino SyncInventory...
    </div>
  );
}
