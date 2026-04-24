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
