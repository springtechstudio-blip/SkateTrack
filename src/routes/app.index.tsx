import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Flame, Check, BarChart3, ChevronRight, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  calcStreak, fetchCompletionsRange, fetchHabits, toggleCompletion, toISO,
  type Habit,
} from "@/lib/habits";
import { HabitsStats } from "@/components/HabitsStats";

export const Route = createFileRoute("/app/")({ component: HabitsPage });

const DAY_LABELS = ["D", "L", "M", "M", "G", "V", "S"];
const FULL_DAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function isScheduledOn(h: Habit, date: Date) {
  if (h.frequency === "specific_days") return (h.frequency_days ?? []).includes(date.getDay());
  return true; // daily / weekly_count / monthly_count all show as eligible today
}

function HabitsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showStats, setShowStats] = useState(false);
  const [noteFor, setNoteFor] = useState<Habit | null>(null);

  const days = useMemo(() => {
    const arr: Date[] = [];
    const start = new Date();
    start.setDate(start.getDate() - 6);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const rangeFrom = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 90); return toISO(d); }, []);
  const rangeTo = useMemo(() => toISO(new Date()), []);

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name,avatar_url").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const habitsQ = useQuery({ queryKey: ["habits"], queryFn: fetchHabits });
  const compQ = useQuery({
    queryKey: ["completions", rangeFrom, rangeTo],
    queryFn: () => fetchCompletionsRange(rangeFrom, rangeTo),
  });

  const habits = habitsQ.data ?? [];
  const comps = compQ.data ?? [];

  const selectedISO = toISO(selectedDate);
  const compForDay = (habitId: string) =>
    comps.find((c) => c.habit_id === habitId && c.date === selectedISO);

  const todaysHabits = habits.filter((h) => isScheduledOn(h, selectedDate));
  const doneToday = todaysHabits.filter((h) => compForDay(h.id)?.status === "done").length;
  const progress = todaysHabits.length ? Math.round((doneToday / todaysHabits.length) * 100) : 0;

  const stats = useMemo(() => {
    const last30: string[] = [];
    for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); last30.push(toISO(d)); }
    const totalSlots = habits.length * 30 || 1;
    const done = comps.filter((c) => c.status === "done" && last30.includes(c.date)).length;
    const success30 = Math.round((done / totalSlots) * 100);
    const streaks = habits.map((h) => calcStreak(comps, h.id));
    const maxStreak = streaks.length ? Math.max(...streaks) : 0;
    const inFiamme = streaks.filter((s) => s >= 3).length;
    return { success30, maxStreak, inFiamme };
  }, [habits, comps]);

  const toggleMut = useMutation({
    mutationFn: async ({ habit, status }: { habit: Habit; status: "done" | "skipped" }) => {
      if (!user) throw new Error("No user");
      const current = compForDay(habit.id);
      return toggleCompletion(habit.id, user.id, selectedISO, current, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["completions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const greeting = profileQ.data?.display_name || user?.email?.split("@")[0] || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={profileQ.data?.avatar_url || ""} />
          <AvatarFallback>{greeting.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs font-bold tracking-widest text-primary">OGGI</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Ciao, {greeting}! 👋</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
        <Stat label="Successo 30gg" value={`${stats.success30}%`} />
        <div className="border-l border-border"><Stat label="Streak max" value={String(stats.maxStreak)} /></div>
        <div className="border-l border-border"><Stat label="In fiamme" value={String(stats.inFiamme)} /></div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight">Abitudini</h2>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" onClick={() => setShowStats(true)} aria-label="Statistiche" className="bg-card border-border hover:bg-muted">
            <BarChart3 className="h-4 w-4" />
          </Button>
          <NewHabitDialog />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{doneToday} di {todaysHabits.length} completate</span>
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--gradient-primary)" }} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const iso = toISO(d);
          const isSelected = iso === selectedISO;
          return (
            <button key={iso} onClick={() => setSelectedDate(d)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                isSelected ? "bg-primary text-primary-foreground shadow-[var(--glow-primary)]" : "text-foreground hover:bg-muted"
              }`}>
              <span className={`text-[10px] font-semibold ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {DAY_LABELS[d.getDay()]}
              </span>
              <span className="text-base font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-border" />

      {habitsQ.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />)}</div>
      ) : todaysHabits.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {todaysHabits.map((h) => {
            const c = compForDay(h.id);
            const done = c?.status === "done";
            const skipped = c?.status === "skipped";
            const streak = calcStreak(comps, h.id);
            return (
              <HabitRow
                key={h.id}
                habit={h}
                done={done}
                skipped={skipped}
                streak={streak}
                note={c?.note ?? null}
                onToggle={() => toggleMut.mutate({ habit: h, status: "done" })}
                onSkip={() => toggleMut.mutate({ habit: h, status: "skipped" })}
                onLongPress={() => setNoteFor(h)}
              />
            );
          })}
        </ul>
      )}

      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>Statistiche Abitudini</DialogTitle></DialogHeader>
          <HabitsStats habits={habits} completions={comps} />
        </DialogContent>
      </Dialog>

      <DailyNoteDialog
        habit={noteFor}
        date={selectedISO}
        existing={noteFor ? compForDay(noteFor.id) : undefined}
        onClose={() => setNoteFor(null)}
      />
    </div>
  );
}

