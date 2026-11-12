// POST /api/tilmeld – tilmelding til eventet 30. november 2026.
// 1) validerer  2) opretter/opdaterer kontakten i GHL + tag (starter SMS/mail-flowet)
// 3) sender Lead til Meta Conversions API med samme event_id som browseren (dedup).
//
// Env-variabler i Vercel (Settings → Environment Variables):
//   GHL_TOKEN        Private Integration token (contacts.write)
//   GHL_LOCATION_ID  sub-account / location id
//   META_CAPI_TOKEN  Conversions API access token til pixel 1853802775977454
//   META_TEST_EVENT_CODE  (valgfri) kun mens der testes i Events Manager → Test Events

const crypto = require('crypto');

const PIXEL_ID = '1853802775977454';
const TAG = 'event-2026-11-30';
const GHL = 'https://services.leadconnectorhq.com';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];

const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

async function ghl(path, body) {
  const t = withTimeout(8000);
  try {
    const r = await fetch(GHL + path, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.GHL_TOKEN,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: t.signal,
    });
    const text = await r.text();
    let json = {};
    try { json = JSON.parse(text); } catch (e) {}
    return { ok: r.ok, status: r.status, json, text };
  } finally {
    t.done();
  }
}

async function sendToGhl(p) {
  const base = {
    locationId: process.env.GHL_LOCATION_ID,
    firstName: p.fornavn,
    lastName: p.efternavn,
    name: p.navn,
    email: p.email,
    phone: p.telefon,
    source: 'Eventside 30. nov 2026',
  };
  const customFields = UTM.filter((k) => p.spor[k]).map((k) => ({ key: k, field_value: p.spor[k] }));

  // UTM'er i custom fields. Findes felterne ikke i GHL, prøver vi igen uden – kontakten må aldrig gå tabt pga. et felt.
  let r = await ghl('/contacts/upsert', customFields.length ? { ...base, customFields } : base);
  if (!r.ok && customFields.length && r.status >= 400 && r.status < 500) {
    console.warn('GHL upsert med customFields fejlede, prøver uden:', r.status, r.text.slice(0, 300));
    r = await ghl('/contacts/upsert', base);
  }
  const id = r.json && r.json.contact && r.json.contact.id;
  if (!r.ok || !id) throw new Error('GHL upsert ' + r.status + ': ' + r.text.slice(0, 300));

  // Tag tilføjes separat (upsert kan overskrive eksisterende tags). Det er "Tag added" der skal starte workflowet.
  const t = await ghl('/contacts/' + id + '/tags', { tags: [TAG] });
  if (!t.ok) throw new Error('GHL tag ' + t.status + ': ' + t.text.slice(0, 300));
  return id;
}

async function sendToMeta(p, req) {
  if (!process.env.META_CAPI_TOKEN) { console.warn('META_CAPI_TOKEN mangler – CAPI springes over'); return; }
  const ip = str(req.headers['x-forwarded-for'] || '', 100).split(',')[0].trim();
  const user_data = {
    em: [sha(p.email.toLowerCase())],
    ph: [sha(p.telefon.replace(/\D/g, ''))],
    fn: [sha(p.fornavn.toLowerCase())],
    client_user_agent: str(req.headers['user-agent'] || '', 500),
  };
  if (p.efternavn) user_data.ln = [sha(p.efternavn.toLowerCase())];
  if (ip) user_data.client_ip_address = ip;
  if (p.fbp) user_data.fbp = p.fbp;
  if (p.fbc) user_data.fbc = p.fbc;

  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: p.event_id,
      action_source: 'website',
      event_source_url: p.side || 'https://event.haandvaerkerskolen.nu/',
      user_data,
    }],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  const t = withTimeout(5000);
  try {
    const r = await fetch(
      'https://graph.facebook.com/v21.0/' + PIXEL_ID + '/events?access_token=' + encodeURIComponent(process.env.META_CAPI_TOKEN),
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: t.signal }
    );
    if (!r.ok) console.error('Meta CAPI', r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.error('Meta CAPI fejl:', e.message);
  } finally {
    t.done();
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, fejl: 'ugyldig data' });

  // Spam-fælde: feltet er usynligt for mennesker. Svar "ok" så botten ikke prøver igen.
  if (str(b.hp)) return res.status(200).json({ ok: true });

  const navn = str(b.navn, 120).replace(/\s+/g, ' ');
  const telefon = str(b.telefon, 20);
  const email = str(b.email, 160).toLowerCase();
  const event_id = str(b.event_id, 80);

  if (navn.length < 2) return res.status(400).json({ ok: false, fejl: 'navn' });
  if (!/^\+(45\d{8}|(?!45)\d{8,15})$/.test(telefon)) return res.status(400).json({ ok: false, fejl: 'telefon' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ ok: false, fejl: 'email' });
  if (/https?:\/\/|<|>/i.test(navn)) return res.status(400).json({ ok: false, fejl: 'navn' });

  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) {
    console.error('GHL_TOKEN / GHL_LOCATION_ID mangler i Vercel');
    return res.status(500).json({ ok: false });
  }

  const i = navn.indexOf(' ');
  const spor = {};
  const s = b.spor && typeof b.spor === 'object' ? b.spor : {};
  UTM.forEach((k) => { const v = str(s[k], 300); if (v) spor[k] = v; });

  const p = {
    navn, telefon, email, event_id,
    fornavn: i > 0 ? navn.slice(0, i) : navn,
    efternavn: i > 0 ? navn.slice(i + 1) : '',
    side: str(b.side, 1000),
    fbp: str(b.fbp, 200),
    fbc: str(b.fbc, 400),
    spor,
  };

  try {
    const [ghlRes] = await Promise.allSettled([sendToGhl(p), sendToMeta(p, req)]);
    if (ghlRes.status === 'rejected') throw ghlRes.reason;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Tilmelding fejlede:', e.message);
    return res.status(500).json({ ok: false });
  }
};
