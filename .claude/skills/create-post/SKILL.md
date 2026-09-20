---
name: create-post
description: Schreibt und baut einen neuen Blogpost (Akkordeon-Karte) für die Schwellenschmops-Homepage in index.html — im bestehenden Haus-Stil (Tag, Titel, Teaser, Label/Absatz-Struktur, KI-Hinweis, Quellen, optionales SVG-Diagramm oder Foto). Aktiviere diesen Skill immer wenn Paul einen neuen Blogeintrag/Blogpost schreiben will, ihm eine Post-Idee einfällt, er eine Studie/Doktorarbeit zusammenfassen will, oder er einen Auszug aus seiner eigenen Arbeit (z.B. TrainingsLab-Fortschritt) als Post teilen möchte — auch wenn er nicht wörtlich "/create-post" tippt.
---

# Blogpost für Schwellenschmops schreiben

Diese Homepage ist eine statische Seite ohne Build-Step. Blogposts sind
Akkordeon-Karten (`<article class="blog-card">`) in der `.blog-grid` von
`index.html` — kein CMS, kein Markdown, direktes HTML. Vier Posts existieren
bereits und legen einen Stil fest, den dieser Skill fortführt statt neu zu
erfinden.

Der rote Faden für Paul ist **Authentizität**: entweder Wissenschaft so
erklären, dass sie jeder versteht (mit Quellenangabe — nichts unbelegt
behaupten), oder einen echten Auszug aus seiner eigenen Arbeit/seinem Denken
teilen. Kein generischer Marketing-Ton. Halte dich in jedem Schritt an diese
Leitplanke, auch wenn die Formulierung im Einzelfall abweicht.

## Schritt 1 — Erst zuhören, dann schreiben

Frag nach, bevor du irgendetwas formulierst oder gar einen Titel vorschlägst.
Zwei Post-Typen sind bisher etabliert, und der Typ bestimmt was du brauchst:

- **Wissenschafts-/Studien-Post** (wie der CP/FTP-Post): Bitte um die Quelle
  — ein PDF, ein Studienlink, oder Pauls eigene Daten/Excel. Ohne Quelle
  keine wissenschaftliche Behauptung im Text (siehe Schritt 5).
- **Persönlicher Post / Auszug aus eigener Arbeit** (wie der TrainingsLab-
  Post oder die Namensherkunfts-Geschichte): Bitte um Rohmaterial — ein paar
  Stichpunkte, ein Sprachnotiz-Transkript, ein ehrlicher Gedanken-Dump.
  Erhalte Pauls eigene Formulierungen so weit wie möglich, glätte nur Grammatik
  und Lesefluss — das ist der Unterschied zwischen "authentisch" und
  "generischer KI-Text", den Paul explizit will.

Klär auch kurz welcher Tag passt: bestehende Tags sind `TOOL`, `DIAGNOSTIK`,
`EMPFEHLUNG`, `HINTERGRUND` (kurz, GROSSGESCHRIEBEN). Passt keiner, schlag
einen neuen kurzen Tag vor statt einen bestehenden zu verbiegen.

## Schritt 2 — Titel-Suche, mit mehreren Varianten

Titel entstehen erst NACHDEM du weißt worum es geht — nie eine Titelidee raten
und dann das Rohmaterial danach zurechtbiegen. Paul will hier bewusst
"immer wieder nach einem lustigen oder leichten Titel suchen" statt den ersten
naheliegenden zu nehmen.

Schlag 3–4 Titel/Untertitel-Kombinationen vor, mit Spannweite: von verspielt-
leicht bis klar-beschreibend. Ein Untertitel muss nicht sein, aber probier ihn
bei prozesshaften Themen — Pauls eigenes Beispiel für den Ton, den er meint:

> Titel: **"Critical Power Auswertung"**
> Untertitel: *testen · auswerten · trainieren · testen · stolz sein auf sich :)*

Das ist der Zielton: eine kleine, ehrliche, leicht humorvolle Reise statt
einer trockenen Inhaltsangabe. Leg die Optionen Paul zur Wahl vor (z.B. per
`AskUserQuestion`) — schreib den Rest des Posts erst nachdem er sich
entschieden oder Feedback gegeben hat.

## Schritt 3 — Struktur füllen

Kopier ein bestehendes `<article class="blog-card">` aus
`references/blog-card-template.md` als Grundgerüst statt Markup freihändig
neu zu erfinden — das Grid-/Akkordeon-CSS (siehe `css/style.css` `.blog-grid`,
`.blog-card.is-open`) ist bereits für beliebig viele und beliebig lange
Karten ausgelegt, du musst dort nichts anpassen.

