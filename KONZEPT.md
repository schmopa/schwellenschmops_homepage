# Homepage Konzept — Referenz: scyence.cc
*Analyse vom 24.04.2026 · Step-by-step Bauplan*

---

## 1. Design-Analyse der Referenz

### Farbschema
| Rolle | Wert |
|-------|------|
| Hintergrund | `#ffffff` (weiß) |
| Text | `#000000` (schwarz) |
| Akzent / CTA | **Neongelb** `#f0ff00` ca. |
| Hero-Overlay | Schwarz/transparent |
| Blog-Cards | Schwarzer Hintergrund |

### Typografie
| Einsatz | Font | Eigenschaft |
|---------|------|-------------|
| Headlines | `Thunder SemiBold LC` (condensed Display) | UPPERCASE, sehr groß |
| Body / Nav | `Pragmatica` (grotesque) | Normal weight |
| Hero-Headline | ~112 px | Rechts ausgerichtet |
| Section-Titles | ~48–50 px | Uppercase |

**Kern-Ästhetik:** Schwarz/Weiß + ein einziger greller Akzent. Athletisch, kompromisslos, klar.

### Seitenstruktur (von oben nach unten)

```
┌─────────────────────────────────────────────────┐
│  HEADER (transparent, weiße Schrift)            │
│  Logo links · Nav rechts · User-Icon            │
├─────────────────────────────────────────────────┤
│  HERO (100vh, B&W Foto)                         │
│  Große Headline rechts-unten · Social Icons     │
│  Scroll-Indikator                               │
├─────────────────────────────────────────────────┤
│  ÜBER UNS / MISSION (2-spaltig)                 │
│  Bild links · Text + Mission rechts             │
├─────────────────────────────────────────────────┤
│  LEISTUNGEN (2×2 Grid, Foto-Karten)             │
│  Jede Karte: Hintergrundfoto, Titel, Text, CTA  │
├─────────────────────────────────────────────────┤
│  CTA-BANNER (Akzentfarbe)                       │
│  Kurzer Text · Button                           │
├─────────────────────────────────────────────────┤
│  BLOG (3-spaltig, dunkle Karten)                │
│  Titel · Datum · Mehr-dazu-Button               │
├─────────────────────────────────────────────────┤
│  FOOTER (minimal)                               │
│  Logo · Rechtliches · Social Icons              │
└─────────────────────────────────────────────────┘
```

### Interaktion & Details
- Nav wird beim Scrollen ggf. dunkler (sticky)
- Karten: Hover-Effekte (Scale / Overlay)
- CTA-Buttons: Akzentfarbe, fett, uppercase
- Social Icons: Spotify, Instagram, YouTube (Hero + Footer)
- Scroll-Indikator im Hero

---

## 2. Tech-Stack Empfehlung

**Option A — Statisches HTML/CSS/JS** (empfohlen zum Start)
- Keine Build-Tools, keine Dependencies
- Maximale Kontrolle über das Design
- Einfach hostbar (Netlify, Vercel, eigener Server)

**Option B — Next.js + Tailwind** (wenn Blog/CMS später nötig)
- Komponentenstruktur, einfach erweiterbar
- Headless CMS (z.B. Contentful, Sanity) andockbar

**Wir starten mit Option A** und können jederzeit migrieren.

---

## 3. Bau-Phasen (Step by Step)

### Phase 1 — Fundament
- [ ] Ordnerstruktur anlegen (`/css`, `/js`, `/images`, `/fonts`)
- [ ] Fonts einbinden (Google Fonts Alternativen oder eigene)
- [ ] CSS-Variablen & Reset definieren
- [ ] Basis-HTML-Skelett

### Phase 2 — Header & Navigation
- [ ] Logo + Nav-Links
- [ ] Transparenter Header über Hero
- [ ] Mobile Hamburger-Menü

