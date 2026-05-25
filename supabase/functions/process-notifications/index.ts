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

serve(async () => {
  try {
    const url = Deno.env.get("SB_URL")!;
    const key = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
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

      if (s.habit_notifications) {
        const [habits, completions] = await Promise.all([
          (await fetch(`${url}/rest/v1/habits?select=id,name&user_id=eq.${s.user_id}&archived=eq.false&deleted_at=is.null`, { headers: hdrs })).json(),
          (await fetch(`${url}/rest/v1/habit_completions?select=habit_id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs })).json(),
        ]);
        if (habits?.length) {
          const done = new Set((completions || []).map((d: any) => d.habit_id));
          const undone = habits.filter((h: any) => !done.has(h.id));
          const canSend = s.last_habit_notification_date !== today || (s.habit_notifications_count || 0) < 3;
          if (undone.length && canSend) {
            const body = `Hai ${undone.length} abitudin${undone.length > 1 ? "i da completare" : "a da completare"}: ${undone.map((h: any) => h.name).join(", ")}`;
            const ok = await (await fetch(FCM_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `key=${fcmKey}` },
              body: JSON.stringify({
                to: deviceToken,
                notification: { title: "Promemoria abitudini 📋", body, sound: "default" },
                data: { click_action: "OPEN_APP" },
              }),
            })).ok;
            if (ok) {
              const newCount = s.last_habit_notification_date === today ? (s.habit_notifications_count || 0) + 1 : 1;
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

      if (s.evening_summary && time >= s.evening_time && s.last_evening_summary_date !== today) {
        const [sessions, hc] = await Promise.all([
          (await fetch(`${url}/rest/v1/skating_sessions?select=id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs })).json(),
          (await fetch(`${url}/rest/v1/habit_completions?select=id&user_id=eq.${s.user_id}&date=eq.${today}`, { headers: hdrs })).json(),
        ]);
        const body = `Abitudini: ${(hc || []).length} · Skating: ${(sessions || []).length} sessioni`;
        const ok = await (await fetch(FCM_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `key=${fcmKey}` },
          body: JSON.stringify({
            to: deviceToken,
            notification: { title: "Riepilogo giornata 📊", body, sound: "default" },
            data: { click_action: "OPEN_APP" },
          }),
        })).ok;
        if (ok) {
          await fetch(`${url}/rest/v1/user_settings?user_id=eq.${s.user_id}`, {
            method: "PATCH",
            headers: { ...hdrs, Prefer: "return=minimal" },
            body: JSON.stringify({ last_evening_summary_date: today }),
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
