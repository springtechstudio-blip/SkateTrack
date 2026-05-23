import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RollerSkate } from "@/components/icons/RollerSkate";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/app" });
  }, [loading, user, nav]);

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_top,oklch(0.78_0.16_165/0.18),transparent_55%)]" />
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}
          >
            <RollerSkate className="h-7 w-7 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SkateTrack</h1>
          <p className="text-sm text-muted-foreground mt-1">Il tuo diario di pattinaggio e abitudini</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-muted">
            <TabsTrigger value="login">Accedi</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <AuthForm mode="login" busy={busy} setBusy={setBusy} />
          </TabsContent>
          <TabsContent value="signup">
            <AuthForm mode="signup" busy={busy} setBusy={setBusy} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function AuthForm({
  mode,
  busy,
  setBusy,
}: {
  mode: "login" | "signup";
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirectTo = import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/app`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name }, emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        toast.success("Account creato! Controlla la tua email per confermare.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Il tuo nome" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Almeno 8 caratteri"
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full font-semibold" size="lg">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Crea account" : "Accedi"}
      </Button>
    </form>
  );
}