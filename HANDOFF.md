# Håndværkerskolen – eventside 30. november 2026: overdragelse til Claude Code

Siden er designet og godkendt af Kristoffer. **Ret ikke tekst eller design** uden at spørge ham. Opgaven er at få den live og få formular og tracking til at virke.

## Event
- Gratis online event, **mandag 30. november 2026 kl. 19:00**, én aften, ca. 1 time, afvikles på StreamYard On-Air (man ser med i browseren).
- Linket sendes på SMS (inMobile) og mail. Tilmeldte bliver **ikke** ringet op af sælgere.
- Copy-regel fra Tobias: skriv **"virksomheder i håndværksbranchen"**, aldrig "håndværksvirksomheder".

## Filer
- `index.html`: hele siden. CSS og JS ligger i filen. Mobil først, med egne layouts fra 768 px og 1024 px.
- `tak.html`: takkesiden (`/tak`).
- `kalender.html` + `kalender.ics`: kalendersiden (`/kalender`) og kalenderfilen (`/kalender.ics`).
- `billeder/`: kun de billeder, siden bruger.
- Skrifter hentes fra Google Fonts (Barlow, Anton, Archivo). De må gerne hostes selv senere.

## Hosting
- Mål: **event.haandvaerkerskolen.nu**. Den ligger i dag i Webflow (gammel side + `/tak`).
- Anbefaling: Vercel. Statisk side plus én server-funktion. Subdomænet peges på Vercel (CNAME) og fjernes fra Webflow, når den nye side er testet.
- Den gamle side skal kunne bruges som nødløsning, indtil den nye er testet.

## 1. Formularen → GHL (vigtigst)
Alle knapper (`a[href="#tilmeld"]`) åbner en popup med vores egen formular (`#tilmeld`, script under `/* ---------- TILMELDING ---------- */`).

I `index.html` (ca. linje 993) skal du sætte:
```js
var SEND_TIL='/api/tilmeld';
var TAK_SIDE='/tak';      // i forhåndsvisningen står der 'tak.html'
```
Er `SEND_TIL` tom (som nu), sendes intet. Man kommer bare videre til takkesiden (forhåndsvisning).

Formularen sender `POST` med JSON:
```json
{ "navn": "Fornavn Efternavn", "telefon": "+4512345678", "email": "x@y.dk",
  "event_id": "hs-…", "side": "https://event…/?utm_…", "fbp": "_fbp-cookie", "fbc": "_fbc eller bygget af fbclid",
  "spor": { "utm_source": "…", "utm_medium": "…", "utm_campaign": "…", "utm_content": "…", "utm_term": "…", "fbclid": "…" } }
```
Telefon er allerede normaliseret til E.164 (+45 og 8 cifre, eller et udenlandsk nummer med +).

`/api/tilmeld` skal:
1. Validere igen på serveren (navn, telefon, mail) og afvise spam (fx honeypot eller rate limit).
2. Oprette eller opdatere kontakten i **GHL** (API v2, upsert på telefon/mail): fornavn/efternavn (split på første mellemrum), telefon, mail, tag fx `event-2026-11-30`, og UTM'erne i custom fields.
   - Token (Private Integration) ligger **kun** som env-variabel på serveren (`GHL_TOKEN`, `GHL_LOCATION_ID`). Den må aldrig komme ud i browseren eller i repoet.
   - **Tjek, hvad der starter det eksisterende GHL-workflow** (SMS/mail-flowet). Starter det på "Form submitted" for den gamle GHL-formular (`LPr6sbpNgQZiZWuERTEt`), skal triggeren laves om til "Tag added: event-2026-11-30". Ellers kommer SMS'en med linket ikke ud. Aftal det med Kristoffer, før workflowet ændres.
3. Sende **Lead** til Meta Conversions API med samme `event_id` som browseren (dedup): hashet em/ph/fn/ln, `fbp`, `fbc`, IP, user agent og `event_source_url`. Token: `META_CAPI_TOKEN`.
4. Svare 200 hurtigt. Ved fejl svares 500, så viser formularen "Noget gik galt. Prøv igen".

## 2. Tracking
- **Pixel-ID skal afklares med Kristoffer.** Den nuværende eventside kører `1853802775977454`, men hans noter siger `1475358500068619`. Brug `trackSingle` til det rigtige ID.
- Pixel base code + PageView i `<head>`. Scriptet kalder allerede `fbq('trackCustom','FormOpen')` ved første åbning af popuppen og `fbq('track','Lead',{}, {eventID})` ved succes, men kun hvis `window.fbq` findes.
- Microsoft Clarity: samme projekt som den nuværende side. Scriptet sender `form_aaben` og `tilmeldt` som Clarity-events.
- UTM'er og fbclid gemmes i sessionStorage ved første besøg og sendes med formularen.

## 3. Videoerne i cases
Sæt `var VIDEO_I_KORTET=true;` (ca. linje 1103). Så afspilles YouTube-casene i kortet (youtube-nocookie) i stedet for at åbne YouTube. Det var slået fra, fordi forhåndsvisningen ikke må indlejre andre sider.

## 4. Head/meta
Titlen er en arbejdstitel. Sæt fx:
- `<title>Gratis online event for håndværkere – 30. november | Håndværkerskolen</title>`
- meta description + Open Graph (titel, beskrivelse, billede: `billeder/hero-gavl-bred.webp`), `lang="da"` er sat.
- Favicon fra Håndværkerskolen.

