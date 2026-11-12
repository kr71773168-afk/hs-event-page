// POST /api/tjek – svarene fra ordrebogs-tjekket på takkesiden.
// Body: { telefon, event_id, fag, ansatte, booket }
// Gemmer svarene på den EKSISTERENDE GHL-kontakt (fundet på telefonnummer) i custom fields
// fag / ansatte / booket + en note, så de kan ses, selvom felterne ikke findes i GHL.
// Opretter aldrig nye kontakter. Bruger samme env-variabler som /api/tilmeld.

const GHL = 'https://services.leadconnectorhq.com';
const VALG = {
  fag: ['Tømrer', 'Murer', 'Maler', 'Elektriker', 'VVS', 'Anlæg og have', 'Andet'],
  ansatte: ['Kun mig', '2–4', '5–9', '10 eller flere'],
  booket: ['Under 2 uger', '2–6 uger', '1–3 måneder', 'Over 3 måneder'],
};

async function ghl(method, path, body) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 8000);
  try {
    const r = await fetch(GHL + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + process.env.GHL_TOKEN,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: c.signal,
    });
    const text = await r.text();
    let json = {};
    try { json = JSON.parse(text); } catch (e) {}
    return { ok: r.ok, status: r.status, json, text };
  } finally {
    clearTimeout(t);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false });

  const telefon = typeof b.telefon === 'string' ? b.telefon.trim() : '';
  if (!/^\+\d{8,15}$/.test(telefon)) return res.status(400).json({ ok: false, fejl: 'telefon' });
  const svar = {};
  for (const k of Object.keys(VALG)) {
    if (!VALG[k].includes(b[k])) return res.status(400).json({ ok: false, fejl: k });
    svar[k] = b[k];
  }
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) {
    console.error('GHL_TOKEN / GHL_LOCATION_ID mangler i Vercel');
    return res.status(500).json({ ok: false });
  }

  try {
    const q = new URLSearchParams({ locationId: process.env.GHL_LOCATION_ID, number: telefon });
    const f = await ghl('GET', '/contacts/search/duplicate?' + q.toString());
    const id = f.json && f.json.contact && f.json.contact.id;
    if (!id) { console.warn('Tjek: ingen kontakt med', telefon.slice(0, 5) + '…', f.status); return res.status(200).json({ ok: true }); }

    const cf = Object.keys(svar).map((k) => ({ key: k, field_value: svar[k] }));
    const u = await ghl('PUT', '/contacts/' + id, { customFields: cf });
    if (!u.ok) console.warn('Tjek: custom fields fejlede', u.status, u.text.slice(0, 300));

    const n = await ghl('POST', '/contacts/' + id + '/notes', {
      body: 'Ordrebogs-tjek (eventside 30. nov)\nFag: ' + svar.fag + '\nAntal: ' + svar.ansatte + '\nBooket: ' + svar.booket,
    });
    if (!n.ok) console.warn('Tjek: note fejlede', n.status, n.text.slice(0, 300));

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Tjek fejlede:', e.message);
    return res.status(500).json({ ok: false });
  }
};