### Phase 3 — Hero Section
- [ ] Vollbild-Hintergrundbild (B&W oder Akzentfarbe)
- [ ] Große Headline (rechts/unten)
- [ ] Social-Icons (links, vertikal)
- [ ] Scroll-Indikator

### Phase 4 — Über uns / Mission
- [ ] 2-Spalten-Layout (Bild + Text)
- [ ] Mission-Statement

### Phase 5 — Leistungen
- [ ] 2×2 Karten-Grid
- [ ] Jede Karte: Foto-Hintergrund, Gradient-Overlay, Text, CTA

### Phase 6 — CTA-Banner
- [ ] Akzentfarbener Hintergrund
- [ ] Text + Button

### Phase 7 — Blog-Sektion
- [ ] 3-spaltige Karten
- [ ] Dunkles Design

### Phase 8 — Footer
- [ ] Logo, rechtliche Links, Socials

### Phase 9 — Polish & Animationen
- [x] Fade-in beim Scrollen (mit Progressive-Enhancement-Fallback,
      siehe §8, 2026-09-07)
- [x] Hover-States (Service-Cards, Buttons, Nav-Links)
- [x] Mobile Responsiveness (durchgetestet inkl. zweier Mobile-Bugfixes,
      siehe §8, 2026-09-07)
- [x] Performance-Optimierung (Bildkomprimierung, siehe §8, 2026-09-07)

---

## 4. Deine Inhalte — so gibst du sie vor

Kopiere die Datei **`CONTENT.md`** (wird separat angelegt) und fülle alle Felder aus.
Ich lese diese Datei vor jedem Build-Schritt — du musst nichts erfinden und ich erfinde nichts.

### Was du vorbereiten solltest:

#### Pflicht-Inhalte
| Bereich | Was du brauchst |
|---------|----------------|
| Logo | SVG-Datei oder Text-Logo |
| Hero-Bild | 1 hochauflösendes Foto (1920×1080+), querformat |
| Hero-Headline | 2–4 Wörter, dein Claim |
| Tagline | 1 kurzer Satz unter dem Hero |
| Über-mich-Bild | Portrait oder Action-Shot |
| Über-mich-Text | 2–4 Sätze wer du bist |
| Mission | 2–4 Sätze was du anbietest |
| Leistungen | 2–4 Karten: Titel + Beschreibung + Foto + Link |
| CTA-Text | 1 Satz + Button-Label |
| Social Links | Instagram / YouTube / etc. |
| Footer-Links | Impressum, Datenschutz (URLs oder Texte) |

#### Optional
| Bereich | Was du brauchst |
|---------|----------------|
| Blog-Beiträge | Titel + Datum + URL (max. 6–9 Stück) |
| Akzentfarbe | Deine Wunschfarbe (oder wir wählen gemeinsam) |
| Primärfont | Wenn du eine spezifische Schrift möchtest |
| Favicon | Kleines Logo (32×32 oder SVG) |

---

## 5. Format für Content-Übergabe

**Empfohlen: `CONTENT.md` im Projektordner ausfüllen.**

Du kannst mir Inhalte auch direkt im Chat nennen — z.B.:
> "Mein Hero-Text ist: TRAIN SMART, RACE HARD"
> "Meine Leistungen sind: Personal Coaching, Online-Kurse, Bike-Fitting"

Bilder lädst du direkt in den Ordner `/images` und sagst mir den Dateinamen.

---

## 6. Nächster Schritt

**Jetzt:** Lies die Fragen in `CONTENT.md` durch und fülle so viel aus wie möglich.
Dann starten wir mit **Phase 1** (Fundament + Fonts) und bauen Schritt für Schritt zusammen.

---

## 7. Feature: Critical-Power-/Critical-Speed-Rechner

*Konzept abgestimmt am 07.09.2026 — Beta, Umsetzung noch offen.*

### Ziel & Zielgruppe