## 5. Takkeside `/tak` (`tak.html`)
- Serveres på `/tak` (rewrite i Vercel), `noindex`.
- Læser `sessionStorage.hs_tak` (`fornavn`, `telefon`, `event_id`), som formularen gemmer lige før videresendelsen. Hilser med fornavn og viser nummeret i SMS-linjen.
- Opbygning: ét trin ad gangen. Statuslinje "1 af 4 klaret" (tilmeldt = trin 1). Kun det aktive trin vises; klarede trin bliver til én linje. Rækkefølge: Trin 2 kalender, Trin 3 ordrebogs-tjek (ét spørgsmål ad gangen, svar med det samme), Trin 4 Facebook-gruppen. Kalender og gruppe kan springes over. Når alt er klaret: "Du er klar til mandag" + Stefan-video (hvis `VIDEO_URL`). "Husk at være med live" står altid nederst.
- Fremskridt gemmes i `sessionStorage.hs_trin2`, så siden ikke starter forfra, hvis in-app-browseren genindlæser den. Et trin, man har sprunget over, kan åbnes igen fra linjen ("Sæt i kalenderen ›" / "Gå med ›").
- Knappen "Nulstil forhåndsvisning" vises kun, når siden ikke ligger på `haandvaerkerskolen.nu`. Ligger den på et andet domæne, så ret tjekket nederst i scriptet.
- **Kalender vælges efter enhed** (vigtigt, fordi trafikken kommer fra Meta-ads og åbner i Facebooks/Instagrams in-app-browser, hvor .ics ikke virker på iPhone):
  - iPhone i Safari: `/kalender.ics` (iPhone-kalenderen åbner direkte).
  - iPhone i Facebook/Instagram/Chrome: knappen åbner `x-safari-https://<domæne>/kalender?fra=app` (Safari, iOS 17+). Åbner Safari ikke inden 2,5 sek., vises en hjælpetekst (••• → åbn i Safari, eller kalender-linket i SMS'en).
  - Android: Google Kalender. Inde i Facebook/Instagram via `intent://…;package=com.android.chrome` (åbner i Chrome, hvor man er logget ind på Google).
  - Computer: Google / Apple-Outlook (.ics) / Outlook.com. Hver række har et ikon. Lægges `billeder/kal-google.png`, `billeder/kal-apple.png` og `billeder/kal-outlook.png` ind (kvadratiske, mindst 80 × 80 px), vises de automatisk i stedet for de indbyggede ikoner. Det gælder også `kalender.html`.
- Indstillinger øverst i scriptet:
  - `VIDEO_URL`: Stefans velkomstvideo (YouTube-embed eller .mp4). Tom = skjult.
  - `GRUPPE_URL`: Facebook-gruppen. Tom = trin 4 forsvinder (står som `'#'` i forhåndsvisningen, så sæt den eller tøm den).
  - `SPOERG_TIL`: fx `/api/tjek`. Får `POST {telefon, event_id, fag, ansatte, booket}`, når de 3 spørgsmål er besvaret. Gem på GHL-kontakten (custom fields), så SMS-bot'en kan bruge svarene. Tom = intet sendes.
  - `KALENDER_SIDE`: sæt til `'/kalender'`. `ICS_FIL`: sæt til `'/kalender.ics'`.
  - `SMS_KALENDER`: `true` = hjælpeteksten nævner kalender-linket i SMS'en. Sæt `false`, hvis bekræftelses-SMS'en ikke får linket.
- Pixel base code skal ind her. Events: `trackCustom AddToCalendar {metode}`, `OrdrebogsTjek {fag, ansatte, booket}`, `FacebookGruppe`, `TrinSprunget {trin}`, `TrinGenaabnet {trin}`, `TakkesideFaerdig`. Clarity får de samme navne som events.
- Lead fyres i formularen lige før videresendelsen. Hvis det giver tab af events, så flyt browser-Lead til takkesiden med `event_id` fra `hs_tak`. Undgå dobbelt Lead.

## 6. Kalendersiden `/kalender` (`kalender.html` + `kalender.ics`)
- `/kalender` → `kalender.html` (rewrite), `noindex`. Den vælger også efter enhed (iPhone → .ics, Android → Google, computer → 3 valg). Med `?fra=app` viser den på iPhone "Tryk på ◀ øverst til venstre for at komme tilbage".
- `/kalender.ics` skal serveres med `Content-Type: text/calendar; charset=utf-8` (sæt en header i `vercel.json`, så det ikke afhænger af standarden). Ret `ICS_FIL` i `kalender.html` til `'/kalender.ics'`.
- **Bekræftelses-SMS'en skal have linket** `https://event.haandvaerkerskolen.nu/kalender` ("Sæt det i kalenderen: …"). SMS-links åbner i telefonens rigtige browser, så kalenderen virker for alle. Det samme link må gerne i bekræftelsesmailen (evt. med .ics vedhæftet).

## Testliste før launch
- [ ] Rigtig testtilmelding: kontakt + tag i GHL, SMS fra inMobile kommer frem, mail kommer frem.
- [ ] Meta Events Manager → Test Events: Lead fra både browser og server med samme event_id (dedupliceret).
- [ ] UTM'er gemt på kontakten.
- [ ] Popup på en rigtig iPhone: tastaturet dækker ikke felterne, og siden zoomer ikke ind.
- [ ] Bredder: 320, 375, 768, 1024, 1440 px.
- [ ] Videoerne afspilles i kortene.
- [ ] Takkesiden på en rigtig iPhone **inde i Facebook og Instagram**: kalender-knappen åbner Safari, og eventet kan lægges i kalenderen. Samme på Android i Facebook.
- [ ] `/kalender.ics` åbner iPhone-kalenderen direkte i Safari.
- [ ] Hastighed: Lighthouse mobil. Heroen indlæses med `fetchpriority="high"`, resten er lazy.
