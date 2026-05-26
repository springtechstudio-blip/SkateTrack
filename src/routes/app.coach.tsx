import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Plus, Trash2, Pencil, User, Check, Calendar, TrendingUp, DollarSign, BarChart3, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/coach")({ component: CoachPage });

type Athlete = { id: string; name: string; created_at: string };
type Attendance = { id: string; athlete_id: string; date: string; status: string; rating: number | null; paid: boolean; notes: string | null };
type Competition = { id: string; name: string; date: string; location: string | null; notes: string | null };

const STATUSES = [
  { key: "present", label: "Presente", color: "text-green-500 bg-green-500/10" },
  { key: "absent", label: "Assente", color: "text-red-500 bg-red-500/10" },
  { key: "late", label: "Ritardo", color: "text-yellow-500 bg-yellow-500/10" },
];
const PIE_COLORS = ["oklch(0.78 0.16 165)", "oklch(0.7 0.18 250)", "oklch(0.75 0.18 310)"];

function CoachPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const athletesQ = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("athletes").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Athlete[];
    },
  });

  const compsQ = useQuery({
    queryKey: ["coach-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Competition[];
    },
  });

  const attendanceQ = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("training_attendance").select("*").order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
  });

  const athletes = athletesQ.data ?? [];
  const competitions = compsQ.data ?? [];
  const attendance = attendanceQ.data ?? [];
  const [tab, setTab] = useState<"atleti" | "presenze" | "stats" | "gare">("atleti");

  const tabs = [
    { key: "atleti", label: "Atleti", icon: User },
    { key: "presenze", label: "Presenze", icon: Check },
    { key: "stats", label: "Statistiche", icon: TrendingUp },
    { key: "gare", label: "Gare", icon: Calendar },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/15 grid place-items-center text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-primary">ALLENATORE</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Pannello Allenatore</h1>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {tabs.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl font-semibold text-[10px] transition-all ${active ? "bg-primary text-primary-foreground shadow-md" : "bg-card/60 text-muted-foreground border border-border/50"}`}>
              <Icon className={`h-4 w-4 ${active ? "" : "text-muted-foreground"}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "atleti" && <AthletesTab athletes={athletes} attendance={attendance} />}
      {tab === "presenze" && <AttendanceTab athletes={athletes} attendance={attendance} />}
      {tab === "stats" && <StatsTab athletes={athletes} attendance={attendance} />}
      {tab === "gare" && <CompetitionsTab competitions={competitions} />}
    </div>
  );
}

function AthletesTab({ athletes, attendance }: { athletes: Athlete[]; attendance: Attendance[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editAthlete, setEditAthlete] = useState<Athlete | null>(null);
  const [editName, setEditName] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const add = useMutation({
    mutationFn: async () => {
      if (!user || !newName.trim()) throw new Error("Nome richiesto");
      const { error } = await supabase.from("athletes").insert({ user_id: user.id, name: newName.trim() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["athletes"] }); setNewName(""); toast.success("Atleta aggiunto"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("athletes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["athletes"] }); toast.success("Atleta rimosso"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: async () => {
      if (!editAthlete || !editName.trim()) throw new Error("Nome richiesto");
      const { error } = await supabase.from("athletes").update({ name: editName.trim() }).eq("id", editAthlete.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["athletes"] }); setEditAthlete(null); toast.success("Atleta rinominato"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const athleteHistory = (a: Athlete) => attendance.filter((x) => x.athlete_id === a.id);

  if (selectedAthlete) {
    const hist = athleteHistory(selectedAthlete);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedAthlete(null)} className="text-sm text-primary font-semibold">← Torna agli atleti</button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/15 grid place-items-center text-primary font-bold text-lg">{selectedAthlete.name[0].toUpperCase()}</div>
          <div>
            <h2 className="text-xl font-bold">{selectedAthlete.name}</h2>
            <p className="text-xs text-muted-foreground">{hist.length} allenamenti</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card/80 p-3 text-center">
            <div className="text-lg font-bold text-primary">{hist.filter((x) => x.status === "present").length}</div>
            <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Presenti</div>
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-3 text-center">
            <div className="text-lg font-bold text-primary">{hist.filter((x) => x.paid).length}</div>
            <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Pagati</div>
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {hist.some((x) => x.rating) ? (hist.filter((x) => x.rating).reduce((a, x) => a + (x.rating ?? 0), 0) / hist.filter((x) => x.rating).length).toFixed(1) : "—"}
            </div>
            <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Media voto</div>
          </div>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {hist.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/20">
              <span className="font-semibold text-foreground w-24 shrink-0">{a.date}</span>
              <span className={a.status === "present" ? "text-green-500" : a.status === "absent" ? "text-red-500" : "text-yellow-500"}>
                {STATUSES.find((s) => s.key === a.status)?.label ?? a.status}
              </span>
              {a.rating && <span className="text-muted-foreground">· {a.rating}/5</span>}
              {a.paid && <span className="text-green-500">· Pagato</span>}
              {a.notes && <span className="text-muted-foreground">· {a.notes}</span>}
            </div>
          ))}
          {hist.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nessun allenamento registrato</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome atleta" className="bg-card border-border" />
        <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending || !newName.trim()}><Plus className="h-4 w-4" /></Button>
      </div>
      {athletes.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/40">
          <User className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">Nessun atleta</p>
          <p className="text-sm text-muted-foreground">Aggiungi il primo atleta per iniziare.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {athletes.map((a) => {
            const hist = athleteHistory(a);
            const presenti = hist.filter((x) => x.status === "present").length;
            return (
              <li key={a.id} className="rounded-xl border border-border bg-card/80 overflow-hidden">
                <button onClick={() => setSelectedAthlete(a)} className="w-full flex items-center gap-3 p-3 text-left">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold text-sm shrink-0">{a.name[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{hist.length} allenamenti · {presenti} presenti</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
                <div className="flex border-t border-border/50">
                  <button onClick={() => { setEditAthlete(a); setEditName(a.name); }} className="flex-1 py-2 text-xs font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-1 border-r border-border/50">
                    <Pencil className="h-3 w-3" /> Rinomina
                  </button>
                  <button onClick={() => del.mutate(a.id)} className="flex-1 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive flex items-center justify-center gap-1">
                    <Trash2 className="h-3 w-3" /> Rimuovi
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editAthlete} onOpenChange={(o) => { if (!o) setEditAthlete(null); }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Rinomina atleta</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); rename.mutate(); }} className="space-y-3">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nuovo nome" required />
            <Button type="submit" disabled={rename.isPending} className="w-full font-semibold">Salva</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttendanceTab({ athletes, attendance }: { athletes: Athlete[]; attendance: Attendance[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const dayAttendance = attendance.filter((a) => a.date === selectedDate);
  const dayMap = new Map(dayAttendance.map((a) => [a.athlete_id, a]));

  const setStatus = useMutation({
    mutationFn: async ({ athlete_id, status }: { athlete_id: string; status: string }) => {
      if (!user) throw new Error("No user");
      const existing = dayMap.get(athlete_id);
      if (existing) {
        await supabase.from("training_attendance").update({ status }).eq("id", existing.id);
      } else {
        await supabase.from("training_attendance").insert({ user_id: user.id, athlete_id, date: selectedDate, status });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setPaid = useMutation({
    mutationFn: async ({ athlete_id, paid }: { athlete_id: string; paid: boolean }) => {
      if (!user) throw new Error("No user");
      const existing = dayMap.get(athlete_id);
      if (existing) {
        await supabase.from("training_attendance").update({ paid }).eq("id", existing.id);
      } else {
        await supabase.from("training_attendance").insert({ user_id: user.id, athlete_id, date: selectedDate, status: "present", paid });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setRating = useMutation({
    mutationFn: async ({ athlete_id, rating }: { athlete_id: string; rating: number }) => {
      if (!user) throw new Error("No user");
      const existing = dayMap.get(athlete_id);
      if (existing) {
        await supabase.from("training_attendance").update({ rating }).eq("id", existing.id);
      } else {
        await supabase.from("training_attendance").insert({ user_id: user.id, athlete_id, date: selectedDate, status: "present", rating });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const presentCount = dayAttendance.filter((a) => a.status === "present").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40 bg-card border-border" />
        <span className="text-xs text-muted-foreground">
          {dayAttendance.length > 0 ? `${presentCount}/${athletes.length} presenti` : "Nessun dato"}
        </span>
      </div>

      {athletes.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/40">
          <p className="font-semibold">Aggiungi atleti prima di segnare le presenze</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {athletes.map((a) => {
            const att = dayMap.get(a.id);
            return (
              <li key={a.id} className="rounded-xl border border-border bg-card/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.name}</span>
                  <div className="flex gap-1">
                    {STATUSES.map((s) => (
                      <button key={s.key} onClick={() => setStatus.mutate({ athlete_id: a.id, status: s.key })}
                        className={`text-[10px] px-2 py-1 rounded-full font-semibold transition ${att?.status === s.key ? s.color + " ring-1 ring-current" : "bg-muted text-muted-foreground"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">Voto:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating.mutate({ athlete_id: a.id, rating: n })}
                        className={`h-6 w-6 rounded text-[10px] font-bold ${att?.rating && att.rating >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setPaid.mutate({ athlete_id: a.id, paid: !att?.paid })}
                    className={`ml-auto text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${att?.paid ? "bg-green-500/10 text-green-500 ring-1 ring-green-500" : "bg-muted text-muted-foreground"}`}>
                    <DollarSign className="h-3 w-3" /> {att?.paid ? "Pagato" : "Quota"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {attendance.length > 0 && (
        <div className="rounded-xl border border-border bg-card/80 p-4">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2">ULTIME PRESENZE</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {attendance.slice(0, 30).map((a) => {
              const ath = athletes.find((x) => x.id === a.athlete_id);
              return (
                <div key={a.id} className="flex items-center gap-2 text-[11px] py-1 border-b border-border/20 last:border-0">
                  <span className="font-semibold text-foreground w-24 shrink-0">{a.date}</span>
                  <span>{ath?.name ?? "?"}</span>
                  <span className={a.status === "present" ? "text-green-500" : a.status === "absent" ? "text-red-500" : "text-yellow-500"}>
                    {STATUSES.find((s) => s.key === a.status)?.label ?? a.status}
                  </span>
                  {a.rating && <span className="text-muted-foreground">· {a.rating}/5</span>}
                  {a.paid && <span className="text-green-500">· Pagato</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsTab({ athletes, attendance }: { athletes: Athlete[]; attendance: Attendance[] }) {
  const stats = useMemo(() => {
    const totalPresenti = attendance.filter((a) => a.status === "present").length;
    const totalAssenze = attendance.filter((a) => a.status === "absent").length;
    const totalRitardi = attendance.filter((a) => a.status === "late").length;
    const totalPagati = attendance.filter((a) => a.paid).length;
    const ratingValues = attendance.filter((a) => a.rating).map((a) => a.rating as number);
    const mediaVoto = ratingValues.length ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1) : "—";

    const athleteStats = athletes.map((a) => {
      const athAtt = attendance.filter((x) => x.athlete_id === a.id);
      return {
        ...a,
        totale: athAtt.length,
        presenti: athAtt.filter((x) => x.status === "present").length,
        pagati: athAtt.filter((x) => x.paid).length,
        mediaVotoAth: athAtt.some((x) => x.rating) ? (athAtt.filter((x) => x.rating).reduce((s, x) => s + (x.rating ?? 0), 0) / athAtt.filter((x) => x.rating).length).toFixed(1) : "—",
      };
    }).filter((a) => a.totale > 0).sort((a, b) => b.presenti - a.presenti);

    const pieData = [
      { name: "Presenti", value: totalPresenti },
      { name: "Assenti", value: totalAssenze },
      { name: "Ritardi", value: totalRitardi },
    ].filter((d) => d.value > 0);

    return { totalPresenti, totalAssenze, totalRitardi, totalPagati, mediaVoto, athleteStats, pieData };
  }, [athletes, attendance]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-card/80 p-3 text-center">
          <div className="text-xl font-bold text-primary">{stats.totalPresenti}</div>
          <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Presenti</div>
        </div>
        <div className="rounded-xl border border-border bg-card/80 p-3 text-center">
          <div className="text-xl font-bold text-destructive">{stats.totalAssenze}</div>
          <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Assenze</div>
        </div>
        <div className="rounded-xl border border-border bg-card/80 p-3 text-center">
          <div className="text-xl font-bold text-yellow-500">{stats.totalRitardi}</div>
          <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Ritardi</div>
        </div>
        <div className="rounded-xl border border-border bg-card/80 p-3 text-center">
          <div className="text-xl font-bold text-green-500">{stats.totalPagati}</div>
          <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Pagamenti</div>
        </div>
      </div>

      {stats.pieData.length > 0 && (
        <div className="rounded-xl border border-border bg-card/80 p-4">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2">DISTRIBUZIONE PRESENZE</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                  {stats.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.014 250)", border: "1px solid oklch(0.26 0.018 250)", borderRadius: 12, color: "white", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/80 p-4">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2">CLASSIFICA ATLETI</p>
        {stats.athleteStats.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nessun dato</p>
        ) : (
          <div className="space-y-1">
            {stats.athleteStats.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/20 last:border-0">
                <span className="font-bold text-muted-foreground w-5">{i + 1}.</span>
                <span className="font-semibold flex-1">{a.name}</span>
                <span className="text-muted-foreground">{a.presenti}/{a.totale}</span>
                <span className="text-primary font-bold">{a.presenti > 0 ? Math.round((a.presenti / a.totale) * 100) : 0}%</span>
                {a.mediaVotoAth !== "—" && <span className="text-muted-foreground">· v. {a.mediaVotoAth}</span>}
                {a.pagati > 0 && <span className="text-green-500">· {a.pagati} pag.</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompetitionsTab({ competitions }: { competitions: Competition[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<Competition | null>(null);

  const add = useMutation({
    mutationFn: async () => {
      if (!user || !name.trim()) throw new Error("Nome richiesto");
      const { error } = await supabase.from("competitions").insert({
        user_id: user.id, name: name.trim(), date, location: location.trim() || null, notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coach-competitions"] }); qc.invalidateQueries({ queryKey: ["competitions"] }); setOpen(false); setName(""); setNotes(""); setLocation(""); toast.success("Gara aggiunta"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editing || !name.trim()) throw new Error("Nome richiesto");
      const { error } = await supabase.from("competitions").update({
        name: name.trim(), date, location: location.trim() || null, notes: notes.trim() || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coach-competitions"] }); qc.invalidateQueries({ queryKey: ["competitions"] }); setEditing(null); setOpen(false); toast.success("Gara aggiornata"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coach-competitions"] }); qc.invalidateQueries({ queryKey: ["competitions"] }); toast.success("Gara eliminata"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setName(""); setDate(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); }); setLocation(""); setNotes(""); setEditing(null); setOpen(true); };
  const openEdit = (c: Competition) => { setName(c.name); setDate(c.date); setLocation(c.location ?? ""); setNotes(c.notes ?? ""); setEditing(c); setOpen(true); };

  const futureComps = competitions.filter((c) => new Date(c.date) >= new Date(new Date().toDateString()));
  const pastComps = competitions.filter((c) => new Date(c.date) < new Date(new Date().toDateString()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold tracking-widest text-muted-foreground">CALENDARIO GARE</p>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nuova</Button>
      </div>

      {futureComps.length > 0 && (
        <div className="rounded-xl border border-border bg-card/80 p-4">
          <p className="text-[10px] font-bold tracking-widest text-primary mb-3">IN ARRIVO</p>
          <div className="space-y-2">
            {futureComps.map((c) => {
              const d = new Date(c.date);
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 grid place-items-center text-primary font-bold text-xs shrink-0">
                    {d.getDate()}/{d.getMonth() + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long" })}
                      {c.location && <> · {c.location}</>}
                    </p>
                  </div>
                  <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary p-1"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del.mutate(c.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastComps.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3">PASSATE</p>
          <div className="space-y-1">
            {pastComps.slice(-10).reverse().map((c) => {
              const d = new Date(c.date);
              return (
                <div key={c.id} className="flex items-center gap-2 text-xs opacity-60">
                  <span className="font-semibold w-16 shrink-0">{d.getDate()}/{d.getMonth() + 1}</span>
                  <span className="flex-1">{c.name}</span>
                  {c.location && <span className="text-muted-foreground">· {c.location}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {competitions.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/40">
          <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">Nessuna gara</p>
          <p className="text-sm text-muted-foreground">Aggiungi la prima gara.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>{editing ? "Modifica gara" : "Nuova gara"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editing ? update.mutate() : add.mutate(); }} className="space-y-3">
            <div className="space-y-1.5"><Label>Nome gara</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Gara Regionale" required /></div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>Luogo</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="es. Palaghiaccio" /></div>
            <div className="space-y-1.5"><Label>Note</Label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg bg-background/40 border border-border px-3 py-2 text-sm resize-none" /></div>
            <Button type="submit" disabled={add.isPending || update.isPending} className="w-full font-semibold">
              {editing ? "Salva modifiche" : "Aggiungi gara"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