Öffentliches Lead-Tool für Website-Besucher. Ergänzt die bestehende
"Critical-Power-Test"-Karte auf `diagnostik.html`, die das Prinzip zwar schon
erklärt, aber bisher kein echtes Tool dazu anbietet. **Beta-Version:** kein
Name, keine E-Mail-Abfrage — Ergebnisse werden sofort angezeigt, der
Lead-Funnel läuft nur über den CTA am Ende (Kontakt/Diagnostik-Angebot).

### Rechenmodell — Basis: Pauls Excel `CriticalPower_Schmollmüller.xlsx`

Aus der bestehenden Bike-Tabelle extrahiert:

- Erhebung: 4 All-out-Efforts (10s / 2min / 5min / 12min) — aber nur
  **2/5/12min** gehen in die Regression ein. Der 10s-Wert dient separat als
  Sprint-/MPO-Kennzahl.
- Lineare Regression Leistung (P) gegen 1/Zeit über die 3 Punkte:
  - `W' = SLOPE(P-Werte, 1/t-Werte)` — in Joule (Monod/Scherrer-Modell)
  - `CP = INTERCEPT(P-Werte, 1/t-Werte)` — in Watt
- `MAP = CP + W'/300`
- `VO2max = ((10.8 × MAP / Gewicht) + 7) × [0.96 … 1.04]` (Bandbreite)
- Trainingszonen als %CP (Easy → LIT → Fatmax → Übergang → Sweetspot → CP →
  VO2max kurz/mittel/lang) mit festen Multiplikatoren (0.4955 – 1.45)
- Leistungs-Dauer-Tabelle: `P(t) = CP + W'/t` für beliebige Dauern

### Sportartspezifische Anpassung

| Sport | Eingaben | Modell |
|---|---|---|
| Bike | Gewicht, 10s/2min/5min/12min (Zeit + Watt) | 1:1 wie Excel |
| Row  | Gewicht, 10s/2min/5min/12min (Zeit + Watt) | identisch zu Bike (Concept2 & Co. liefern Watt) |
| Run  | Sprint optional, 1km, 3km (Zeit + Distanz) | **Critical Speed** statt Critical Power: `Distanz = CS·t + D'`, Regression von Speed gegen 1/t über 1km/3km → `D' = SLOPE(...)` (Meter), `CS = INTERCEPT(...)` (m/s). Sprint = separate Kennzahl, geht nicht in die Regression ein. Zonen als %CS, Ausgabe in Pace (min/km). MAP/VO2max entfällt für Run in v1 — mögliche v2-Erweiterung über Running-Economy-Schätzformel. |

Alter/Geschlecht werden im Excel erfasst, aber in keiner Formel verwendet
(nur Metadaten) — für v1 daher verzichtbar.

### Umfang v1

- Rechner + Zonentabelle. **Kein** Leistungs-Dauer-Chart, **keine**
  automatisch abgeleiteten Intervallformen (beides mögliche v2-Erweiterungen).
- Reine Client-Side-Berechnung (JS), kein Backend, keine Datenspeicherung —
  passt zum bestehenden statischen HTML/CSS/JS-Stack.

### Seitenstruktur

- Neue eigenständige Unterseite, z.B. `cp-rechner.html`.
- Verlinkung: CTA-Button auf der "Critical-Power-Test"-Karte in
  `diagnostik.html`, z.B. "JETZT BERECHNEN".
- Nicht in der Hauptnavigation (bleibt schlank) — Zugang über die
  Diagnostik-Seite.
- Sportart-Auswahl (Tabs: Bike / Run / Row / Ski, in dieser Reihenfolge) steuert
  Eingabeform und Modell. Row/Ski nutzen dasselbe Watt-Modell wie Bike.
- Design konsistent zum Rest der Seite (Bebas Neue / Barlow, Schwarz/Weiß +
  Neongelb-Akzent `#f0ff00`).

### Bau-Phasen (Step by Step)

- [x] Eingabeformular pro Sportart (Zeit + Leistung/Distanz, Gewicht)
- [x] JS-Rechenkern (Regression identisch zu Excel-Formeln, gegen Pauls
      echte Bike-Daten validiert)
