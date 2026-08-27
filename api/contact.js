// POST /api/contact
// Receives a website inquiry (JSON), emails it to Shine via Resend, and
// records the SMS consent (Yes/No + timestamp + IP) in the email so there's
// a durable opt-in record. Honeypot ("company" field) silently drops bots.
//
// Env vars (set in the Vercel project):
//   RESEND_KEY  (required)
//   CONTACT_TO      (optional; default shine@texasmentalist.com)
//   CONTACT_FROM    (optional; default "Shine Website <noreply@texasmentalist.com>")
//                   -- MUST be a verified Resend sender/domain.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const key = process.env.RESEND_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'Email is not configured yet. Please text or email us.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // Honeypot: real users never see/fill "company". If it's set, treat as a bot
  // and quietly succeed so the bot doesn't retry.
  if (body.company) return res.status(200).json({ ok: true });

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  if (!name || !email) return res.status(400).json({ ok: false, error: 'Name and email are required.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = new Date().toISOString();
  const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const optedIn = !!body.smsConsent;
  const consentLine = optedIn ? ('YES — opted in ' + now + ' (IP ' + ip + ')') : 'No';

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Phone', body.phone],
    ['Event type', body.eventType],
    ['Event date', body.eventDate],
    ['Guest count', body.guestCount],
    ['Venue / location', body.venue],
    ['Message', body.message],
    ['SMS consent', consentLine],
    ['Submitted', now],
    ['From page', body.pageUrl],
  ];
  const html =
    '<h2 style="font-family:Georgia,serif">New inquiry — texasmentalist.com</h2>' +
    '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
    rows.map((r) => '<tr><td style="padding:5px 14px 5px 0;color:#888;vertical-align:top;white-space:nowrap">' + esc(r[0]) + '</td><td style="padding:5px 0">' + esc(r[1] || '—') + '</td></tr>').join('') +
    '</table>';

  const to = process.env.CONTACT_TO || 'shine@texasmentalist.com';
  const from = process.env.CONTACT_FROM || 'Shine Website <noreply@texasmentalist.com>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: 'New inquiry: ' + name + (body.eventType ? ' — ' + body.eventType : ''),
        html,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('Resend error:', r.status, t);
      return res.status(502).json({ ok: false, error: 'Could not send right now. Please text or email us.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact handler error:', e);
    return res.status(500).json({ ok: false, error: 'Server error. Please text or email us.' });
  }
}