Aufbau pro Karte:
- Tag (`.blog-card-tag`) + Datum (`<span class="blog-date">`)
- Titel (`.blog-card-title`)
- Kurzer Teaser (`.blog-card-desc`, 1–3 Sätze) — das Einzige was sichtbar
  ist bevor jemand auf WEITERLESEN klickt, muss also neugierig machen
- `.blog-toggle`-Button (`.blog-toggle-label` mit "WEITERLESEN" +
  `.blog-toggle-icon`) — `js/main.js` toggelt das Label automatisch zu
  "SCHLIESSEN" (und Icon zu "×"), sobald der Klassenname stimmt
- `.blog-card-body` mit 2–4 Abschnitten, je ein `.blog-card-label`
  (Mini-Header, GROSSGESCHRIEBEN) + ein `.blog-card-desc`-Absatz
  (~80–150 Wörter, mehrere zusammengehörige Gedanken mit Überleitungssätzen
  verbunden — siehe Abschnitt 5 in `references/blog-card-template.md`).
  **Nicht** für jeden Einzelfakt ein eigenes Ein-Satz-Label anlegen, das wirkt
  zerhackt. Ausnahme: reine Empfehlungs-/Linklisten (wie die
  Podcast-Empfehlungen) bekommen statt vieler Einzel-Labels thematische
  Gruppen-Labels mit je einer `<ul class="blog-list">` darunter.
