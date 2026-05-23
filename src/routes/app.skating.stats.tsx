import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/app/skating/stats")({ component: SkatingStatsPage });

function SkatingStatsPage() {
  const sQ = useQuery({
    queryKey: ["skating-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_sessions").select("*").order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const elQ = useQuery({
    queryKey: ["skating-elements-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_session_elements").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const sessions = sQ.data ?? [];
  const els = elQ.data ?? [];

  const totals = useMemo(() => {
    const min = sessions.reduce((a, s: any) => a + (s.duration_min || 0), 0);
    const ratings = sessions.map((s: any) => s.rating).filter((r): r is number => typeof r === "number");
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
    return { count: sessions.length, hours: (min / 60).toFixed(1), avg };
  }, [sessions]);

  const ratingData = useMemo(() =>
    sessions.filter((s: any) => s.rating != null).map((s: any) => ({ date: s.date.slice(5), v: s.rating })),
  [sessions]);

  const monthData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s: any) => {
      const k = s.date.slice(0, 7);
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort().map(([k, v]) => ({ month: k.slice(5), n: v }));
  }, [sessions]);

  const topElements = useMemo(() => {
    const map = new Map<string, number>();
    els.forEach((e: any) => map.set(e.element_name, (map.get(e.element_name) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, n]) => ({ name, n }));
  }, [els]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Link to="/app/skating" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Indietro
      </Link>
      <div>
        <p className="text-xs font-bold tracking-widest text-primary">ANALISI</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Statistiche skating</h1>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Box label="Sessioni" value={String(totals.count)} />
        <Box label="Ore" value={totals.hours} />
        <Box label="Media voto" value={String(totals.avg)} />
      </div>
      <Card title="VOTO NEL TEMPO">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ratingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
            <XAxis dataKey="date" stroke="oklch(0.62 0.02 250)" fontSize={10} />
            <YAxis domain={[0, 10]} stroke="oklch(0.62 0.02 250)" fontSize={11} />
            <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
            <Line type="monotone" dataKey="v" stroke="oklch(0.78 0.16 165)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card title="SESSIONI PER MESE">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
            <XAxis dataKey="month" stroke="oklch(0.62 0.02 250)" fontSize={10} />
            <YAxis stroke="oklch(0.62 0.02 250)" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
            <Bar dataKey="n" fill="oklch(0.7 0.18 250)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="ELEMENTI PIÙ LAVORATI">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topElements} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
            <XAxis type="number" stroke="oklch(0.62 0.02 250)" fontSize={10} allowDecimals={false} />
            <YAxis type="category" dataKey="name" stroke="oklch(0.62 0.02 250)" fontSize={11} width={70} />
            <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
            <Bar dataKey="n" fill="oklch(0.78 0.16 165)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-3 text-center">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3">{title}</p>
      <div className="h-48">{children}</div>
    </div>
  );
}