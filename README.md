# SCHWELLENSCHMOPS — Homepage

Personal homepage for Paul / Schwellenschmops. Static HTML/CSS/JS, no build step.

Live: [schwellenschmops.at](https://schwellenschmops.at)

---

## Local development

```bash
npx serve . -p 3456
# → http://localhost:3456
```

Or open `index.html` directly in the browser (Google Fonts may not load without a server).

---

## File structure

```
homepage_v2/
├── index.html            Main page (Hero, Leistungen, About, Blog, Kontakt)
├── diagnostik.html       Subpage: Testprotokolle (Laktat, CP, Maximalkraft)
├── training.html         Subpage: Trainingspläne (Ausdauer, Kraft, Kombination)
├── impressum.html        Imprint (Austrian ECG)
├── datenschutz.html      Privacy policy (GDPR/DSGVO)
├── css/
│   └── style.css         Complete styling (variables, layout, responsive)
├── js/
│   └── main.js           Sticky header, mobile menu, scroll-reveal, carousel,
│                         blog accordion, contact form validation + honeypot
└── images/
    ├── hero2.jpg         Hero background (Norway, Lovatnet)
    ├── me2.JPEG          Carousel slide 1 (portrait)
    ├── swim.JPEG         Carousel slide 2 (triathlon swimming)
    └── run.JPEG          Carousel slide 3 (running race)
```

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

Copy an `<article class="blog-card">` block inside `.blog-grid` in `index.html`.  
For expandable content: add `<button class="blog-toggle">` + `<div class="blog-card-body">` — JS handles the rest automatically.

### Add a new Diagnostik/Training card

Copy an `<article class="service-card">` block inside `.services-grid` in `diagnostik.html` or `training.html`.  
Use `.card-sub` for section labels (WAS IST ES? / WAS BEKOMMST DU? / FÜR WEN?) and `.card-desc` for text.

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
- [ ] Favicon (`<link rel="icon" href="images/favicon.ico">`)