- Ist ein `.blog-card-desc`-Absatz innerhalb eines Labels trotzdem länger
  als ~70 Wörter, an einer natürlichen Gedankenpause in zwei separate
  `<p class="blog-card-desc">` aufteilen statt einen Wall-of-Text zu lassen
  — `css/style.css` fügt zwischen zwei direkt aufeinanderfolgenden
  `.blog-card-desc` automatisch 14px Abstand ein (Pauls Feedback
  2026-09-13: "macht nicht das ein oder andere Mal ein Zeilenumbruch Sinn
  für bessere Lesbarkeit?"). `.blog-card-label` selbst ist bewusst als
  klare, abgesetzte Zwischenüberschrift gestylt (11.5px, fett, 26px
  Abstand nach oben) — daran beim Schreiben nichts inline überschreiben.

## Schritt 4 — Der ehrliche Hinweis (immer)

Jeder neue Post bekommt einen letzten Label-Abschnitt "EIN EHRLICHER HINWEIS",
der offenlegt dass KI beim Formulieren mitgeholfen hat — das war bisher nur
bei zwei von vier Posts der Fall, ist aber jetzt Standard für alle, weil es
zu Pauls Authentizitäts-Anspruch gehört, nicht nur zu Wissenschafts-Posts.
Formuliere ihn passend zum Post-Typ — bei einer Studien-Zusammenfassung
anders als bei einem persönlichen Text (siehe die zwei bestehenden Varianten
in `references/blog-card-template.md`).

## Schritt 5 — Quellen (Pflicht bei Wissenschafts-Content, NICHT bei Praxiswissen)

Sobald der Post eine **konkrete** wissenschaftliche Aussage, Studie oder
Zahl aus einer bestimmten fremden Arbeit enthält, MUSS ein Quellen-Abschnitt
folgen — keine Ausnahme, das ist Pauls explizite Vorgabe. **Kein**
Quellen-Zwang dagegen bei:
- etabliertem Praxis-/Trainingslehre-Vokabular ohne konkrete Studienzahl
  (z.B. Periodisierungs-Phasenmodelle wie Grundlage/Aufbau/Wettkampf/
  Regeneration, HIT/LIT-Begriffe) — Paul hat das 2026-09-13 beim
  Saisonplanungs-Post explizit klargestellt ("keine Wissenschaft
  notwendig"), nachdem ein Diagramm mit Tapering-Studienzahl entfernt wurde.
- einem vagen, unspezifischen Verweis auf den allgemeinen Forschungsstand
  ohne konkrete Einzelstudie/Zahl (z.B. "Studien kommen dabei zu
  unterschiedlichen Ergebnissen" oder "die Forschung ist sich uneinig") —
  das ist eine Einordnung/Meinung, kein zitierfähiger Einzelfakt. Sobald
  daraus eine konkrete Zahl oder ein bestimmtes Studienergebnis wird,
  kippt es wieder in die Quellenpflicht.

Bei sowas lieber praxisnah bleiben oder, falls Paul eine Referenzseite
nennt, deren Ansatz/Wording übernehmen statt eine Studie zu suchen. Im
Zweifel nachfragen statt automatisch zu zitieren.

Wenn Quellen doch nötig sind, Format exakt wie im bestehenden CP/FTP-Post
(Snippet in `references/blog-card-template.md`):
`<p class="blog-card-label">QUELLEN</p>` + `<ul class="source-list">` mit
je einem `<li><a class="source-link" href="..." target="_blank"
rel="noopener">Autor(en) (Jahr) — Titel</a></li>` pro Quelle. Kein DOI, kein
Journal-Name im Linktext — Autor(en), Jahr, Titel, fertig.

## Schritt 6 — Diagramm oder Foto (bewusste Wahl)

Nicht jeder Post braucht eine Grafik. Entscheide bewusst:

- **SVG-Diagramm**, wenn eine Kurve, ein Zusammenhang oder ein Prozess sich
  visuell wirklich einfacher erklärt als in Worten — nicht als Dekoration.
  Übernimm das bestehende Barrierefreiheits-Pattern 1:1 (Snippet in
  `references/blog-card-template.md`): Wrapper-Div mit `role="img"` +
  `aria-label` (Prosa-Beschreibung was die Grafik zeigt), `<svg
  aria-hidden="true">` mit einem `<title>` drin, sichtbare
  `.blog-diagram-caption` darunter. **Wichtig:** setz `min-width` auf dem
  `<svg>`-Element exakt auf dessen eigene `viewBox`-Breite (z.B. `viewBox="0
  0 640 235"` → `min-width: 640px`) — ohne das schrumpft die Beschriftung auf
  schmalen Screens auf ~4px und wird unlesbar (das war ein echter Bug, siehe
  Memory `blog-grid-readability-fixes`). Die generische `.blog-diagram`-CSS
  kümmert sich mit `overflow-x: auto` automatisch um den Rest — auf
  Mobile wird die Grafik dann horizontal scrollbar statt gestaucht,
  auf Desktop ändert sich nichts.
- **Foto**, wenn es einen persönlichen/authentischen Moment unterstreicht
  (z.B. bei einem Auszug aus eigener Arbeit). Leg neue Bilder als
  lowercase, kurz benannt, im `.webp`-Format unter `/images/` ab — die
  älteren `.JPEG`-Dateien im Ordner sind Legacy, führ diese Konvention nicht
  fort.

## Schritt 7 — CTA nur wenn es einen echten Zielort gibt

Ein abschließender `.blog-card-cta`-Link (z.B. "ZUM TRAININGSLAB ↗" oder
"JETZT DEINE CP BERECHNEN ↗") gehört an den Schluss, aber nur wenn es
tatsächlich ein sinnvolles Ziel gibt (Tool, Unterseite, Kontaktformular).
Bei reinen Meinungs-/Listen-Posts ohne Zielort einfach weglassen, nicht
erzwingen — die zwei kürzeren Bestandsposts (Podcasts, Namensherkunft) haben
auch keinen.

## Schritt 8 — Einfügen in index.html

Füg die neue Karte standardmäßig direkt NACH der `blog-card--featured`-Karte
ein (= neuester "normaler" Post, hinter dem manuell kuratierten Featured-
Slot). Der Featured-Slot selbst ist eine seltene, bewusste Paul-Entscheidung
— fass ihn nicht automatisch an, frag im Zweifel nach wo der neue Post hin
soll.

Kein Umbau an `sitemap.xml` oder den Open-Graph-Tags nötig — Akkordeon-Karten
sind keine eigenen URLs. Braucht ein Thema eine eigene Unterseite (wie
`cp-rechner.html`, weil es ein interaktives Tool statt eines Artikels ist),
ist das ein separates Custom-Dev-Projekt außerhalb dieses Skills — sag das
Paul explizit statt es hier mitzuerledigen.

## Schritt 9 — Kurzer Self-Check vor Fertigmeldung

- Klassennamen exakt wie im Bestand: `blog-card`, `blog-toggle`,
  `blog-toggle-label`, `blog-toggle-icon`, `blog-card-body`,
  `blog-card-label`, `blog-card-desc` — `js/main.js` selektiert darüber
  (`btn.closest('.blog-card')`, `btn.querySelector('.blog-toggle-label')`
  usw.), ein abweichender Klassenname bricht das Akkordeon lautlos oder
  lässt den Button-Text beim Öffnen/Schließen stehen bleiben.
- Höchstens 2–4 `.blog-card-label`-Abschnitte mit vollen Absätzen
  (Abschnitt 5, `references/blog-card-template.md`) — nicht für jeden
  Einzelfakt ein neues Mini-Label.
- Keine Inline-Styles, keine neuen Wrapper-Divs um die Karte herum.
- Bei SVG: `min-width` gesetzt (Schritt 6), `aria-hidden` auf dem `<svg>`,
  `role="img"` + `aria-label` auf dem Wrapper.
- Bei konkreter Studie/Zahl aus einer bestimmten Arbeit: Quellen-Abschnitt
  vorhanden (vage Verweise auf den Forschungsstand ohne Einzelstudie/Zahl
  sind davon ausgenommen, siehe Schritt 5).
- "EIN EHRLICHER HINWEIS"-Abschnitt vorhanden.
