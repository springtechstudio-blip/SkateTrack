import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FCM_URL = "https://fcm.googleapis.com/fcm/send";

function localDate(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function localTime(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  } catch {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  }
}

function getCurrentSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const totalMin = h * 60 + m;
  if (totalMin >= 14 * 60 && totalMin < 16 * 60) return 1;
  if (totalMin >= 16 * 60 && totalMin < 18 * 60) return 2;
  if (totalMin >= 18 * 60 && totalMin < 20 * 60) return 3;
  return 0;
}

function slotLabel(slot: number): string {
  switch (slot) {
    case 1: return "pomeriggio";
    case 2: return "tardo pomeriggio";
    case 3: return "sera";
    default: return "";
  }
}

const EVENING_RESET_HOUR = 5;
const MAX_NOTIFICATION_BODY = 200;

async function enqueueNotification(
  url: string,
  hdrs: Record<string, string>,
  userId: string,
  token: string,
  title: string,
  body: string,
  language?: string,
): Promise<boolean> {
  const truncatedBody = body.length > MAX_NOTIFICATION_BODY
    ? body.substring(0, MAX_NOTIFICATION_BODY - 3) + "..."
    : body;

  const res = await fetch(`${url}/rest/v1/notification_queue`, {
    method: "POST",
    headers: { ...hdrs, Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      token,
      title,
      body: truncatedBody,
      language: language || "it",
    }),
  });
  return res.ok;
}

serve(async () => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fcmKey = Deno.env.get("FCM_SERVER_KEY")!;
    const hdrs = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

    const [settings, pushTokens] = await Promise.all([
      (await fetch(`${url}/rest/v1/user_settings?select=*`, { headers: hdrs })).json(),
      (await fetch(`${url}/rest/v1/push_tokens?select=*`, { headers: hdrs })).json(),
    ]);

    const tokMap = new Map(pushTokens.map((t: any) => [t.user_id, t.token]));
    let sent = 0;

    for (const s of settings) {
      const deviceToken = tokMap.get(s.user_id);
      if (!deviceToken || !s.notifications_enabled) continue;

      const tz = s.timezone || "UTC";
      const today = localDate(tz);
      const time = localTime(tz);
      const currentSlot = getCurrentSlot(time);

      // ── HABIT REMINDERS (3 time-distributed slots) ──
      if (s.habit_notifications && currentSlot > 0) {
        // Reset count if it's a new day before 5 AM
        let count = s.habit_notifications_count || 0;
        if (s.last_habit_notification_date !== today) {
          count = 0;
        }

        // Only send if we haven't sent for this slot yet
        if (count < currentSlot) {
          const [habits, completions] = await Promise.all([
            (await fetch(`${url}/rest/v1/habits?select=id,name&user_id=eq.${s.user_id}&archived=eq.false&deleted_at=is.null`, { headers: hdrs })).json(),
            (await fetch(`${url}/rest/v1/habit_completions?select=habit_id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs })).json(),
          ]);

          if (habits?.length) {
            const done = new Set((completions || []).map((d: any) => d.habit_id));
            const undone = habits.filter((h: any) => !done.has(h.id));

            if (undone.length > 0) {
              // First try queue-based delivery
              const label = slotLabel(currentSlot);
              const body = undone.length === 1
                ? `Buon${label === "sera" ? "a" : " "} ${label}! Hai 1 abitudine da completare: ${undone[0].name}`
                : `Buon${label === "sera" ? "a" : " "} ${label}! Hai ${undone.length} abitudini da completare: ${undone.map((h: any) => h.name).join(", ")}`;

              let ok = await enqueueNotification(url, hdrs, s.user_id, deviceToken, "Promemoria abitudini", body, s.language);

              // Fallback: direct FCM if queue fails
              if (!ok) {
                const fcmRes = await fetch(FCM_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `key=${fcmKey}` },
                  body: JSON.stringify({
                    to: deviceToken,
                    priority: "high",
                    notification: { title: "Promemoria abitudini", body, sound: "default", priority: "high" },
                    data: { click_action: "OPEN_APP" },
                  }),
                });
                ok = fcmRes.ok;
              }

              if (ok) {
                const newCount = count + 1;
                await fetch(`${url}/rest/v1/user_settings?user_id=eq.${s.user_id}`, {
                  method: "PATCH",
                  headers: { ...hdrs, Prefer: "return=minimal" },
                  body: JSON.stringify({ last_habit_notification_date: today, habit_notifications_count: newCount }),
                });
                sent++;
              }
            }
          }
        }
      }

      // ── EVENING SUMMARY ──
      if (s.evening_summary && s.last_evening_summary_date !== today && time >= s.evening_time) {
        const queries = [
          fetch(`${url}/rest/v1/skating_sessions?select=id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs }),
          fetch(`${url}/rest/v1/habit_completions?select=id,habit_id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs }),
          fetch(`${url}/rest/v1/competitions?select=id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs }),
        ];
        if (s.coach_mode) {
          queries.push(fetch(`${url}/rest/v1/training_attendance?select=id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs }));
        }
        const [sessionsRes, hcRes, compRes, attRes] = await Promise.all(queries.map(q => q.then(r => r.json())));

        const nSessions = (sessionsRes || []).length;
        const nHabits = (hcRes || []).length;
        const nCompetitions = (compRes || []).length;
        const nAttendance = (attRes || []).length;

        const parts: string[] = [];
        if (nHabits > 0) parts.push(`${nHabits} abitudini`);
        if (nSessions > 0) parts.push(`${nSessions} sessioni di skating`);
        if (nAttendance > 0) parts.push(`${nAttendance} presenze allenamento`);
        if (nCompetitions > 0) parts.push(`${nCompetitions} gare`);

        let body = parts.length > 0
          ? `Oggi hai completato: ${parts.join(", ")}.`
          : "Nessuna attività registrata oggi.";

        const [habits, completions] = await Promise.all([
          (await fetch(`${url}/rest/v1/habits?select=id,name&user_id=eq.${s.user_id}&archived=eq.false&deleted_at=is.null`, { headers: hdrs })).json(),
          (await fetch(`${url}/rest/v1/habit_completions?select=habit_id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs })).json(),
        ]);

        if (habits?.length) {
          const doneSet = new Set((completions || []).map((d: any) => d.habit_id));
          const undone = habits.filter((h: any) => !doneSet.has(h.id));
          if (undone.length > 0) {
            body += ` Mancano ${undone.length} abitudin${undone.length > 1 ? "i" : "e"} da fare.`;
          }
        }

        let ok = await enqueueNotification(url, hdrs, s.user_id, deviceToken, "Riepilogo giornata", body, s.language);

        if (!ok) {
          const fcmRes = await fetch(FCM_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `key=${fcmKey}` },
            body: JSON.stringify({
              to: deviceToken,
              priority: "high",
              notification: { title: "Riepilogo giornata", body, sound: "default", priority: "high" },
              data: { click_action: "OPEN_APP" },
            }),
          });
          ok = fcmRes.ok;
        }

        if (ok) {
          await fetch(`${url}/rest/v1/user_settings?user_id=eq.${s.user_id}`, {
            method: "PATCH",
            headers: { ...hdrs, Prefer: "return=minimal" },
            body: JSON.stringify({
              last_evening_summary_date: today,
              last_habit_notification_date: today,
              habit_notifications_count: 3,
            }),
          });
          sent++;
        }
      }
    }

    return new Response("Sent: " + sent);
  } catch (e) {
    return new Response("Error: " + (e instanceof Error ? e.message : String(e)), { status: 500 });
  }
});
