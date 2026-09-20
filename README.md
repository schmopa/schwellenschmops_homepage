# SCHWELLENSCHMOPS — Homepage

Personal homepage for Paul / Schwellenschmops. Static HTML/CSS/JS, deployed
as-is — no build step for hosting (GitHub Pages serves the root `*.html`
files directly). There **is** a small local build script (`build.js`, see
below) that keeps header/footer/head boilerplate in sync across pages —
run it after editing anything in `partials/`.

Live: [schwellenschmops.at](https://schwellenschmops.at)

---

## Local development

```bash
npx serve . -p 3456
# → http://localhost:3456
```

Or open `index.html` directly in the browser (Google Fonts may not load without a server).

### One-time setup after cloning

```bash
git config core.hooksPath .githooks
```

Activates the pre-commit hook (tracked in `.githooks/`, not in the default
`.git/hooks/` which isn't versioned) that runs `build.js` automatically
before every commit — see [Header/Footer/Head sync](#headerfooterhead-sync-buildjs).

---

## File structure

```
schwellenschmops_homepage/
├── index.html            Main page (Hero, Leistungen, About, Blog, Kontakt)
├── diagnostik.html        Subpage: Testprotokolle (Laktat, CP, Maximalkraft)
├── training.html          Subpage: Trainingspläne (Ausdauer, Kraft, Kombination)
├── tools.html              Übersichtsseite für die Rechner-Tools
├── cp-rechner.html         Tool: Critical-Power-/Critical-Speed-Rechner
├── intervalle.html         Tool: Intervallrechner (aus CP/CS abgeleitet)
├── saisonplan.html         Tool: Saisonplaner (Makro-Ebene)
├── impressum.html          Imprint (Austrian ECG)
├── datenschutz.html        Privacy policy (GDPR/DSGVO)
├── css/
│   └── style.css          Complete styling (variables, layout, responsive)
├── js/
│   ├── main.js             Sticky header, mobile menu, scroll-reveal, carousel,
│   │                       blog accordion, contact form validation + honeypot
│   ├── rechner-utils.js    Geteilte Helfer für die 3 Rechner-Tools (parseTime,
│   │                       formatTime, hexMix, Error-Summary, …)
│   ├── pdf-utils.js        Geteiltes PDF-Pagination-Gerüst (jsPDF) für die 3
│   │                       Rechner-Tools (createDoc/ensureSpace/Stempelzeile)
│   ├── cp-rechner.js        Logik für cp-rechner.html
│   ├── intervalle.js        Logik für intervalle.html
│   └── saisonplan.js        Logik für saisonplan.html
├── partials/                Gemeinsame Header-/Footer-/Head-Bausteine, siehe unten
├── build.js                 Synct partials/ in die 9 Root-HTML-Seiten
├── .githooks/pre-commit      Führt build.js vor jedem Commit aus
├── images/                  *.webp (komprimiert), Favicons, Social-Preview
├── manifest.json, robots.txt, sitemap.xml, CNAME    Deployment/SEO-Metadaten
└── .claude/skills/           create-post-Skill für neue Blogposts
```

---

## Header/Footer/Head sync (`build.js`)

Header, Footer und ein Teil des `<head>` (Favicon-Block, Font-/Stylesheet-/
Analytics-Block) sind früher in allen 9 HTML-Seiten von Hand identisch
gehalten worden — fehleranfällig, besonders der `css/style.css?v=...`-
Cache-Buster, der bei jeder CSS-Änderung in jeder Datei einzeln hochgezählt
werden musste.

Jetzt liegen diese Bausteine als Partials unter `partials/`, und jede
Root-HTML-Seite markiert die entsprechenden Stellen mit Kommentaren:

```html
<!-- BUILD:HEADER variant="full" -->
...wird von build.js überschrieben...
<!-- /BUILD:HEADER -->
```

**Nach jeder Änderung an einem Partial (oder an den Cache-Buster-Versionen
in `build.js`):**

```bash
node build.js
```

Das Script liest die `variant="..."`-Angabe direkt aus dem jeweiligen
Marker (keine hartkodierte Seitenliste nötig) und schreibt die passende
Datei aus `partials/` hinein. Seiten-spezifischer Inhalt (Titel, Meta-
Description, Canonical-URL, OG/Twitter-Tags, der eigentliche `<main>`-
Inhalt) liegt außerhalb der Marker und bleibt unangetastet.

Der Pre-Commit-Hook (`.githooks/pre-commit`, siehe Setup oben) führt das
automatisch vor jedem Commit aus und bricht ab, falls sich dadurch noch
etwas ändert — das heißt, der gestagte Stand war nicht aktuell.

### Eine neue Seite hinzufügen

1. Eine bestehende Content-Seite (z.B. `intervalle.html`) als Ausgangspunkt
   kopieren — sie enthält bereits alle Marker in der richtigen Struktur.
2. Titel, Meta-Description, Canonical-URL, OG/Twitter-Tags und den
   `<main>`-Inhalt anpassen. Marker-Regionen (Header/Footer/Head-Assets)
   nicht von Hand ändern.
3. Neuen Dateinamen in der `PAGES`-Konstante in `build.js` eintragen
   (Standard-Hrefs für Kontakt/About/Blog wie bei den anderen Content-
   Seiten: `index.html#contact` etc.).
4. In `sitemap.xml` ergänzen, ggf. Nav-Links auf anderen Seiten setzen.
5. `node build.js` laufen lassen und `git diff` prüfen.

### Ein neues Rechner-Tool bauen

Für ein viertes Tool (nach CP-Rechner, Intervallrechner, Saisonplan) lohnt
sich der Blick in `js/rechner-utils.js` (Zeit-/Zahlen-Parsing, Farbmischung,
Error-Summary) und `js/pdf-utils.js` (gemeinsames jsPDF-Pagination-Gerüst
mit Seitenumbruch-Callback) — beide vor dem eigenen Tool-Script laden
(siehe Script-Tag-Reihenfolge in `cp-rechner.html`/`intervalle.html`/
`saisonplan.html`). Neue, nur diesem Tool eigene Helfer bleiben in der
eigenen Datei.

---

## Design system

| Token | Value |
|---|---|
| `--black` | `#0a0a0a` |
| `--white` | `#f5f4f0` |
| `--accent` | `#ffe55c` (neon yellow) |
| `--gray` | `#888888` |
| Display font | Bebas Neue |
| Body font | Barlow / Barlow Condensed |

All colors and spacing as CSS custom properties in `:root` — only change there.

---

## Content management

### Add a new blog post

Nutz den `create-post`-Skill (`.claude/skills/create-post/`) — er kennt den
Haus-Stil (Tag/Titel/Teaser/Label-Struktur, KI-Hinweis, Quellenangaben) und
baut die `<article class="blog-card">`-Karte direkt im `.blog-grid` in
`index.html`.

### Add a new Diagnostik/Training card

Copy an `<article class="service-card">` block inside `.services-grid` in `diagnostik.html` or `training.html`.  
Use `.card-sub` for section labels (WAS IST ES? / WAS BEKOMMST DU? / FÜR WEN?) and `.card-desc` for text.

### Critical-Power-/Critical-Speed-Rechner anpassen

`cp-rechner.html` + `js/cp-rechner.js` (nicht in der Hauptnav, verlinkt von
der Critical-Power-Test-Karte auf `diagnostik.html` sowie von `tools.html`).
Regressionsformeln (CP/W'/MAP/VO2max, Critical Speed) stehen als reine
Funktionen oben in der Datei; die Zonen-%-Bänder liegen in der `ZONES`-
Konstante — beides einfach direkt im Code anpassbar, falls Paul genauere
Werte aus seiner Excel nachliefert. Geteilte Helfer siehe
[Header/Footer/Head sync](#headerfooterhead-sync-buildjs) oben.

### Swap carousel image

Place image in `/images/`, then update the `src` path in the `about-carousel` block.  
New slides: add `<div class="carousel-slide">` and a matching `.dot` button.

### Social links (hero)

Add links inside `<div class="hero-social">`.  
Insert SVG icons for Instagram/YouTube/etc. as inline SVG.  
CSS styles (`.hero-social a`) are already in place.

---

## Deployment

Hosted on **GitHub Pages** — branch `main`, root folder.  
Every `git push` to `main` triggers an automatic redeploy (usually within 1–2 minutes).

### Contact form

Powered by **Formspree** (`https://formspree.io/f/xyklogpy`).  
Submissions are forwarded to `schmopa12@gmail.com`.

---

## Open items

- [ ] Social links (Instagram, YouTube, …) — hero + footer
- [x] Favicon (schlichter gelber Punkt, `favicon.ico` + `images/favicon-*.png`, erledigt 2026-09-08)
- [x] Analytics (Cloudflare Web Analytics, cookie-los, erledigt 2026-09-07)
- [x] Intervallrechner (`intervalle.html`, erledigt 2026-09-20)
- [x] Header/Footer/Head-Sync via `build.js` statt Handpflege (erledigt 2026-09-20)
