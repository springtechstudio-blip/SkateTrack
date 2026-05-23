import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Code, Minus, Link as LinkIcon, Image as ImageIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (html: string) => void;
  userId: string;
  placeholder?: string;
};

export function RichEditor({ value, onChange, userId, placeholder }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Scrivi qui i tuoi pensieri…" }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "tiptap prose prose-invert max-w-none text-base" } },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const openLinkDialog = () => {
    const sel = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
    setLinkText(sel);
    setLinkUrl("");
    setLinkOpen(true);
  };

  const applyLink = () => {
    if (!linkUrl) return;
    if (linkText && editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }
    setLinkOpen(false);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("note-images").upload(path, file, { upsert: false });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("note-images").getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <Toolbar editor={editor} onLink={openLinkDialog} onImage={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
      <EditorContent editor={editor} />
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Inserisci link</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ltxt">Testo (facoltativo)</Label>
              <Input id="ltxt" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Testo visualizzato" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lurl">URL</Label>
              <Input id="lurl" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>Annulla</Button>
            <Button onClick={applyLink}>Inserisci</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tb({ active, onClick, children, label }: { active?: boolean; onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`h-8 w-8 grid place-items-center rounded-md transition ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onLink, onImage }: { editor: Editor; onLink: () => void; onImage: () => void }) {
  return (
    <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-card/95 backdrop-blur px-1.5 py-1">
      <Tb label="Grassetto" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Tb>
      <Tb label="Corsivo" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Tb>
      <Tb label="Sottolineato" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Tb>
      <Tb label="Barrato" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Tb>
      <div className="w-px h-5 bg-border mx-1" />
      <Tb label="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Tb>
      <Tb label="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Tb>
      <Tb label="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Tb>
      <div className="w-px h-5 bg-border mx-1" />
      <Tb label="Elenco puntato" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Tb>
      <Tb label="Elenco numerato" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Tb>
      <Tb label="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="h-4 w-4" /></Tb>
      <div className="w-px h-5 bg-border mx-1" />
      <Tb label="Citazione" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Tb>
      <Tb label="Codice" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="h-4 w-4" /></Tb>
      <Tb label="Divisore" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Tb>
      <div className="w-px h-5 bg-border mx-1" />
      <Tb label="Link" active={editor.isActive("link")} onClick={onLink}><LinkIcon className="h-4 w-4" /></Tb>
      <Tb label="Immagine" onClick={onImage}><ImageIcon className="h-4 w-4" /></Tb>
    </div>
  );
}