function HabitRow({ habit, done, skipped, streak, note, onToggle, onSkip, onLongPress }: {
  habit: Habit; done: boolean; skipped: boolean; streak: number; note: string | null;
  onToggle: () => void; onSkip: () => void; onLongPress: () => void;
}) {
  const longRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggered = useRef(false);

  const startPress = () => {
    triggered.current = false;
    longRef.current = setTimeout(() => {
      triggered.current = true;
      onLongPress();
    }, 550);
  };
  const endPress = () => {
    if (longRef.current) clearTimeout(longRef.current);
    longRef.current = null;
  };

  return (
    <li className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: habit.color }} />
      <div className="flex items-center gap-3 pl-5 pr-3 py-3">
        <span className="text-xl" aria-hidden>{habit.emoji}</span>
        <Link
          to="/app/habits/$id"
          params={{ id: habit.id }}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onClick={(e) => { if (triggered.current) e.preventDefault(); }}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{habit.name}</p>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${habit.color}22`, color: habit.color }}>
              {habit.category}
            </span>
            {streak > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Flame className="h-3 w-3 text-primary" /> {streak}</span>}
            {skipped && <span className="text-[10px] text-muted-foreground">saltata</span>}
          </div>
          {note && (
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 truncate">
              <StickyNote className="h-3 w-3 shrink-0" /> {note}
            </p>
          )}
        </Link>
        <button
          onClick={onToggle}
          onDoubleClick={onSkip}
          aria-label={done ? "Segna come non completata" : "Completa"}
          className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
            done ? "bg-primary border-primary text-primary-foreground scale-110" : "border-current opacity-60 hover:opacity-100"
          }`}
          style={!done ? { color: habit.color } : undefined}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
      </div>
    </li>
  );
}

function DailyNoteDialog({ habit, date, existing, onClose }: {
  habit: Habit | null; date: string; existing: { id: string; note?: string | null } | undefined; onClose: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  useEffect(() => { setText(existing?.note ?? ""); }, [existing?.id, habit?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !habit) throw new Error("No user");
      if (existing) {
        const { error } = await supabase.from("habit_completions").update({ note: text || null }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_completions").insert({
          habit_id: habit.id, user_id: user.id, date, status: "done", note: text || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      toast.success("Nota salvata");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!habit} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader><DialogTitle>{habit?.emoji} Nota del giorno</DialogTitle></DialogHeader>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Come è andata oggi?" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Annulla</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Salva</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-border bg-card/40">
      <div className="text-4xl mb-3">✨</div>
      <p className="font-semibold mb-1">Nessuna abitudine per oggi</p>
      <p className="text-sm text-muted-foreground">Tocca <span className="text-primary font-bold">+</span> per crearne una.</p>
    </div>
  );
}

const PRESET_COLORS = ["#10b981", "#a78bfa", "#06b6d4", "#f59e0b", "#ef4444", "#ec4899"];
const PRESET_EMOJIS = ["💪", "🧘", "📚", "💧", "🏃", "🛼", "🥗", "😴", "✍️", "🎯"];

type Freq = "daily" | "specific_days" | "weekly_count" | "monthly_count";

function NewHabitDialog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Sport");
  const [emoji, setEmoji] = useState("💪");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [freq, setFreq] = useState<Freq>("daily");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [monthlyTarget, setMonthlyTarget] = useState(10);

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");
      const { error } = await supabase.from("habits").insert({
        user_id: user.id, name: name.trim(), category: category.trim() || "General",
        emoji, color, frequency: freq,
        frequency_days: freq === "specific_days" ? days : [],
        weekly_target: freq === "weekly_count" ? weeklyTarget : 7,
        monthly_target: freq === "monthly_count" ? monthlyTarget : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Abitudine creata");
      setOpen(false); setName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }} aria-label="Nuova abitudine">
          <Plus className="h-5 w-5" strokeWidth={2.6} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuova abitudine</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; create.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hname">Nome</Label>
            <Input id="hname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Bere 2L d'acqua" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hcat">Categoria</Label>
            <Input id="hcat" value={category} onChange={(e) => setCategory(e.target.value)} />
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
                <button type="button" key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" : ""}`} style={{ background: c }} aria-label={`Colore ${c}`} />
              ))}
            </div>
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full font-semibold">Crea abitudine</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}