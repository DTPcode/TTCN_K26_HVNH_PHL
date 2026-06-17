import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/admin/config")({
  head: () => ({ meta: [{ title: "Cấu hình hệ thống — Atino" }, { name: "description", content: "Cấu hình hệ thống Atino SyncInventory." }] }),
  component: () => <RequireAuth roles={["system_admin"]}>
    <AppShell title="Cấu hình hệ thống">
      <Card><CardContent className="py-16 text-center text-muted-foreground">
        <Construction className="w-10 h-10 mx-auto mb-3 opacity-50" />
        Mô-đun đang phát triển.
      </CardContent></Card>
    </AppShell>
  </RequireAuth>,
});
