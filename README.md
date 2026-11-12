# Håndværkerskolen – event-landingpage

Statisk 1:1-kopi af `event.haandvaerkerskolen.nu` med en fungerende desktop-version.

**Live:** https://event.haandvaerkerskolen.nu (takkeside: `/tak`)

Siden hostes på Vercel i teamet TFCX, projektet `hs-event-page`.
Koden ligger i GitHub-repositoriet `kr71773168-afk/hs-event-page`.

DNS ligger hos Simply.com:

| Type | Navn | Værdi |
| --- | --- | --- |
| CNAME | `event` | `3ba52bda495cdd63.vercel-dns-017.com` |
| TXT | `_vercel` | Vercels verifikationskode for `event.haandvaerkerskolen.nu` |

GitHub Pages er stadig slået til med samme domæne, så gamle
`kr71773168-afk.github.io/hs-event-page/`-links sender videre til det rigtige domæne.

## Filer

| Sti | Fil | Indhold |
| --- | --- | --- |
| `/` | `index.html` | Eventsiden til 30. november 2026. CSS og JS ligger i filen. |
| `/tak` | `tak.html` | Takkesiden til 30. nov: trin for trin (kalender → ordrebogs-tjek → Facebook-gruppe). |
| `/kalender` | `kalender.html` | Kalendersiden (linket til bekræftelses-SMS'en). Vælger kalender efter enhed. |
| `/kalender.ics` | `kalender.ics` | Kalenderfilen (serveres som `text/calendar`). |
| `/api/tjek` | `api/tjek.js` | Svarene fra ordrebogs-tjekket → custom fields `fag`/`ansatte`/`booket` + note på GHL-kontakten. |
| – | `billeder/` | Billeder til den nye side. |
| `/api/tilmeld` | `api/tilmeld.js` | Serverfunktion: formular → GHL (upsert + tag `event-2026-11-30`) og Lead → Meta CAPI. |
| `/okt` | `okt/index.html` | Den gamle eventside (2.–3. nov). Agencyflow-formularen ligger stadig her. Nødløsning. |
| `/tak-okt` | `tak-okt.html` | Den gamle takkeside. |
| – | `okt/css`, `okt/js`, `okt/assets` | Den gamle sides filer. Stierne er absolutte (`/okt/...`). |
| – | `HANDOFF.md` | Overdragelsesnoter til den nye side (kommer ikke med på den offentlige side). |

`vercel.json` slår `cleanUrls` til, så `tak.html` ligger på `/tak` osv.

## Env-variabler i Vercel (kræves af `/api/tilmeld`)

| Navn | Indhold |
| --- | --- |
| `GHL_TOKEN` | GHL Private Integration token (contacts read/write) |
| `GHL_LOCATION_ID` | Location ID for sub-accountet |
| `META_CAPI_TOKEN` | Conversions API token til pixel `1853802775977454` |
| `META_TEST_EVENT_CODE` | Valgfri. Kun mens der testes i Events Manager |

Mangler GHL-variablerne, svarer funktionen 500, og formularen viser "Noget gik galt".

## Interview-videoer

Videostriben under anmeldelserne er en vandret scroll-række af YouTube Shorts.
Thumbnails ligger lokalt, og YouTube-afspilleren indlæses først når man klikker
(hurtig side, ingen YouTube-cookies før klik).

Tilføj en video ved at kopiere et `video-item` i `index.html`, sætte `data-yt`
til video-id'et (delen efter `/shorts/`) og hente thumbnail'et:

```bash
curl -sL "https://i.ytimg.com/vi/VIDEO_ID/oar2.jpg" -o assets/yt/VIDEO_ID.jpg
```

## Sådan ser du siden

Åbn `index.html` direkte i en browser, eller kør en lokal server:

```bash
python3 -m http.server 8000
```

og gå til `http://localhost:8000`.

## Udgivelse

Commit og push til `main`, og udgiv derefter til Vercel fra mappen:

```bash
npx vercel --scope tfcx deploy --prod --yes
```

`.vercelignore` holder README, `CNAME` og andre repo-filer ude af den offentlige side.

Den nye side bruger sin egen formular, der poster til `/api/tilmeld`. Den gamle side på `/okt`
bruger stadig agencyflow-formularen (iframe). Dens videresendelse er sat op i GHL.