- [x] Ergebnis-Darstellung (Kennzahlen + Zonentabelle)
- [x] CTA zu Kontakt/Diagnostik-Angebot
- [x] Verlinkung von `diagnostik.html`
- [x] Responsive/Mobile-Test

**Status:** v1 gebaut & auf `main` deployed (2026-09-07), live unter
`cp-rechner.html`. Nachträglich ergänzt: vierte Sportart **Ski**
(Skiergometer, gleiches Watt-Modell wie Bike/Row). Am 2026-09-08 auf
ein realistischeres 3-Punkte-Protokoll umgestellt: **30s/2min/5min**
statt 10s/2min/5min/12min (12-Minuten-Tests sind am SkiErg unüblich).
Der Rechenkern (`computeBikeRow` in `js/cp-rechner.js`) ist dafür
generisch gemacht worden — nutzt die erste Zeile der jeweiligen
Sportart-Konfiguration als Sprintwert und alle weiteren für die
CP-Regression, unabhängig von Anzahl/Namen der Zeilen. Bike/Row bleiben
unverändert bei 10s/2/5/12min.

### Nächste Schritte (offen)

- [x] **Blogpost** im `.blog-grid` auf `index.html` verfasst und auf
      `cp-rechner.html` verlinkt — siehe §9.
- [ ] **Intervallrechner für `training.html`**: eigenes Feature, das aus
      den berechneten CP-/CS-Werten konkrete Trainingsintervalle ableitet
      (z.B. Sweetspot-/VO2max-Sets mit Watt- bzw. Pace-Zielen je Zone) —
      entspricht der oben unter "Umfang v1" als v2-Erweiterung vermerkten
      Idee "automatisch abgeleitete Intervallformen". Lebt auf/verlinkt von
      `training.html` — zweiter bewusster Zugang neben der Diagnostik-Seite
      (Diagnostik = "wird erklärt", Training = "wird gebraucht").

---

## 8. Homepage-Optimierung & Bugfixes (2026-09-07)

Nach dem CP-Rechner-Launch (§7) wurde die gesamte Seite technisch
durchoptimiert und zwei Mobile-Bugs gefunden und behoben.

### Performance
- Aktiv genutzte Bilder auf WebP umgestellt und sinnvoll verkleinert:
  ~4.9 MB → ~680 KB (−86 %) bei hero3/me2/run/swim. `width`/`height` an
  allen `<img>` ergänzt gegen Layout-Shift (CLS).
- Unreferenzierte alte Originaldateien entfernt (weiterhin ungenutzt im
  Repo: `hero.JPEG`, `hero2.jpg`, `me.JPEG` — bewusst nicht angerührt,
  falls für spätere Inhalte gebraucht).

### SEO & Social
- Favicon (S-Monogramm, schwarz/Akzentgelb) als `.ico` + PNG-Set +
  Apple-Touch-Icon + `manifest.json` (inkl. `theme-color`).
- Open-Graph-/Twitter-Card-Tags auf allen 4 Content-Seiten (vorher
  komplett gefehlt → keine Vorschau beim Teilen). Eigenes
  1200×630-Social-Preview-Bild (`images/og-image.jpg`).

### Analytics
- Cloudflare Web Analytics eingebunden (cookie-los, kein
  Consent-Banner nötig) — Dashboard unter Cloudflare
  "Analytics & Logs → Web Analytics" für `schwellenschmops.at`.

### Bugfixes (von Paul auf iPhone Safari gemeldet)
- **Weißer Rand am Seitenende beim Überscrollen** (iOS-Rubber-Band-
  Bounce): `<html>` hatte keine eigene Hintergrundfarbe → Fix:
  `html { background: var(--black); }`.
