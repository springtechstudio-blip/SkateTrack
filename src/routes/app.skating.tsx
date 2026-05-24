import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/skating")({ component: SkatingLayout });

function SkatingLayout() {
  return <Outlet />;
}
