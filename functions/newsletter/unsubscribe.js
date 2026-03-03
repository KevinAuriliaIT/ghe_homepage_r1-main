/**
 * GET  /newsletter/unsubscribe?email=...&sig=...   -> zeigt rote Bestätigen-Schaltfläche (POST)
 * GET  /newsletter/unsubscribe?email=...           -> optional: sendet Abmelde-Link per E-Mail (falls keine sig)
 * POST /newsletter/unsubscribe                     -> führt Abmeldung durch (mit email+sig)
 *
 * Sicherheit:
 * - Bevorzugt signierten Link (email + sig = HMAC(email, UNSUB_SECRET)).
 * - Ohne sig wird NICHT sofort abgemeldet; stattdessen wird ein Abmelde-Link an die Adresse gemailt (Double Opt-Out).
 */

export async function onRequest({ request, env }) {
  if (!env.SUBSCRIBERS_DB) return html(500, "DB-Binding fehlt.");

  if (request.method === "GET") {
    const url = new URL(request.url);
    const email = (url.searchParams.get("email") || "").trim();
    const sig   = url.searchParams.get("sig") || "";

    if (!email) return html(400, "E-Mail fehlt.");

    // signierter Link vorhanden → Seite mit rotem Button (POST)
    if (sig && env.UNSUB_SECRET) {
      const ok = await verifyEmailSig(email, sig, env.UNSUB_SECRET);
      if (!ok) return html(400, "Ungültige Signatur.");
      return html(200, confirmPage(email, sig));
    }

    // kein sig → optionaler Flow: Abmelde-Link per E-Mail senden
    // (Verhindert missbräuchliches Abmelden Dritter nur mit E-Mail)
    if (!env.NEWSMAILER || !env.UNSUB_SECRET) {
      return html(400, "Direkte Abmeldung ohne Signatur ist deaktiviert.");
    }

    const origin = new URL(request.url).origin;
    const linkSig = await signEmail(email, env.UNSUB_SECRET);
    const unsubUrl = `${origin}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&sig=${encodeURIComponent(linkSig)}`;

    const htmlBody = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px">
        <h2>Newsletter abbestellen</h2>
        <p>Wenn du den Newsletter nicht mehr erhalten möchtest, klicke hier:</p>
        <p>
          <a href="${unsubUrl}" style="display:inline-block;padding:10px 14px;background:#991b1b;color:#fff;text-decoration:none;border-radius:6px">
            Abmeldung bestätigen
          </a>
        </p>
      </div>`;
    const textBody = `Newsletter abbestellen:\n${unsubUrl}`;

    await env.NEWSMAILER.fetch("https://internal/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Abmeldung vom Newsletter bestätigen",
        html: htmlBody,
        text: textBody
      })
    });

    return html(200, "Wir haben dir einen Abmelde-Link gesendet.");
  }

  if (request.method === "POST") {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("application/x-www-form-urlencoded")) {
      return html(415, "Falsches Format.");
    }
    const form = await request.formData();
    const email = (form.get("email") || "").toString().trim();
    const sig   = (form.get("sig") || "").toString();

    if (!email || !sig || !env.UNSUB_SECRET) return html(400, "Ungültige Anfrage.");

    const ok = await verifyEmailSig(email, sig, env.UNSUB_SECRET);
    if (!ok) return html(400, "Ungültige Signatur.");

    // Abmelden
    await env.SUBSCRIBERS_DB
      .prepare("UPDATE subscribers SET unsubscribed_at = ?, confirmed_at = confirmed_at WHERE email = ?")
      .bind(new Date().toISOString(), email)
      .run();

    return html(200, "Du wurdest erfolgreich abgemeldet.");
  }

  return html(405, "Methode nicht erlaubt.");
}

/* ---------- Helpers ---------- */

function html(status, content) {
  const body = typeof content === "string" && content.startsWith("<!doctype")
    ? content
    : `<!doctype html><html><head><meta charset="utf-8"><title>Newsletter</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px">
  <h2>${content}</h2>
  <p><a href="/">Zur Startseite</a></p>
</body></html>`;
  return new Response(body, { status, headers: { "content-type": "text/html;charset=utf-8" } });
}

function confirmPage(email, sig) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Abmelden</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px">
  <h2>Newsletter abbestellen</h2>
  <p>Bitte bestätige die Abmeldung.</p>
  <form method="POST" action="/newsletter/unsubscribe" style="margin-top:16px">
    <input type="hidden" name="email" value="${escapeHtml(email)}">
    <input type="hidden" name="sig" value="${escapeHtml(sig)}">
    <button type="submit" style="padding:10px 14px;background:#b91c1c;color:#fff;border:none;border-radius:6px;cursor:pointer">
      Abmeldung bestätigen
    </button>
  </form>
  <p style="margin-top:24px"><a href="/">Zur Startseite</a></p>
</body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
}
async function signEmail(email, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(email)));
  return base64url(new Uint8Array(sig));
}
async function verifyEmailSig(email, sig, secret) {
  const expect = await signEmail(email, secret);
  return timingSafeEqual(expect, sig);
}
function base64url(u8) {
  let s = btoa(String.fromCharCode(...u8));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function timingSafeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}