- **`.reveal-section` blieb auf einem Gerät dauerhaft unsichtbar**
  (Scroll-Einblend-Effekt hat nie ausgelöst, Sektion blieb bei
  `opacity: 0` hängen — sah aus wie eine leere weiße Fläche direkt
  unter dem Hero). Fix: Progressive Enhancement — Ausblenden nur noch
  aktiv, wenn `html.js` gesetzt ist (Inline-Script ganz am Anfang von
  `<head>`), zusätzlich 3-Sekunden-Timeout-Fallback in `main.js`, der
  notfalls alles zwangsweise einblendet. Dadurch kann kein Inhalt mehr
  dauerhaft unsichtbar bleiben, unabhängig von der genauen Ursache auf
  dem jeweiligen Gerät.

**Status:** Alles live auf `main` (Commits `87b6fb6`, `a0c4039`,
`0ed4520`, `5e71669`). Der `.reveal-section`-Fix war noch nicht die
ganze Geschichte — siehe Follow-up in §9. Offen bleiben weiterhin der
Intervallrechner (§7) sowie Social Links (Instagram/YouTube) laut
README.

---

## 9. CP-Rechner-Feinschliff, reveal-section-Nachbesserung & Blogpost (2026-09-08)

### CP-Rechner: zwei gemeldete Bugs behoben

- **Doppelpunkt bei der Zeiteingabe auf Mobile nicht eingebbar:** Die
  Zeitfelder (`Zeit (mm:ss)`) hatten `inputmode="numeric"`, das ruft auf
  iOS/Android eine reine Ziffern-Tastatur ohne `:` auf. Fix: auf
  `inputmode="decimal"` umgestellt (zeigt eine Zifferntastatur mit
  Punkt-Taste) und `parseTime()` in `js/cp-rechner.js` akzeptiert jetzt
  zusätzlich `.` und `,` als Trenner neben `:`.
- **Lauf-Texte sachlich falsch:** "Drei Zeitfahrten" zählte den
  optionalen Sprint mit (tatsächlich zwei Pflicht-Läufe: 1 km/3 km) und
  nannte sie "Zeitfahrten" statt "Läufe". Beide Texte korrigiert
  (`SPORT_INTRO.run` und der Ergebnis-Untertitel für Run). Die generische
  Hinweiszeile in `cp-rechner.html` ("Erholung zwischen den Testungen")
  wurde von "Zeitfahrten" auf "Testungen" vereinheitlicht, da sie
  sportartübergreifend gilt.

Dabei auch die Ski-Erg-Intervalle auf 30s/2/5min umgestellt, siehe §7.

### reveal-section: Root-Cause-Nachbesserung

Der 3-Sekunden-Fallback aus §8 hat verhindert, dass Inhalte dauerhaft
unsichtbar bleiben — aber auf `diagnostik.html`/`training.html` sitzt
die erste `.reveal-section` (wegen kurzem Hero) schon beim Laden im
Viewport, nicht erst beim Scrollen. Der IntersectionObserver feuert für
bereits sichtbare Elemente nicht auf jedem Gerät zuverlässig sofort,
wodurch der 3s-Timeout als sichtbare weiße Fläche durchschlug statt nur
Sicherheitsnetz zu sein. Fix in `js/main.js`: Sections werden beim Init
per `getBoundingClientRect().top < window.innerHeight` geprüft — liegen
sie schon im Viewport, sofort synchron `is-visible` setzen statt auf
den Observer zu warten; nur echte Below-the-Fold-Sections bekommen
weiter den animierten Scroll-Reveal über den Observer.

### Favicon: erst abgerundet, dann ganz neu (schlichter Punkt)

Erster Fix: `favicon.ico`/`favicon-16.png`/`favicon-32.png` wirkten im
Browser-Tab als hartes schwarzes Quadrat, mit Python/Pillow abgerundet
(transparente Ecken). Paul fand danach das S selbst noch zu unruhig
("was Schlichtes") — vier Alternativ-Entwürfe generiert (dünnes S,
reiner Punkt, aufsteigende "Schwellen"-Balken, S im Ring) und als
512px- und 32px-Vorschau gezeigt. Entscheidung: **schlichter gelber
Punkt**, kein Buchstabe mehr. Umgesetzt für das komplette Icon-Set:
- Browser-Tab (`favicon-16.png`, `favicon-32.png`, `favicon.ico`):
  transparenter Hintergrund, nur der Punkt — passt sich damit an jedes
  Tab-Theme (hell/dunkel) an.
