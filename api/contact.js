// ──────────────────────────────────────────────────────────────
// POST /api/contact — sends the contact form to email via Resend.
// Zero dependencies: talks to the Resend REST API directly.
//
// Setup (one-time, in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   — your Resend API key (https://resend.com/api-keys)
//   CONTACT_TO       — (optional) destination inbox; defaults below
//   CONTACT_FROM     — (optional) verified sender; defaults to Resend's
//                      shared onboarding sender, which can only deliver to
//                      the Resend account owner's address. Verify a domain
//                      for production: https://resend.com/domains
// ──────────────────────────────────────────────────────────────

const TO_EMAIL = process.env.CONTACT_TO || 'contact@syedsaadurrahman.in';
const FROM_EMAIL = process.env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>';

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  // Vercel parses JSON bodies automatically; guard for raw strings too.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { name = '', email = '', message = '', company = '' } = body || {};

  // Honeypot — silently accept to avoid tipping off bots.
  if (company && String(company).trim()) {
    return res.status(200).json({ ok: true });
  }

  const nm = String(name).trim();
  const em = String(email).trim();
  const msg = String(message).trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nm || !em || !msg) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are all required.' });
  }
  if (!emailRe.test(em) || em.length > 120) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid email address.' });
  }
  if (nm.length > 80 || msg.length > 2000) {
    return res.status(400).json({ ok: false, error: 'That message is a little too long.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: 'Email isn’t configured yet. Please reach me directly via email.',
    });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: em,
        subject: `Portfolio enquiry from ${nm}`,
        text: `Name: ${nm}\nEmail: ${em}\n\n${msg}`,
        html:
          `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#111">` +
          `<h2 style="margin:0 0 12px">New portfolio enquiry</h2>` +
          `<p style="margin:0 0 4px"><strong>Name:</strong> ${escapeHtml(nm)}</p>` +
          `<p style="margin:0 0 12px"><strong>Email:</strong> ${escapeHtml(em)}</p>` +
          `<p style="margin:0;white-space:pre-wrap">${escapeHtml(msg)}</p>` +
          `</div>`,
      }),
    });

    if (!r.ok) {
      let detail = '';
      try { detail = (await r.json())?.message || ''; } catch { /* ignore */ }
      console.error('Resend error', r.status, detail);
      return res.status(502).json({ ok: false, error: 'Couldn’t send your message right now. Please try again or email me directly.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact handler error', err);
    return res.status(500).json({ ok: false, error: 'Unexpected error. Please email me directly.' });
  }
};
