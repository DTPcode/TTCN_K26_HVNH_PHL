import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/warehouse/sync")({
  component: () => {
    const nav = useNavigate();
    useEffect(() => { nav({ to: "/channels" }); }, [nav]);
    return null;
  },
});
