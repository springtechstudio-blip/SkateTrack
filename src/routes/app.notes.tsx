import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search, Pin, ArchiveRestore, Trash, Upload, X, Check } from "lucide-react";
import { toast } from "sonner";
import { RichEditor } from "@/components/editor/RichEditor";
import JSZip from "jszip";

export const Route = createFileRoute("/app/notes")({ component: NotesPage });

type Note = {
  id: string; title: string; content: string; content_html: string;
  pinned: boolean; tags: string[]; updated_at: string; deleted_at: string | null;
};

function NotesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [view, setView] = useState<"all" | "trash">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const notesQ = useQuery({
    queryKey: ["notes", view],
    queryFn: async () => {
      let query = supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
      query = view === "all" ? query.is("deleted_at", null) : query.not("deleted_at", "is", null);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Note[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");
      const { data, error } = await supabase.from("notes").insert({
        user_id: user.id, title: "Nuova nota", content: "", content_html: "<p></p>",
      }).select().single();
      if (error) throw error;
      return data as unknown as Note;
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["notes"] }); setEditing(n); },
  });

  const trash = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setEditing(null); toast.success("Spostata nel cestino"); },
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").update({ deleted_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Ripristinata"); },
  });

  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });

  // auto-clean notes older than 30 days from trash
  useEffect(() => {
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
    supabase.from("notes").delete().not("deleted_at", "is", null).lt("deleted_at", cutoff).then(() => {});
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    (notesQ.data ?? []).forEach((n) => n.tags?.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [notesQ.data]);

  const notes = (notesQ.data ?? []).filter((n) => {
    if (activeTag && !n.tags?.includes(activeTag)) return false;
    const ql = q.toLowerCase();
    if (!ql) return true;
    return n.title.toLowerCase().includes(ql) || n.content.toLowerCase().includes(ql) || (n.content_html || "").toLowerCase().includes(ql);
  });

  // Notion import
  const importNotion = async (file: File) => {
    if (!user) return;
    try {
      const zip = await JSZip.loadAsync(file);
      const inserts: { title: string; content_html: string; content: string; tags: string[]; user_id: string }[] = [];
      for (const name of Object.keys(zip.files)) {
        const f = zip.files[name];
        if (f.dir) continue;
        if (name.endsWith(".md")) {
          const text = await f.async("string");
          const title = name.split("/").pop()!.replace(/\.md$/, "").replace(/\s*[a-f0-9]{20,}$/, "").trim();
          inserts.push({ user_id: user.id, title, content: text, content_html: mdToHtml(text), tags: ["Notion"] });
        } else if (name.endsWith(".csv")) {
          const text = await f.async("string");
          const title = name.split("/").pop()!.replace(/\.csv$/, "").trim();
          inserts.push({ user_id: user.id, title, content: text, content_html: csvToHtml(text), tags: ["Notion"] });
        }
      }
      if (!inserts.length) return toast.error("Nessun file .md o .csv trovato nello ZIP");
      const { error } = await supabase.from("notes").insert(inserts);
      if (error) throw error;
      toast.success(`Importate ${inserts.length} note da Notion`);
      qc.invalidateQueries({ queryKey: ["notes"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (editing) {
    return <NoteEditor key={editing.id} note={editing} onClose={() => setEditing(null)} onTrash={() => trash.mutate(editing.id)} allTags={allTags} />;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary">PENSIERI</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Note</h1>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" className="bg-card border-border" onClick={() => importRef.current?.click()} aria-label="Importa Notion">
            <Upload className="h-4 w-4" />
          </Button>
          <input ref={importRef} type="file" accept=".zip" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importNotion(f); e.target.value = ""; }} />
          <Button size="icon" onClick={() => create.mutate()} className="text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
            <Plus className="h-5 w-5" strokeWidth={2.6} />
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 text-xs">
        <button onClick={() => setView("all")} className={`px-3 py-1.5 rounded-full font-semibold ${view === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Tutte</button>
        <button onClick={() => setView("trash")} className={`px-3 py-1.5 rounded-full font-semibold ${view === "trash" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <Trash className="h-3 w-3 inline mr-1" />Cestino
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca…" className="pl-9 bg-card border-border" />
      </div>

      {allTags.length > 0 && view === "all" && (
        <div className="flex flex-wrap gap-1.5">
          {activeTag && (
            <button onClick={() => setActiveTag(null)} className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary font-semibold inline-flex items-center gap-1">
              <X className="h-3 w-3" /> {activeTag}
            </button>
          )}
          {allTags.filter((t) => t !== activeTag).map((t) => (
            <button key={t} onClick={() => setActiveTag(t)} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground font-semibold">
              #{t}
            </button>
          ))}
        </div>
      )}

      {notesQ.isLoading ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />)}</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-border bg-card/40">
          <div className="text-4xl mb-3">📝</div>
          <p className="font-semibold">{view === "trash" ? "Cestino vuoto" : "Nessuna nota"}</p>
          <p className="text-sm text-muted-foreground">{view === "trash" ? "Le note eliminate appariranno qui per 30 giorni." : "Tocca + per iniziare a scrivere."}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {notes.map((n) => (
            <li key={n.id} className="relative">
              <button onClick={() => view === "all" ? setEditing(n) : null}
                className="w-full h-36 text-left rounded-2xl border border-border bg-card/80 p-3 hover:border-primary/50 transition relative overflow-hidden">
                {n.pinned && <Pin className="absolute top-2 right-2 h-3.5 w-3.5 fill-primary text-primary" />}
                <p className="font-bold text-sm mb-1 line-clamp-2">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">{htmlToPreview(n.content_html || n.content) || "Vuota"}</p>
                {n.tags?.length > 0 && (
                  <div className="absolute bottom-2 left-3 right-3 flex gap-1 flex-wrap">
                    {n.tags.slice(0, 2).map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">#{t}</span>)}
                  </div>
                )}
              </button>
              {view === "trash" && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => restore.mutate(n.id)} className="h-7 w-7 grid place-items-center rounded-md bg-card border border-border" title="Ripristina"><ArchiveRestore className="h-3.5 w-3.5" /></button>
                  <button onClick={() => purge.mutate(n.id)} className="h-7 w-7 grid place-items-center rounded-md bg-destructive/20 text-destructive" title="Elimina definitivamente"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteEditor({ note, onClose, onTrash, allTags }: {
  note: Note; onClose: () => void; onTrash: () => void; allTags: string[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState(note.title);
  const [html, setHtml] = useState(note.content_html || "<p></p>");
  const [pinned, setPinned] = useState(note.pinned);
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("saved");
  const dirty = useRef(false);

  // auto-save every 3s
  useEffect(() => {
    const t = setInterval(async () => {
      if (!dirty.current) return;
      dirty.current = false;
      setStatus("saving");
      const { error } = await supabase.from("notes").update({
        title, content_html: html, content: htmlToPreview(html),
        pinned, tags, updated_at: new Date().toISOString(),
      }).eq("id", note.id);
      setStatus(error ? "idle" : "saved");
      if (!error) qc.invalidateQueries({ queryKey: ["notes"] });
    }, 3000);
    return () => clearInterval(t);
  }, [title, html, pinned, tags, note.id, qc]);

  useEffect(() => { dirty.current = true; setStatus("idle"); }, [title, html, pinned, tags]);

  const onClickBack = async () => {
    if (dirty.current) {
      await supabase.from("notes").update({
        title, content_html: html, content: htmlToPreview(html), pinned, tags, updated_at: new Date().toISOString(),
      }).eq("id", note.id);
      qc.invalidateQueries({ queryKey: ["notes"] });
    }
    onClose();
  };

  const addTag = (t: string) => {
    const v = t.trim().replace(/^#/, "");
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  const suggestions = allTags.filter((t) => tagInput && t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)).slice(0, 5);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <button onClick={onClickBack} className="text-sm text-primary font-semibold">← Indietro</button>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          {status === "saved" && <><Check className="h-3 w-3 text-primary" /> Salvato</>}
          {status === "saving" && "Salvataggio…"}
          {status === "idle" && "Modificato"}
        </span>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-bold bg-transparent border-0 px-0 h-auto focus-visible:ring-0" placeholder="Titolo" />
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1">
              #{t}
              <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
            </span>
          ))}
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
            placeholder="+ tag" className="text-xs bg-transparent border border-dashed border-border rounded-full px-2 py-1 outline-none w-24 focus:border-primary" />
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button key={s} onClick={() => addTag(s)} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:text-primary">#{s}</button>
            ))}
          </div>
        )}
      </div>
      {user && <RichEditor value={html} onChange={setHtml} userId={user.id} />}
      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => setPinned(!pinned)} className="bg-card">
          <Pin className={`h-4 w-4 mr-1 ${pinned ? "fill-primary text-primary" : ""}`} />
          {pinned ? "Fissata" : "Fissa"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onTrash} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-1" /> Sposta nel cestino
        </Button>
      </div>
    </div>
  );
}

function htmlToPreview(html: string) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

function mdToHtml(md: string): string {
  // minimal markdown converter
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false, inOl = false;
  const flush = () => { if (inList) { out.push("</ul>"); inList = false; } if (inOl) { out.push("</ol>"); inOl = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) { flush(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if (line.match(/^[-*]\s+\[[ x]\]\s+/i)) {
      flush(); out.push(`<p>${inline(line.replace(/^[-*]\s+/, ""))}</p>`); continue;
    }
    if (line.match(/^[-*]\s+/)) {
      if (!inList) { flush(); out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`); continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      if (!inOl) { flush(); out.push("<ol>"); inOl = true; }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`); continue;
    }
    if (line.startsWith("> ")) { flush(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; }
    if (line === "---") { flush(); out.push("<hr/>"); continue; }
    flush(); out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return out.join("\n");
}

function inline(s: string) {
  let r = escapeHtml(s);
  r = r.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  r = r.replace(/`([^`]+)`/g, "<code>$1</code>");
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return r;
}

function csvToHtml(csv: string): string {
  const rows = csv.split(/\r?\n/).filter(Boolean).map((r) => r.split(","));
  if (!rows.length) return "<p></p>";
  const [head, ...body] = rows;
  const th = head.map((h) => `<th style="text-align:left;padding:4px 8px;border-bottom:1px solid #444">${escapeHtml(h)}</th>`).join("");
  const tr = body.map((r) => `<tr>${r.map((c) => `<td style="padding:4px 8px;border-bottom:1px solid #333">${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
  return `<table style="border-collapse:collapse;width:100%"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}