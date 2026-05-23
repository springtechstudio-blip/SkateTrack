import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "light" | "dark" | "auto";
const Ctx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({ mode: "light", setMode: () => {} });

function applyMode(mode: Mode) {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("light", !dark);
  root.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("myhub.theme") as Mode) || "light";
  });
  useEffect(() => {
    applyMode(mode);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => mode === "auto" && applyMode("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);
  const setMode = (m: Mode) => {
    localStorage.setItem("myhub.theme", m);
    setModeState(m);
  };
  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);