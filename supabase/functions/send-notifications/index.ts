// Supabase Edge Function: send-notifications
// Sends pending notifications from the notification_queue via Firebase Cloud Messaging (FCM)
//
// 1. Set FCM_SERVER_KEY in Supabase Dashboard > Edge Functions secrets
//    (trovabile in Firebase Console > Project Settings > Cloud Messaging)
//
// 2. Schedule this to run every minute via:
//    SELECT cron.schedule('send-notifications', '* * * * *', 'SELECT net.http_post(url:= ''https://<project>.supabase.co/functions/v1/send-notifications'', headers:= ''{"Authorization":"Bearer <anon-key>"}'' )');

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FCM_URL = "https://fcm.googleapis.com/fcm/send";
const SERVER_KEY = Deno.env.get("FCM_SERVER_KEY") ?? "";

interface QueueItem {
  id: number;
  token: string;
  title: string;
  body: string;
}

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const res = await fetch(`${supabaseUrl}/rest/v1/notification_queue?sent_at=is.null&order=created_at.asc&limit=10`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const rows: QueueItem[] = await res.json();
    if (!rows.length) return new Response("OK");

    for (const row of rows) {
      const fcmRes = await fetch(FCM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: row.token,
          notification: { title: row.title, body: row.body, sound: "default" },
          data: { click_action: "OPEN_APP" },
        }),
      });

      if (fcmRes.ok) {
        await fetch(`${supabaseUrl}/rest/v1/notification_queue?id=eq.${row.id}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sent_at: new Date().toISOString() }),
        });
      }
    }

    return new Response("Sent: " + rows.length);
  } catch (e) {
    return new Response("Error: " + (e instanceof Error ? e.message : String(e)), { status: 500 });
  }
});
