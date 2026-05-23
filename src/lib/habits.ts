import { supabase } from "@/integrations/supabase/client";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  category: string;
  frequency: string;
  weekly_target: number;
  monthly_target: number;
  frequency_days: number[];
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
};

export type Completion = {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  status: "done" | "skipped";
  note?: string | null;
};

export const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export async function fetchHabits() {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Habit[];
}

export async function fetchCompletionsRange(from: string, to: string) {
  const { data, error } = await supabase
    .from("habit_completions")
    .select("*")
    .gte("date", from)
    .lte("date", to);
  if (error) throw error;
  return (data ?? []) as Completion[];
}

export async function toggleCompletion(
  habitId: string,
  userId: string,
  date: string,
  current: Completion | undefined,
  status: "done" | "skipped" = "done",
) {
  if (current && current.status === status) {
    const { error } = await supabase.from("habit_completions").delete().eq("id", current.id);
    if (error) throw error;
    return null;
  }
  if (current) {
    const { data, error } = await supabase
      .from("habit_completions")
      .update({ status })
      .eq("id", current.id)
      .select()
      .single();
    if (error) throw error;
    return data as Completion;
  }
  const { data, error } = await supabase
    .from("habit_completions")
    .insert({ habit_id: habitId, user_id: userId, date, status })
    .select()
    .single();
  if (error) throw error;
  return data as Completion;
}

// Streak: count consecutive days back from today with done status
export function calcStreak(completions: Completion[], habitId: string) {
  const dates = new Set(
    completions.filter((c) => c.habit_id === habitId && c.status !== "skipped").map((c) => c.date),
  );
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const iso = toISO(d);
    if (dates.has(iso)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // allow today not done yet
      if (i === 0) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}