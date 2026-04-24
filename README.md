# SCHWELLENSCHMOPS — Homepage

Personal homepage for Paul / Schwellenschmops. Static HTML/CSS/JS, no build step.

---

## Lokaler Start

```bash
npx serve . -p 3456
# → http://localhost:3456
```

Oder direkt `index.html` im Browser öffnen (ohne Server fehlen evtl. Font-Requests bei CSP).

---

## Dateien

```
homepage_v2/
├── index.html          Einzige HTML-Seite (alle Sektionen als Anker)
├── css/
│   └── style.css       Komplettes Styling (Variablen, Layout, Responsive)
├── js/
│   └── main.js         Sticky Header, Mobile-Menü, Scroll-Reveal, Karussell, Blog-Akkordeon
├── images/
│   ├── hero.JPEG       Hero-Hintergrundbild (Gletscher)
│   ├── me2.JPEG        Karussell Slide 1 (Portrait Bergen)
│   ├── swim.JPEG       Karussell Slide 2 (Triathlon Schwimmen)
│   ├── run.JPEG        Karussell Slide 3 (Laufen Rennen)
│   ├── me.JPEG         Derzeit nicht im Einsatz
│   └── run_hero.png    Derzeit nicht im Einsatz
├── CONTENT.md          Inhaltsdatei — hier Texte/Links eintragen
└── KONZEPT.md          Ursprüngliches Design-Konzept & Analyse
```

---

## Design-System

| Token | Wert |
|---|---|
| `--black` | `#0a0a0a` |
| `--white` | `#f5f4f0` |
| `--accent` | `#ffe55c` (Neongelb) |
| `--gray` | `#888888` |
| Display-Font | Bebas Neue |
| Body-Font | Barlow / Barlow Condensed |

Alle Farben und Abstände als CSS-Custom-Properties in `:root` — nur dort ändern.

---

## Inhalte pflegen

### Neues Blog-Beitrag hinzufügen

Einen `<article class="blog-card">` Block im Blog-Grid (`.blog-grid`) kopieren.  
Für aufklappbaren Inhalt: `<button class="blog-toggle">` + `<div class="blog-card-body">` einbauen — das JS übernimmt den Rest automatisch.

### Karussell-Bild tauschen

Bild in `/images/` ablegen, dann im `about-carousel` Block den `src`-Pfad anpassen.  
Neue Slides: `<div class="carousel-slide">` hinzufügen und einen weiteren `.dot`-Button eintragen.

### Social-Links (Hero)

Im `<div class="hero-social">` die auskommentierten Links eintragen.  
SVG-Icons für Instagram/YouTube/etc. direkt als Inline-SVG einfügen.  
CSS-Styles (`.hero-social a`) sind bereits vorhanden.

---

## Deployment

Empfohlen: **Netlify Drop** (netlify.com/drop — Ordner reinziehen, fertig).

### Kontaktformular aktivieren (Netlify Forms)

1. `<form ... name="contact" method="POST" action="#contact">` ersetzen durch:
   ```html
   <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
     <input type="hidden" name="form-name" value="contact" />
   ```
2. Nach dem Deploy landen Nachrichten automatisch im Netlify-Dashboard.

---

## Offene Punkte

- [ ] Social-Links (Instagram, YouTube, …) eintragen — Hero + Footer
- [ ] Impressum-Seite bauen (`impressum.html`) und Link im Footer setzen
- [ ] Datenschutz-Seite bauen (`datenschutz.html`) und Link im Footer setzen
- [ ] Kontaktformular mit Netlify Forms verbinden (siehe oben)
- [ ] Hero-Bild ersetzen, sobald ein besseres Foto vorhanden ist
- [ ] Favicon einbinden (`<link rel="icon" href="images/favicon.ico">`)
