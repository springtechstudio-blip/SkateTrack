import { createFileRoute, Link } from "@tanstack/react-router";
import { RollerSkate } from "@/components/icons/RollerSkate";

export const Route = createFileRoute("/verify-success")({ component: VerifySuccessPage });

function VerifySuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_top,oklch(0.78_0.16_165/0.18),transparent_55%)]" />
      <div className="w-full max-w-sm text-center">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}
        >
          <RollerSkate className="h-7 w-7 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Email confermata! 🎉</h1>
        <p className="text-muted-foreground mb-6">Il tuo account è stato verificato con successo.</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
        >
          Vai al login
        </Link>
      </div>
    </main>
  );
}