- Homescreen-/PWA-Icons (`apple-touch-icon.png`, `favicon-192.png`,
  `favicon-512.png`): weiterhin eigener schwarzer Untergrund (RGB, kein
  Alpha), damit iOS/Android keinen weißen Hintergrund einsetzen.

### Blog: Titel der neuen Karte gekürzt

Nach Launch fiel auf, dass der neue Blogpost-Titel ("FTP oder Critical
Power? Was eine Doktorarbeit über deinen Schwellentest verrät", 80
Zeichen, Doppel-Frage) deutlich länger/dichter war als die anderen drei
Kartentitel und dadurch im 2×2-Grid unruhig wirkte — gekürzt auf "CP
oder FTP? Was eine Doktorarbeit zeigt" (38 Zeichen). Die eigentlichen
Karten-Boxhöhen im Grid waren dabei nie das Problem (im Test nur
~20–25px Differenz zwischen den Karten einer Reihe); das gelbe
Unterstrich-Element, das im ersten Feedback-Screenshot auffiel, war nur
der Hover-Zustand einer Karte, kein CSS-Bug.

### Neuer Blogpost: "FTP oder Critical Power?"

Erledigt den offenen Punkt aus §7. Neuer Eintrag im `.blog-grid` auf
`index.html`, verlinkt auf `cp-rechner.html`. Kernbotschaft: FTP
(Coggan, 20-Min-Test) und Critical Power (Mehrpunkt-Test, das
Rechenmodell des CP-Rechners) sind laut Forschungsliteratur nicht
zuverlässig austauschbar — Quelle ist primär Eanna McGraths
PhD-Dissertation (Trinity College Dublin, 2022, liegt als PDF vor),
ergänzt um sechs weitere recherchierte Studien/Reviews (2023–2026) als
verlinkte Quellenliste, die zeigen dass Richtung und Größe der
CP/FTP-Differenz protokoll-/populationsabhängig ist. Enthält:

- Eine eigene, markenkonforme Inline-SVG-Grafik der
  Power-Duration-Kurve (CP-Asymptote, W'-Fläche, FTP-Linie, 2/5/12-Min-
  Messpunkte wie im echten CP-Rechner-Protokoll) statt eines fremden
  Bilds.
- Einen praktischen Abschnitt für Leser, die trotzdem einen
  FTP-Vergleichswert brauchen (die meisten Trainings-Apps verlangen
  FTP, nicht CP): rechnerischer Weg über `CP + W'/Zieldauer` (mit
  Rechenbeispiel anhand Pauls eigener Bike-Werte) plus die
  95–98-%-Faustregel, inklusive Warnung dass das CP-Modell bei langen
  Zieldauern unzuverlässiger wird.

**Dabei gefundener und behobener Bug:** Die `max-height`-Grenze des
aufgeklappten Blog-Akkordeons (`.blog-card.is-open .blog-card-body`)
war mit 2400px zu knapp für den neuen, längeren Beitrag — auf Mobile
(390px Breite, mehr Zeilenumbrüche) wurde der Inhalt real 3318px hoch
und die Quellenliste/der CTA-Button am Ende abgeschnitten. Auf 4200px
erhöht und mit Playwright auf Mobile- und Desktop-Breite verifiziert
(kein Clipping mehr, `scrollHeight === clientHeight`).

**Status:** Alles live auf `main` (Commits `bac0ca6`, `0f76556`,
`96c2ec3`, `61de00a`, `3c2b43c`), gepusht und über GitHub Pages
(`CNAME` → schwellenschmops.at) automatisch deployed. Offen bleibt nur
noch der Intervallrechner für `training.html` (§7).
