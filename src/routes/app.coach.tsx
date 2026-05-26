import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, User, Check, X, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/coach")({ component: CoachPage });

type Athlete = { id: string; name: string; created_at: string };
type Attendance = { id: string; athlete_id: string; date: string; status: string; rating: number | null; paid: boolean; notes: string | null };
type Competition = { id: string; name: string; date: string; location: string | null; notes: string | null };

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

  const [tab, setTab] = useState<"athletes" | "attendance" | "competitions">("athletes");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <p className="text-xs font-bold tracking-widest text-primary">ALLENATORE</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Pannello Allenatore</h1>
      </div>

      <div className="flex gap-1.5 text-xs">
        {(["athletes", "attendance", "competitions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full font-semibold capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {t === "athletes" ? "Atleti" : t === "attendance" ? "Presenze" : "Gare"}
          </button>
        ))}
      </div>

      {tab === "athletes" && (
        <AthletesTab athletes={athletes} />
      )}

      {tab === "attendance" && (
        <AttendanceTab athletes={athletes} attendance={attendance} />
      )}

      {tab === "competitions" && (
        <CompetitionsTab competitions={competitions} />
      )}
    </div>
  );
}

function AthletesTab({ athletes }: { athletes: Athlete[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");

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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome atleta" className="bg-card border-border" />
        <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}><Plus className="h-4 w-4" /></Button>
      </div>
      {athletes.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/40">
          <User className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">Nessun atleta</p>
          <p className="text-sm text-muted-foreground">Aggiungi il primo atleta.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {athletes.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-card/80 p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold text-sm">{a.name[0].toUpperCase()}</div>
              <span className="flex-1 font-semibold">{a.name}</span>
              <button onClick={() => del.mutate(a.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AttendanceTab({ athletes, attendance }: { athletes: Athlete[]; attendance: Attendance[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const todayAttendance = attendance.filter((a) => a.date === today);
  const todayMap = new Map(todayAttendance.map((a) => [a.athlete_id, a]));

  const setStatus = useMutation({
    mutationFn: async ({ athlete_id, status }: { athlete_id: string; status: string }) => {
      if (!user) throw new Error("No user");
      const existing = todayMap.get(athlete_id);
      if (existing) {
        await supabase.from("training_attendance").update({ status }).eq("id", existing.id);
      } else {
        await supabase.from("training_attendance").insert({ user_id: user.id, athlete_id, date: today, status });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setPaid = useMutation({
    mutationFn: async ({ athlete_id, paid }: { athlete_id: string; paid: boolean }) => {
      if (!user) throw new Error("No user");
      const existing = todayMap.get(athlete_id);
      if (existing) {
        await supabase.from("training_attendance").update({ paid }).eq("id", existing.id);
      } else {
        await supabase.from("training_attendance").insert({ user_id: user.id, athlete_id, date: today, status: "present", paid });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setRating = useMutation({
    mutationFn: async ({ athlete_id, rating }: { athlete_id: string; rating: number }) => {
      if (!user) throw new Error("No user");
      const existing = todayMap.get(athlete_id);
      if (existing) {
        await supabase.from("training_attendance").update({ rating }).eq("id", existing.id);
      } else {
        await supabase.from("training_attendance").insert({ user_id: user.id, athlete_id, date: today, status: "present", rating });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const STATUSES = [
    { key: "present", label: "Presente", color: "text-green-500 bg-green-500/10" },
    { key: "absent", label: "Assente", color: "text-red-500 bg-red-500/10" },
    { key: "late", label: "Ritardo", color: "text-yellow-500 bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold tracking-widest text-muted-foreground">ALLENAMENTO DEL {today}</p>
      {athletes.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/40">
          <p className="font-semibold">Aggiungi atleti prima di segnare le presenze</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {athletes.map((a) => {
            const att = todayMap.get(a.id);
            return (
              <li key={a.id} className="rounded-xl border border-border bg-card/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.name}</span>
                  <div className="flex gap-1.5">
                    {STATUSES.map((s) => (
                      <button key={s.key} onClick={() => setStatus.mutate({ athlete_id: a.id, status: s.key })}
                        className={`text-xs px-2 py-1 rounded-full font-semibold transition ${att?.status === s.key ? s.color + " ring-1 ring-current" : "bg-muted text-muted-foreground"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Voto:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating.mutate({ athlete_id: a.id, rating: n })}
                        className={`h-6 w-6 rounded text-xs font-bold ${att?.rating && att.rating >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setPaid.mutate({ athlete_id: a.id, paid: !att?.paid })}
                    className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold ${att?.paid ? "bg-green-500/10 text-green-500 ring-1 ring-green-500" : "bg-muted text-muted-foreground"}`}>
                    {att?.paid ? "Pagato" : "Quota"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6">
        <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">CRONOLOGIA PRESENZE</p>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {attendance.slice(0, 50).map((a) => {
            const ath = athletes.find((x) => x.id === a.athlete_id);
            return (
              <div key={a.id} className="text-xs text-muted-foreground flex items-center gap-2 py-1 border-b border-border/20">
                <span className="font-semibold text-foreground">{a.date}</span>
                <span>{ath?.name ?? "?"}</span>
                <span className={a.status === "present" ? "text-green-500" : a.status === "absent" ? "text-red-500" : "text-yellow-500"}>
                  {a.status === "present" ? "Presente" : a.status === "absent" ? "Assente" : "Ritardo"}
                </span>
                {a.rating && <span>· Voto: {a.rating}/5</span>}
                {a.paid && <span className="text-green-500">· Pagato</span>}
              </div>
            );
          })}
        </div>
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coach-competitions"] }); setOpen(false); setName(""); setNotes(""); setLocation(""); toast.success("Gara aggiunta"); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coach-competitions"] }); setEditing(null); setOpen(false); toast.success("Gara aggiornata"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coach-competitions"] }); toast.success("Gara eliminata"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setName(""); setDate(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); }); setLocation(""); setNotes(""); setEditing(null); setOpen(true); };
  const openEdit = (c: Competition) => { setName(c.name); setDate(c.date); setLocation(c.location ?? ""); setNotes(c.notes ?? ""); setEditing(c); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold tracking-widest text-muted-foreground">PROSSIME GARE</p>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nuova gara</Button>
      </div>

      {competitions.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/40">
          <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">Nessuna gara</p>
          <p className="text-sm text-muted-foreground">Aggiungi la prima gara.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {competitions.map((c) => {
            const d = new Date(c.date);
            const isPast = d < new Date(new Date().toDateString());
            return (
              <li key={c.id} className={`rounded-xl border p-3 flex items-center gap-3 ${isPast ? "border-border/40 bg-card/40 opacity-60" : "border-border bg-card/80"}`}>
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold text-xs shrink-0">
                  {d.getDate()}/{d.getMonth() + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long" })}
                    {c.location && <> · {c.location}</>}
                  </p>
                  {c.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{c.notes}</p>}
                </div>
                <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary p-1"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => del.mutate(c.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>{editing ? "Modifica gara" : "Nuova gara"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editing ? update.mutate() : add.mutate(); }} className="space-y-3">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Gara Regionale" required /></div>
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
