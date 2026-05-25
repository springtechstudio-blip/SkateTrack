import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT } from "npm:jose@5.9.6";

async function getAccessToken(): Promise<string> {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "";
  const sa = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(await crypto.subtle.importKey(
      "pkcs8",
      pemToBuffer(sa.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    ));

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  return data.access_token as string;
}

function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [\w\s]+-----/, "")
    .replace(/-----END [\w\s]+-----/, "")
    .replace(/\s/g, "");
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return bin.buffer;
}

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const raw = Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "";
    if (!raw) return new Response("Missing FCM_SERVICE_ACCOUNT", { status: 500 });
    const projectId = JSON.parse(raw).project_id;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/notification_queue?sent_at=is.null&order=created_at.asc&limit=10`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    const rows = await res.json();
    if (!rows?.length) return new Response("OK");

    const token = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    for (const row of rows) {
      const fcmRes = await fetch(fcmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
          body: JSON.stringify({
            message: {
              token: row.token,
              notification: { title: row.title, body: row.body },
              android: { notification: { sound: "default", channelId: "default_channel", smallIcon: "ic_notification" } },
            },
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
