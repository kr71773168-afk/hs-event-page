# Håndværkerskolen – event-landingpage

Statisk 1:1-kopi af `event.haandvaerkerskolen.nu` med en fungerende desktop-version.

## Filer

| Fil | Indhold |
| --- | --- |
| `index.html` | Event-siden. Samme DOM-struktur som Webflow-siden (minus `none`-elementer). |
| `tak.html` | Takkesiden (`/tak`). Ret hosting til at vise `tak.html` på `/tak`, eller ret redirect-URL'en i agencyflow-formularen. |
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

## Deployment

Upload hele mappen (index.html, css, js, assets) til hosting. Husk at rette
`og:image` i `index.html` til den endelige absolutte URL på det nye domæne.

Tilmeldingsformularen er den samme eksterne agencyflow-formular (iframe) som på
Webflow-siden, så tilmeldinger lander samme sted som før.
