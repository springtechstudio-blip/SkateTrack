import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { Completion, Habit } from "@/lib/habits";
import { toISO } from "@/lib/habits";

export function HabitsStats({ habits, completions }: { habits: Habit[]; completions: Completion[] }) {
  const last14 = useMemo(() => {
    const arr: { day: string; done: number; pct: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISO(d);
      const done = completions.filter((c) => c.date === iso && c.status === "done").length;
      arr.push({
        day: String(d.getDate()),
        done,
        pct: habits.length ? Math.round((done / habits.length) * 100) : 0,
      });
    }
    return arr;
  }, [habits.length, completions]);

  const perHabit = useMemo(
    () =>
      habits.map((h) => ({
        name: h.name.length > 10 ? h.name.slice(0, 10) + "…" : h.name,
        done: completions.filter((c) => c.habit_id === h.id && c.status === "done").length,
        color: h.color,
      })),
    [habits, completions],
  );

  if (!habits.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Crea un'abitudine per vedere le statistiche.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-2">COMPLETAMENTO 14 GIORNI (%)</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last14}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
              <XAxis dataKey="day" stroke="oklch(0.62 0.02 250)" fontSize={11} />
              <YAxis stroke="oklch(0.62 0.02 250)" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.014 250)",
                  border: "1px solid oklch(0.26 0.018 250)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="pct" stroke="oklch(0.78 0.16 165)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-2">TOTALE PER ABITUDINE</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perHabit}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.018 250)" />
              <XAxis dataKey="name" stroke="oklch(0.62 0.02 250)" fontSize={10} />
              <YAxis stroke="oklch(0.62 0.02 250)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.014 250)",
                  border: "1px solid oklch(0.26 0.018 250)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="done" fill="oklch(0.78 0.16 165)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}