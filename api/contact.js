// POST /api/contact
// Website contact form handler. PRIMARY: forwards the inquiry to the booking
// app's webform endpoint so it lands as a lead on the dashboard (and the booking
// app emails Shine) -- exactly what the old Wix form did. SMS consent + venue
// are folded into the lead's message so they're recorded. FALLBACK: if the
// booking app is unreachable, email Shine directly via Resend so no lead is
// ever lost. Honeypot ("company" field) silently drops bots.
//
// Env (all optional):
//   BOOKING_WEBFORM_URL  default https://shine-booking.vercel.app/api/intake
//   WEBFORM_SECRET       sent as x-webform-secret only if the booking app requires it
//   RESEND_KEY           fallback email
//   CONTACT_TO           fallback recipient (default shine@texasmentalist.com)
//   CONTACT_FROM         fallback sender (default "Shine Website <noreply@texasmentalist.com>")

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // Honeypot: real users never fill "company". If set, quietly succeed (bot).
  if (body.company) return res.status(200).json({ ok: true });

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  if (!name || !email) return res.status(400).json({ ok: false, error: 'Name and email are required.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = new Date().toISOString();
  const optedIn = !!body.smsConsent;
  const venue = String(body.venue || '').trim();
  const userMsg = String(body.message || '').trim();
  const consentLine = optedIn ? `[SMS consent: YES — opted in ${now}, IP ${ip}]` : '[SMS consent: no]';
  const message = [userMsg, venue ? `Venue/location: ${venue}` : '', consentLine].filter(Boolean).join('\n');

  // ── PRIMARY: create a lead on the booking dashboard ──────────────────────
  const bookingUrl = process.env.BOOKING_WEBFORM_URL || 'https://shine-booking.vercel.app/api/intake';
  const hdrs = { 'Content-Type': 'application/json' };
  if (process.env.WEBFORM_SECRET) hdrs['x-webform-secret'] = process.env.WEBFORM_SECRET;
  const lead = {
    action: 'webform',
    name, email,
    phone: String(body.phone || '').trim(),
    eventType: String(body.eventType || '').trim(),
    guests: String(body.guestCount || '').trim(),
    eventDate: String(body.eventDate || '').trim(),
    message,
  };
  try {
    const r = await fetch(bookingUrl, { method: 'POST', headers: hdrs, body: JSON.stringify(lead) });
    if (r.ok) return res.status(200).json({ ok: true });
    console.error('booking webform non-200:', r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.error('booking webform error:', e.message);
  }

  // ── FALLBACK: email Shine directly so the lead is never lost ─────────────
  const key = process.env.RESEND_KEY;
  if (!key) return res.status(502).json({ ok: false, error: 'Could not submit right now. Please text or email us.' });
  const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const rows = [
    ['Name', name], ['Email', email], ['Phone', body.phone], ['Event type', body.eventType],
    ['Event date', body.eventDate], ['Guest count', body.guestCount], ['Venue', venue],
    ['Message', userMsg], ['SMS consent', optedIn ? `YES (${now}, IP ${ip})` : 'no'], ['Submitted', now],
  ];
  const html =
    '<h2 style="font-family:Georgia,serif">New inquiry (fallback) — texasmentalist.com</h2>' +
    '<p style="color:#b00;font-family:Arial,sans-serif;font-size:13px">Note: the booking-app dashboard sync failed for this submission — you may need to add it to the dashboard manually.</p>' +
    '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
    rows.map((r) => '<tr><td style="padding:5px 14px 5px 0;color:#888;vertical-align:top;white-space:nowrap">' + esc(r[0]) + '</td><td style="padding:5px 0">' + esc(r[1] || '—') + '</td></tr>').join('') +
    '</table>';
  try {
    const er = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Shine Website <noreply@texasmentalist.com>',
        to: [process.env.CONTACT_TO || 'shine@texasmentalist.com'],
        reply_to: email,
        subject: 'New inquiry (dashboard sync failed): ' + name,
        html,
      }),
    });
    if (!er.ok) { console.error('fallback resend failed:', er.status, await er.text()); return res.status(502).json({ ok: false, error: 'Could not submit right now. Please text or email us.' }); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('fallback resend error:', e);
    return res.status(500).json({ ok: false, error: 'Server error. Please text or email us.' });
  }
}
