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
- [ ] Fade-in beim Scrollen
- [ ] Hover-States
- [ ] Mobile Responsiveness
- [ ] Performance-Optimierung

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
(Skiergometer, gleiches Watt-Modell wie Bike/Row, eigene plausible
Platzhalter-Werte statt Pauls Bike-Zahlen).

### Nächste Schritte (offen)

- [ ] **Blogpost "DIY Diagnostik"** im `.blog-grid` auf `index.html`
      verfassen und darin auf `cp-rechner.html` verlinken — positioniert
      den Rechner als Selbstdiagnostik-Angebot (siehe README
      "Content management → Add a new blog post").
- [ ] **Intervallrechner für `training.html`**: eigenes Feature, das aus
      den berechneten CP-/CS-Werten konkrete Trainingsintervalle ableitet
      (z.B. Sweetspot-/VO2max-Sets mit Watt- bzw. Pace-Zielen je Zone) —
      entspricht der oben unter "Umfang v1" als v2-Erweiterung vermerkten
      Idee "automatisch abgeleitete Intervallformen". Lebt auf/verlinkt von
      `training.html` — zweiter bewusster Zugang neben der Diagnostik-Seite
      (Diagnostik = "wird erklärt", Training = "wird gebraucht").
