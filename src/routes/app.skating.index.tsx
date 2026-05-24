import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, BarChart3 } from "lucide-react";
import { RollerSkate } from "@/components/icons/RollerSkate";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/app/skating/")({ component: SkatingPage });

type Session = {
  id: string; date: string; duration_min: number; intensity: number;
  session_type: string; notes: string | null;
  rating: number | null; mood: string | null; energy: number | null; difficulty: number | null;
  went_well: string | null; worked: string | null; improve: string | null; next_goal: string | null;
  location: string | null;
};

const QUALITIES = ["Provato", "Discreto", "Buono", "Ottimo"];
const MOODS = ["😞", "😐", "🙂", "😄", "🤩"];
const TYPE_COLORS = ["oklch(0.78 0.16 165)", "oklch(0.7 0.18 250)", "oklch(0.75 0.18 310)", "oklch(0.82 0.16 85)", "oklch(0.7 0.2 30)"];

function SkatingPage() {
  const qc = useQueryClient();
  const sQ = useQuery({
    queryKey: ["skating"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_sessions").select("*").order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Session[];
    },
  });

  const sessions = sQ.data ?? [];

  const stats = useMemo(() => {
    const totalMin = sessions.reduce((a, s) => a + s.duration_min, 0);
    const totalH = (totalMin / 60).toFixed(1);
    const last30 = sessions.filter((s) => new Date(s.date) >= new Date(Date.now() - 30 * 86400000));
    const last30Min = last30.reduce((a, s) => a + s.duration_min, 0);
    return { totalH, count: sessions.length, last30Count: last30.length, last30H: (last30Min / 60).toFixed(1) };
  }, [sessions]);

  const weekData = useMemo(() => {
    const arr: { week: string; min: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date(); end.setDate(end.getDate() - i * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      const min = sessions.filter((s) => { const d = new Date(s.date); return d >= start && d <= end; }).reduce((a, s) => a + s.duration_min, 0);
      arr.push({ week: `${start.getDate()}/${start.getMonth() + 1}`, min });
    }
    return arr;
  }, [sessions]);

  const typeData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => map.set(s.session_type, (map.get(s.session_type) ?? 0) + s.duration_min));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const intensityData = useMemo(() =>
    sessions.slice(0, 10).reverse().map((s) => ({ date: s.date.slice(5), int: s.intensity })),
  [sessions]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skating_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skating"] }),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary">SKATETRACK</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Pattinaggio</h1>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" className="bg-card border-border" asChild>
            <Link to="/app/skating/stats" aria-label="Statistiche"><BarChart3 className="h-4 w-4" /></Link>
          </Button>
          <NewSessionDialog />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ore totali" value={stats.totalH} />
        <StatCard label="Sessioni totali" value={String(stats.count)} />
        <StatCard label="Ore 30gg" value={stats.last30H} accent />
        <StatCard label="Sessioni 30gg" value={String(stats.last30Count)} accent />
      </div>

      <ChartCard title="MINUTI PER SETTIMANA">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weekData}>
            <defs>
              <linearGradient id="gMin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.16 165)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.78 0.16 165)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
            <XAxis dataKey="week" stroke="oklch(0.62 0.02 250)" fontSize={11} />
            <YAxis stroke="oklch(0.62 0.02 250)" fontSize={11} />
            <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
            <Area type="monotone" dataKey="min" stroke="oklch(0.78 0.16 165)" strokeWidth={2.5} fill="url(#gMin)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="INTENSITÀ (ULTIME 10)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={intensityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
              <XAxis dataKey="date" stroke="oklch(0.62 0.02 250)" fontSize={10} />
              <YAxis stroke="oklch(0.62 0.02 250)" fontSize={11} domain={[0, 5]} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
              <Bar dataKey="int" fill="oklch(0.7 0.18 250)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        {typeData.length > 0 && (
          <ChartCard title="DISTRIBUZIONE PER TIPO">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {typeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.62 0.02 250)" }} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">STORICO SESSIONI</p>
        {sessions.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-border bg-card/40">
            <RollerSkate className="h-8 w-8 mx-auto mb-3 text-primary animate-pulse" strokeWidth={1.8} />
            <p className="font-semibold">Nessuna sessione</p>
            <p className="text-sm text-muted-foreground">Aggiungi il tuo primo allenamento.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-card/80 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold text-xs">{s.duration_min}'</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.session_type} {s.mood && <span>{s.mood}</span>}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.date} · int. {s.intensity}/5
                    {s.rating != null && <> · voto {s.rating}/10</>}
                    {s.location && <> · {s.location}</>}
                  </p>
                </div>
                <button onClick={() => del.mutate(s.id)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Elimina">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border p-4 ${accent ? "bg-primary/10" : "bg-card/80"}`}>
      <div className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3">{title}</p>
      <div className="h-44">{children}</div>
    </div>
  );
}

function NewSessionDialog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState(3);
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(7);
  const [mood, setMood] = useState<string>(MOODS[2]);
  const [energy, setEnergy] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [wentWell, setWentWell] = useState("");
  const [worked, setWorked] = useState("");
  const [improve, setImprove] = useState("");
  const [nextGoal, setNextGoal] = useState("");
  const [location, setLocation] = useState("");
  const [elements, setElements] = useState<Record<string, string>>({});

  const elementsQ = useQuery({
    queryKey: ["skating_elements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_elements").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const typesQ = useQuery({
    queryKey: ["skating_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_session_types").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const locationsQ = useQuery({
    queryKey: ["skating_locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_locations").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const dbElements = elementsQ.data ?? [];
  const dbTypes = typesQ.data ?? [];
  const dbLocations = locationsQ.data ?? [];

  const toggleEl = (name: string) => {
    setElements((prev) => {
      const copy = { ...prev };
      if (copy[name]) delete copy[name];
      else copy[name] = "Provato";
      return copy;
    });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");
      if (!type.trim()) throw new Error("Seleziona o scrivi un tipo");

      const finalType = type.trim();
      const finalLocation = location.trim() || null;

      const typeExists = dbTypes.some((t: any) => t.name === finalType);
      if (!typeExists) {
        const { error: e1 } = await supabase.from("skating_session_types").insert({
          user_id: user.id, name: finalType,
        });
        if (e1) throw e1;
      }

      if (finalLocation) {
        const locExists = dbLocations.some((l: any) => l.name === finalLocation);
        if (!locExists) {
          const { error: e2 } = await supabase.from("skating_locations").insert({
            user_id: user.id, name: finalLocation,
          });
          if (e2) throw e2;
        }
      }

      const { data, error } = await supabase.from("skating_sessions").insert({
        user_id: user.id, date, duration_min: duration, intensity, session_type: finalType,
        notes: notes || null, rating, mood, energy, difficulty,
        went_well: wentWell || null, worked: worked || null, improve: improve || null, next_goal: nextGoal || null,
        location: finalLocation,
      }).select().single();
      if (error) throw error;
      const rows = Object.entries(elements).map(([n, q]) => ({ session_id: data.id, user_id: user.id, element_name: n, quality: q }));
      if (rows.length) {
        const { error: e3 } = await supabase.from("skating_session_elements").insert(rows);
        if (e3) throw e3;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skating"] });
      qc.invalidateQueries({ queryKey: ["skating_types"] });
      qc.invalidateQueries({ queryKey: ["skating_locations"] });
      qc.invalidateQueries({ queryKey: ["skating_elements"] });
      toast.success("Sessione salvata");
      setOpen(false); setNotes(""); setElements({}); setType(""); setLocation("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
          <Plus className="h-5 w-5" strokeWidth={2.6} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuova sessione</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="sdate">Data</Label><Input id="sdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="sdur">Durata (min)</Label><Input id="sdur" type="number" min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stype">Tipo</Label>
            <Input id="stype" list="type-list" value={type} onChange={(e) => setType(e.target.value)} placeholder="es. Tecnica" required />
            <datalist id="type-list">
              {dbTypes.map((t: any) => <option key={t.id} value={t.name} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sloc">Luogo</Label>
            <Input id="sloc" list="loc-list" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="es. Palaghiaccio" />
            <datalist id="loc-list">
              {dbLocations.map((l: any) => <option key={l.id} value={l.name} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label>Voto: {rating}/10</Label>
            <input type="range" min={1} max={10} step={0.5} value={rating} onChange={(e) => setRating(+e.target.value)} className="w-full accent-primary" />
          </div>
          <div className="space-y-1.5">
            <Label>Mood</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {MOODS.map((m) => (
                <button type="button" key={m} onClick={() => setMood(m)} className={`h-10 rounded-lg text-xl transition ${mood === m ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Energia: {energy}/5</Label>
              <div className="flex gap-1">{[1,2,3,4,5].map((n) => (
                <button type="button" key={n} onClick={() => setEnergy(n)} className={`flex-1 h-8 rounded text-xs font-bold ${n<=energy?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}>{n}</button>
              ))}</div>
            </div>
            <div className="space-y-1.5">
              <Label>Difficoltà: {difficulty}/5</Label>
              <div className="flex gap-1">{[1,2,3,4,5].map((n) => (
                <button type="button" key={n} onClick={() => setDifficulty(n)} className={`flex-1 h-8 rounded text-xs font-bold ${n<=difficulty?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}>{n}</button>
              ))}</div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Intensità: {intensity}/5</Label>
            <div className="flex gap-1.5">{[1,2,3,4,5].map((n) => (
              <button type="button" key={n} onClick={() => setIntensity(n)} className={`flex-1 h-9 rounded-lg font-bold ${n<=intensity?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}>{n}</button>
            ))}</div>
          </div>
          <div className="space-y-1.5">
            <Label>Elementi lavorati</Label>
            {dbElements.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Aggiungi gli elementi nelle{' '}
                <Link to="/app/settings" className="text-primary underline">impostazioni</Link>.
              </p>
            ) : (
              <div className="space-y-1.5">
                {dbElements.map((el: any) => {
                  const sel = elements[el.name];
                  return (
                    <div key={el.id} className="flex items-center gap-2">
                      <button type="button" onClick={() => toggleEl(el.name)} className={`text-xs px-2 py-1 rounded-md font-semibold flex-1 text-left ${sel ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{el.name}</button>
                      {sel && (
                        <Select value={sel} onValueChange={(v) => setElements({ ...elements, [el.name]: v })}>
                          <SelectTrigger className="h-7 text-xs w-28 bg-input border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>{QUALITIES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-1.5"><Label>Com'è andata</Label><Textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Cosa ha funzionato</Label><Textarea value={worked} onChange={(e) => setWorked(e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Cosa migliorare</Label><Textarea value={improve} onChange={(e) => setImprove(e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Obiettivo prossima sessione</Label><Textarea value={nextGoal} onChange={(e) => setNextGoal(e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label htmlFor="snotes">Note libere</Label><Textarea id="snotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          <Button type="submit" disabled={create.isPending} className="w-full font-semibold">Salva sessione</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
