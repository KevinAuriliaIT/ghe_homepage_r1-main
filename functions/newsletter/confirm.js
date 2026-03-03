/**
 * GET /newsletter/confirm?token=...
 * - 1-Klick-Bestätigung (idempotent)
 * - zeigt immer eine Erfolgsseite (auch wenn ein Link-Scanner schon bestätigt hat)
 * - blendet einen dezenten grauen "Abmelden"-Button ein, der zu /newsletter/unsubscribe führt
 *   (mit signiertem Link, falls UNSUB_SECRET gesetzt ist)
 */

export async function onRequestGet({ request, env }) {
  if (!env.SUBSCRIBERS_DB) return html(500, "DB-Binding fehlt.");

  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();
  if (!token) return html(400, "Ungültige Anfrage.");

  // Token nachschlagen (wir löschen Token NICHT mehr, damit idempotent bleibt)
  const row = await env.SUBSCRIBERS_DB
    .prepare("SELECT email, token_expires_ts, confirmed_at FROM subscribers WHERE token = ?")
    .bind(token)
    .first();

  // Falls der Link-Scanner den Token schon verwendet hat (oder es ein alter Link ist):
  // -> freundliche Erfolgsseite anzeigen (kein Fehler).
  if (!row) {
    return html(200, successPage(null, null, true));
  }

  const email = row.email;
  const nowIso = new Date().toISOString();

  // Wenn noch nicht bestätigt: jetzt bestätigen.
  if (!row.confirmed_at) {
    const exp = Date.parse(row.token_expires_ts || "");
    if (isFinite(exp) && Date.now() > exp) {
      // Optional: statt Fehler könntest du hier trotzdem bestätigen.
      return html(410, "Token abgelaufen. Bitte registriere dich erneut.");
    }

    // confirm + Token als "benutzt" markieren (Ablauf in der Vergangenheit)
    await env.SUBSCRIBERS_DB
      .prepare("UPDATE subscribers SET confirmed_at = COALESCE(confirmed_at, ?), token_expires_ts = ? WHERE token = ?")
      .bind(nowIso, new Date(Date.now() - 60 * 1000).toISOString(), token)
      .run();
  }

  // Signierten Unsubscribe-Link erzeugen (wenn Secret vorhanden)
  let sig = null;
  if (env.UNSUB_SECRET) {
    sig = await signEmail(email, env.UNSUB_SECRET);
  }

  return html(200, successPage(email, sig, false));
}

/* ---------------- helpers ---------------- */

function html(status, content) {
  const body =
    typeof content === "string" && content.startsWith("<!doctype")
      ? content
      : `<!doctype html><html><head><meta charset="utf-8"><title>Newsletter</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px">
  <h2>${content}</h2>
  <p><a href="/">Zur Startseite</a></p>
</body></html>`;
  return new Response(body, {
    status,
    headers: { "content-type": "text/html;charset=utf-8" }
  });
}

function successPage(email, sig, already) {
  // grauer Abmelden-Button nur, wenn wir die E-Mail kennen
  const unsubHref =
    email && sig
      ? `/newsletter/unsubscribe?email=${encodeURIComponent(email)}&sig=${encodeURIComponent(sig)}`
      : email
      ? `/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
      : null;

  const msg = already
    ? "Alles klar – deine Anmeldung ist bereits bestätigt."
    : "Danke! Deine Anmeldung wurde bestätigt.";

  const unsubBtn = unsubHref
    ? `<a href="${unsubHref}"
         style="display:inline-block;margin-top:16px;padding:10px 14px;background:#e5e7eb;color:#111;
                text-decoration:none;border-radius:6px;border:1px solid #d1d5db;">
         Abmelden
       </a>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Bestätigt</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px">
  <h2>${msg}</h2>
  <p>Du kannst den Newsletter jederzeit abbestellen.</p>
  ${unsubBtn}
  <p style="margin-top:24px"><a href="/">Zur Startseite</a></p>
</body></html>`;
}

// HMAC(email) → base64url
async function signEmail(email, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(email)));
  return base64url(new Uint8Array(sig));
}

function base64url(u8) {
  let s = btoa(String.fromCharCode(...u8));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
