import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcStreak, toISO, type Completion, type Habit } from "@/lib/habits";
import { ChevronLeft, Flame, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/app/habits/$id")({ component: HabitDetailPage });

const PRESET_EMOJIS = ["💪", "🧘", "📚", "💧", "🏃", "🛼", "🥗", "😴", "✍️", "🎯"];
const PRESET_COLORS = ["#10b981", "#a78bfa", "#06b6d4", "#f59e0b", "#ef4444", "#ec4899"];
type Freq = "daily" | "specific_days" | "weekly_count" | "monthly_count";
const FULL_DAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function HabitDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const habitQ = useQuery({
    queryKey: ["habit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("habits").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as Habit | null;
    },
  });

  const compsQ = useQuery({
    queryKey: ["habit-comps", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("habit_completions").select("*").eq("habit_id", id);
      if (error) throw error;
      return (data ?? []) as Completion[];
    },
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("habits").update({ deleted_at: new Date().toISOString(), archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Abitudine eliminata");
      nav({ to: "/app" });
    },
  });

  const habit = habitQ.data;
  const comps = compsQ.data ?? [];

  const stats = useMemo(() => {
    const done = comps.filter((c) => c.status === "done");
    const dates = new Set(done.map((c) => c.date));

    let maxStreak = 0, cur = 0;
    const sorted = [...dates].sort();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) cur = 1;
      else {
        const prev = new Date(sorted[i - 1]);
        prev.setDate(prev.getDate() + 1);
        cur = toISO(prev) === sorted[i] ? cur + 1 : 1;
      }
      maxStreak = Math.max(maxStreak, cur);
    }
    const current = calcStreak(comps, id);

    const last30: string[] = [];
    for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); last30.push(toISO(d)); }
    const hit = last30.filter((d) => dates.has(d)).length;
    const rate = Math.round((hit / 30) * 100);

    const weeks: { w: string; n: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date(); end.setDate(end.getDate() - i * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      const n = done.filter((c) => { const d = new Date(c.date); return d >= start && d <= end; }).length;
      weeks.push({ w: `${start.getDate()}/${start.getMonth() + 1}`, n });
    }
    return { current, maxStreak, rate, weeks, doneDates: dates };
  }, [comps, id]);

  const heatmap = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear(), month = today.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const cells: { iso: string; day: number; done: boolean; future: boolean }[] = [];
    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(year, month, d);
      cells.push({ iso: toISO(dt), day: d, done: stats.doneDates.has(toISO(dt)), future: dt > today });
    }
    return { cells, startDow: first.getDay(), monthName: first.toLocaleDateString("it-IT", { month: "long", year: "numeric" }) };
  }, [stats.doneDates]);

  if (habitQ.isLoading) return <div className="text-center py-10 text-muted-foreground">Caricamento…</div>;
  if (!habit) return <div className="text-center py-10">Abitudine non trovata. <Link to="/app" className="text-primary underline">Torna</Link></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Indietro
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl grid place-items-center text-2xl" style={{ background: `${habit.color}22`, border: `1px solid ${habit.color}55` }}>
          {habit.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight truncate">{habit.name}</h1>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${habit.color}22`, color: habit.color }}>{habit.category}</span>
        </div>
        <EditHabitDialog habit={habit} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatBox icon={<Flame className="h-4 w-4" />} label="Streak attuale" value={String(stats.current)} />
        <StatBox label="Streak max" value={String(stats.maxStreak)} />
        <StatBox label="Successo 30gg" value={`${stats.rate}%`} />
      </div>

      <section className="rounded-2xl border border-border bg-card/80 p-4">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3 capitalize">HEATMAP — {heatmap.monthName}</p>
        <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
          {["D", "L", "M", "M", "G", "V", "S"].map((d, i) => <div key={i} className="text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: heatmap.startDow }).map((_, i) => <div key={`p${i}`} />)}
          {heatmap.cells.map((c) => (
            <div key={c.iso}
              className={`aspect-square rounded-md text-[10px] flex items-center justify-center font-semibold ${
                c.future ? "bg-muted/30 text-muted-foreground/40" : c.done ? "text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
              style={c.done && !c.future ? { background: habit.color } : undefined}>
              {c.day}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/80 p-4">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3">COMPLETAMENTI / SETTIMANA</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
              <XAxis dataKey="w" stroke="oklch(0.62 0.02 250)" fontSize={10} />
              <YAxis stroke="oklch(0.62 0.02 250)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
              <Bar dataKey="n" fill={habit.color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full bg-card border-border text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Elimina abitudine
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare "{habit.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione è permanente. I dati di completamento storici resteranno ma l'abitudine sparirà dalla lista.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => del.mutate()} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditHabitDialog({ habit }: { habit: Habit }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(habit.name);
  const [category, setCategory] = useState(habit.category);
  const [emoji, setEmoji] = useState(habit.emoji);
  const [color, setColor] = useState(habit.color);
  const [freq, setFreq] = useState<Freq>((habit.frequency as Freq) || "daily");
  const [days, setDays] = useState<number[]>(habit.frequency_days ?? []);
  const [weeklyTarget, setWeeklyTarget] = useState(habit.weekly_target ?? 3);
  const [monthlyTarget, setMonthlyTarget] = useState(habit.monthly_target ?? 10);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("habits").update({
        name: name.trim(),
        category: category.trim() || "General",
        emoji, color, frequency: freq,
        frequency_days: freq === "specific_days" ? days : [],
        weekly_target: freq === "weekly_count" ? weeklyTarget : 7,
        monthly_target: freq === "monthly_count" ? monthlyTarget : 0,
      }).eq("id", habit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habit", habit.id] });
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Abitudine aggiornata");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="bg-card border-border shrink-0">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Modifica abitudine</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; update.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome abitudine" required />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Frequenza</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                ["daily", "Ogni giorno"],
                ["specific_days", "Giorni specifici"],
                ["weekly_count", "X volte/sett."],
                ["monthly_count", "X volte/mese"],
              ] as [Freq, string][]).map(([k, l]) => (
                <button type="button" key={k} onClick={() => setFreq(k)}
                  className={`text-xs font-semibold py-2 rounded-lg transition ${freq === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {freq === "specific_days" && (
            <div className="grid grid-cols-7 gap-1">
              {FULL_DAYS.map((lbl, i) => {
                const sel = days.includes(i);
                return (
                  <button key={i} type="button" onClick={() => setDays(sel ? days.filter((d) => d !== i) : [...days, i])}
                    className={`text-[11px] font-bold py-2 rounded-md transition ${sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {lbl}
                  </button>
                );
              })}
            </div>
          )}
          {freq === "weekly_count" && (
            <div className="space-y-1.5">
              <Label>Volte a settimana: {weeklyTarget}</Label>
              <input type="range" min={1} max={7} value={weeklyTarget} onChange={(e) => setWeeklyTarget(+e.target.value)} className="w-full accent-primary" />
            </div>
          )}
          {freq === "monthly_count" && (
            <div className="space-y-1.5">
              <Label>Volte al mese: {monthlyTarget}</Label>
              <input type="range" min={1} max={28} value={monthlyTarget} onChange={(e) => setMonthlyTarget(+e.target.value)} className="w-full accent-primary" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_EMOJIS.map((e) => (
                <button type="button" key={e} onClick={() => setEmoji(e)} className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition ${emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-secondary"}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Colore</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" : ""}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <Button type="submit" disabled={update.isPending} className="w-full font-semibold">Salva modifiche</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-3 text-center">
      <div className="text-xl font-bold text-primary flex items-center justify-center gap-1">{icon}{value}</div>
      <div className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
