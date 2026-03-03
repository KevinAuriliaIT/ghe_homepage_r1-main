/**
 * POST /api/submit
 * - FormData -> JSON
 * - Optional: Newsletter Double-Opt-In (D1 + NEWSMAILER)
 * - Interne Benachrichtigung an contact@... (MAILER)
 * - Kein KV mehr. Es wird nur eine Referenz-ID generiert.
 */
export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();

    // Cf-Turnstile validation
    const token = formData.get("cf-turnstile-response");
    const ip = request.headers.get("CF-Connecting-IP");
    let turnstileData = new FormData();
    turnstileData.append("secret", env.TS_SECRET);
    turnstileData.append("response", token);
    turnstileData.append("remoteip", ip);

    const turnstileUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const turnstileResult = await fetch(turnstileUrl, {
      body: turnstileData,
      method: "POST",
    });

    const turnstileOutcome = await turnstileResult.json();
    if (!turnstileOutcome.success) {
      return new Response(JSON.stringify({ error: "CAPTCHA verification failed." }), {
        status: 403, headers: { "content-type": "application/json;charset=utf-8" }
      });
    }

    // FormData -> JSON (Mehrfachwerte zulassen)
    const data = {};
    for (const [key, value] of formData) {
      if (data[key] === undefined) data[key] = value;
      else data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
    }

    // Referenz-ID (anstatt KV-Key)
    const ts = new Date().toISOString();
    const ref = `form_submission:${ts}:${Math.random().toString(36).slice(2, 10)}`;

    // --- Newsletter DOI (optional) ---
    const wantsNewsletter =
      data.newsletter === "on" || data.newsletter === true || data.newsletter === "true";
    const email = (data.email || "").toString().trim();

    if (wantsNewsletter && email) {
      if (!env.SUBSCRIBERS_DB) {
        return new Response(JSON.stringify({ error: "D1 binding SUBSCRIBERS_DB missing" }), {
          status: 500, headers: { "content-type": "application/json;charset=utf-8" }
        });
      }

      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // +3 Tage
      const ip = request.headers.get("cf-connecting-ip") || "";
      const ipHash = await sha256Hex(ip);
      const ua = request.headers.get("user-agent") || "";
      const first = (data.firstname || data.first_name || "").toString();
      const last  = (data.lastname  || data.last_name  || "").toString();

      const sql = `
        INSERT INTO subscribers
          (id, email, first_name, last_name, consent_ts, consent_source, consent_ip_hash, user_agent, token, token_expires_ts, confirmed_at, unsubscribed_at)
        VALUES
          (? ,   ? ,      ?     ,    ?    ,     ?     ,      ?        ,       ?         ,     ?     ,   ?  ,        ?         ,     NULL    ,     NULL       )
        ON CONFLICT(email) DO UPDATE SET
          first_name=excluded.first_name,
          last_name=excluded.last_name,
          consent_ts=excluded.consent_ts,
          consent_source=excluded.consent_source,
          consent_ip_hash=excluded.consent_ip_hash,
          user_agent=excluded.user_agent,
          token=excluded.token,
          token_expires_ts=excluded.token_expires_ts,
          unsubscribed_at=NULL
      `;
      const id = crypto.randomUUID();
      await env.SUBSCRIBERS_DB.prepare(sql).bind(
        id, email, first, last, ts, "homepage_form", ipHash, ua, token, expires.toISOString()
      ).run();

      const origin = new URL(request.url).origin;
      const confirmUrl = `${origin}/newsletter/confirm?token=${encodeURIComponent(token)}`;

      if (!env.NEWSMAILER) {
        return new Response(JSON.stringify({ error: "Service binding NEWSMAILER missing" }), {
          status: 500, headers: { "content-type": "application/json;charset=utf-8" }
        });
      }

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px">
          <h2 style="margin:0 0 12px 0">Bitte bestätige dein Newsletter-Abonnement</h2>
          <p>Hallo ${escapeHtml(first || "")} ${escapeHtml(last || "")},</p>
          <p>bitte bestätige deine Anmeldung für den Newsletter von GreenHOMEnergy:</p>
          <p>
            <a href="${confirmUrl}" style="display:inline-block;padding:10px 14px;background:#065f46;color:#fff;text-decoration:none;border-radius:6px">
              Anmeldung bestätigen
            </a>
          </p>
          <p style="font-size:12px;color:#666;margin-top:20px">
            Link gültig bis ${expires.toISOString()} (UTC). Wenn du dich nicht angemeldet hast, ignoriere diese Nachricht.
          </p>
        </div>`;
      const text = `Bitte bestätige dein Newsletter-Abo:\n${confirmUrl}\nGültig bis ${expires.toISOString()} (UTC)`;

      await env.NEWSMAILER.fetch("https://internal/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Bitte bestätige dein Newsletter-Abonnement",
          html, text
        })
      });
    }

    // --- Interne Benachrichtigung (ohne KV; Referenz-ID im Betreff) ---
    if (!env.MAILER) {
      return new Response(JSON.stringify({ error: "Service binding MAILER missing" }), {
        status: 500, headers: { "content-type": "application/json;charset=utf-8" }
      });
    }

    await env.MAILER.fetch("https://internal/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: ref, // Referenz-ID
        data          // wird im Mailer als HTML gerendert (Key -> Überschrift, Value darunter)
      })
    });

    return new Response(JSON.stringify({ message: "OK", ref }), {
      headers: { "content-type": "application/json;charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Internal server error: ${err.message}` }), {
      status: 500, headers: { "content-type": "application/json;charset=utf-8" }
    });
  }
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
}
