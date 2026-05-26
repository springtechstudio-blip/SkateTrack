import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FCM_URL = "https://fcm.googleapis.com/fcm/send";

interface QueueItem {
  id: number;
  token: string;
  title: string;
  body: string;
  language: string | null;
  created_at: string;
}

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const serverKey = Deno.env.get("FCM_SERVER_KEY") ?? "";
    const hdrs = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    if (!serverKey) {
      console.error("FCM_SERVER_KEY not set");
      return new Response("FCM_SERVER_KEY not set", { status: 500 });
    }

    // Fetch up to 50 unsent items, only from last 24h to avoid stale
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${supabaseUrl}/rest/v1/notification_queue?sent_at=is.null&created_at=gte.${cutoff}&order=created_at.asc&limit=50`,
      { headers: hdrs },
    );
    if (!res.ok) {
      console.error("Failed to fetch queue:", await res.text());
      return new Response("Fetch failed", { status: 500 });
    }

    const rows: QueueItem[] = await res.json();
    if (!rows.length) return new Response("OK");

    let sent = 0;

    for (const row of rows) {
      try {
        const fcmRes = await fetch(FCM_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${serverKey}`,
          },
          body: JSON.stringify({
            to: row.token,
            priority: "high",
            notification: { title: row.title, body: row.body, sound: "default", priority: "high" },
            data: { click_action: "OPEN_APP" },
          }),
        });

        if (fcmRes.ok) {
          await fetch(`${supabaseUrl}/rest/v1/notification_queue?id=eq.${row.id}`, {
            method: "PATCH",
            headers: { ...hdrs, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ sent_at: new Date().toISOString() }),
          });
          sent++;
        } else {
          const errText = await fcmRes.text();
          // If token is invalid, mark as sent anyway to avoid retrying bad tokens
          if (fcmRes.status === 400 || fcmRes.status === 404) {
            console.error(`Invalid token for item ${row.id}: ${errText}`);
            await fetch(`${supabaseUrl}/rest/v1/notification_queue?id=eq.${row.id}`, {
              method: "PATCH",
              headers: { ...hdrs, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ sent_at: new Date().toISOString() }),
            });
          } else {
            console.error(`FCM error for item ${row.id}: ${fcmRes.status} ${errText}`);
          }
        }
      } catch (itemErr) {
        console.error(`Error processing item ${row.id}:`, itemErr);
      }
    }

    return new Response("Sent: " + sent);
  } catch (e) {
    return new Response("Error: " + (e instanceof Error ? e.message : String(e)), { status: 500 });
  }
});
