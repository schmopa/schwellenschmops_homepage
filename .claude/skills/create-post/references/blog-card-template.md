# Copy-paste-Vorlagen für neue Blogposts

Diese Snippets 1:1 aus dem Bestand übernommen (CP/FTP-Post und TrainingsLab-
Post in `index.html`) — beim Einfügen die Platzhalter in `[...]` ersetzen,
sonst nichts an Struktur/Klassennamen ändern.

## 1. Grundgerüst einer Karte (ohne Diagramm/Quellen)

```html
<article class="blog-card">
  <div class="blog-card-tag">[TAG]</div>
  <span class="blog-date">[Monat Jahr]</span>
  <h3 class="blog-card-title">[Titel]</h3>
  <p class="blog-card-desc">
    [Kurzer Teaser, 1-3 Sätze — das Einzige was vor "WEITERLESEN" sichtbar ist.]
  </p>

  <button class="blog-toggle" aria-expanded="false">
    WEITERLESEN <span class="blog-toggle-icon">+</span>
  </button>

  <div class="blog-card-body">
    <p class="blog-card-label">[ERSTES LABEL]</p>
    <p class="blog-card-desc">[Absatz, ~40-70 Wörter.]</p>

    <p class="blog-card-label">[ZWEITES LABEL]</p>
    <p class="blog-card-desc">[Absatz.]</p>

    <!-- 3-8 Label/Absatz-Paare je nach Thema, dann: -->

    <p class="blog-card-label">EIN EHRLICHER HINWEIS</p>
    <p class="blog-card-desc">[Siehe Abschnitt 4 unten für zwei Varianten.]</p>

    <!-- Optional, nur wenn es einen echten Zielort gibt: -->
    <a href="[interner Anker oder externe URL]" class="blog-card-cta">
      [CTA-TEXT] <span>↗</span>
    </a>
  </div>
</article>
```

Hinweis: die featured Karte (`blog-card blog-card--featured`) ist ein
seltener, manuell kuratierter Sonderfall — neue Posts bekommen normalerweise
NUR `class="blog-card"`, ohne `--featured`.

## 2. Quellen-Block (Pflicht bei Wissenschafts-Content)

Direkt vor dem CTA-Link (falls vorhanden) einfügen:

```html
<p class="blog-card-label">QUELLEN</p>
<ul class="source-list">
  <li><a class="source-link" href="[URL]" target="_blank" rel="noopener">[Autor(en)] ([Jahr]) — [Titel der Studie/Arbeit]</a></li>
  <li><a class="source-link" href="[URL]" target="_blank" rel="noopener">[Autor(en)] ([Jahr]) — [Titel]</a></li>
</ul>
```

Format: Em-Dash zwischen Jahr und Titel, kein DOI, kein Journal-Name im
Linktext. Beispiel aus dem Bestand: "Poole et al. (2016) — Critical Power:
An Important Fatigue Threshold in Exercise Physiology".

## 3. SVG-Diagramm-Block (nur wenn eine Grafik wirklich hilft)

```html
<div class="blog-diagram" role="img" aria-label="[Prosa-Beschreibung was die Grafik zeigt — vollständiger Satz, für Screenreader-Nutzer:innen]">
  <svg viewBox="0 0 [BREITE] [HÖHE]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <title>[Kurzer technischer Titel der Grafik]</title>
    <!-- Pfade/Linien/Text-Elemente hier -->
  </svg>
  <p class="blog-diagram-caption">[Sichtbare Caption, die die Kernaussage der Grafik in einem Satz wiederholt.]</p>
</div>
```

**Kritisch:** in `css/style.css` bei `.blog-diagram svg` steht
`min-width: 640px` — das ist an die viewBox-Breite des BISHERIGEN Diagramms
(640) gekoppelt. Baust du ein neues Diagramm mit einer anderen viewBox-Breite,
musst du diesem neuen `<svg>` eine eigene `min-width` geben (Inline-Style
oder eine neue, spezifischere CSS-Regel), passend zu seiner eigenen
viewBox-Breite — sonst schrumpft es auf schmalen Screens unlesbar klein, oder
die generische Regel zwingt es auf eine falsche Mindestbreite.

## 4. "EIN EHRLICHER HINWEIS" — zwei Ton-Varianten aus dem Bestand

**Bei einer Wissenschafts-Zusammenfassung** (aus dem CP/FTP-Post):
> Ich bin kein Sportwissenschaftler, aber ich lese gerne, was die
> rausfinden. Dieser Beitrag ist eine vereinfachte, KI-unterstützte
> Zusammenfassung einer Dissertation und einer weiteren Studie (Quellen
> unten).

**Bei einem persönlichen Post** (aus dem TrainingsLab-Post):
> Ich arbeite selbst viel mit KI — auch dieser Beitrag ist KI-unterstützt
> entstanden. Mein Ziel dabei ist immer dasselbe: KI für das nutzen was
> enorm viel Zeit kostet, damit ich mich auf das konzentrieren kann was
> zählt — das Individuum verstehen und einen Plan erarbeiten der wirklich
> funktioniert.

Beide sind ehrlich und konkret statt einer austauschbaren Standardfloskel —
formuliere für jeden neuen Post eine passende dritte Variante statt eine der
beiden wortwörtlich zu kopieren.
