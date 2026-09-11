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

| Fil | Indhold |
| --- | --- |
| `index.html` | Event-siden. Samme DOM-struktur som Webflow-siden (minus `none`-elementer). |
| `tak.html`, `tak/index.html` | Takkesiden. Virker på både `/tak` og `/tak/`. |
| `css/webflow.css` | Beskåret Webflow-stylesheet (kun de klasser siden bruger). Styrer mobil (≤ 479 px) 1:1. **Rør ikke** – ret i `desktop.css`. |
| `css/custom.css` | Sidens egne embeds: CTA-beam, jiggle-animation, målebånd. |
| `css/desktop.css` | Alt layout for ≥ 480 px (tablet) og ≥ 992 px (desktop). Mobil er ikke berørt. |
| `js/main.js` | Modal (åbn/luk), countdown, logo-marquee, CTA-beam, målebånd, Meta Pixel. |
| `assets/` | Alle billeder (hentet fra Webflow-CDN). `og-image.png` er delebilledet. |
| `assets/yt/` | Lodrette thumbnails til interview-videoerne (YouTube Shorts). |

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

Tilmeldingsformularen er den samme eksterne agencyflow-formular (iframe) som på
Webflow-siden, så tilmeldinger lander samme sted som før.
