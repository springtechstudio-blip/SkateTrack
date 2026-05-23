import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "it" | "en";
const dict = {
  it: {
    habits: "Abitudini", notes: "Note", skating: "Skating", settings: "Impostazioni",
    today: "OGGI", hello: "Ciao", save: "Salva", cancel: "Annulla", delete: "Elimina",
    saved: "Salvato",
  },
  en: {
    habits: "Habits", notes: "Notes", skating: "Skating", settings: "Settings",
    today: "TODAY", hello: "Hi", save: "Save", cancel: "Cancel", delete: "Delete",
    saved: "Saved",
  },
} as const;
type Key = keyof typeof dict["it"];
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "it", setLang: () => {}, t: (k) => k,
});
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    typeof window !== "undefined" ? ((localStorage.getItem("myhub.lang") as Lang) || "it") : "it",
  );
  const setLang = (l: Lang) => { localStorage.setItem("myhub.lang", l); setLangState(l); };
  const t = (k: Key) => dict[lang][k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);