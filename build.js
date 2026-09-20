#!/usr/bin/env node
/* SCHWELLENSCHMOPS — build.js
   Synct die gemeinsamen Header-/Footer-/Head-Boilerplate-Regionen in allen
   Root-HTML-Seiten aus partials/ — kein Static-Site-Generator, kein Build-
   Schritt für GitHub Pages nötig: die Root-*.html bleiben das, was deployed
   wird, dieses Script überschreibt nur die markierten Regionen darin.

   Aufruf: node build.js (keine npm-Abhängigkeit, nur fs/path).

   Marker-Syntax in den HTML-Dateien:
     <!-- BUILD:NAME variant="..." -->   ... wird überschrieben ...   <!-- /BUILD:NAME -->
   Die Variante steht im Marker selbst — build.js braucht daher keine
   hartkodierte Seitenliste, um zu wissen, welche Seite welchen Header
   bekommt. Fehlt ein Marker auf einer Seite (z.B. BUILD:SCRIPTS auf den
   Legal-Seiten), wird er einfach übersprungen.

   Tokens ({{NAME}}) werden zuerst innerhalb der eingefügten Partials und
   danach global über die gesamte Datei aufgelöst (fängt z.B. die
   Cache-Buster in den handgeschriebenen Tool-Script-Tags ab, die
   außerhalb jeder Marker-Region liegen). */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, 'partials');

// Globale Cache-Buster — einzige Quelle statt manuell in mehreren Dateien
// synchron gehalten. Bei jeder inhaltlichen Änderung an der jeweiligen
// Datei hier hochzählen (siehe README.md).
const GLOBAL_TOKENS = {
  CSS_VERSION: '20260920',
  MAIN_JS_VERSION: '20260918',
  RECHNER_UTILS_VERSION: '20260920',
  PDF_UTILS_VERSION: '20260920'
};

// Pro Seite: nur die Werte, die zwischen Seiten tatsächlich variieren
// (Fragment-Links auf index.html sind bare "#x", sonst "index.html#x").
const PAGES = {
  'index.html':       { CONTACT_HREF: '#contact',           ABOUTME_HREF: '#aboutme',           BLOG_HREF: '#blog' },
  'diagnostik.html':  { CONTACT_HREF: 'index.html#contact', ABOUTME_HREF: 'index.html#aboutme', BLOG_HREF: 'index.html#blog' },
  'training.html':    { CONTACT_HREF: 'index.html#contact', ABOUTME_HREF: 'index.html#aboutme', BLOG_HREF: 'index.html#blog' },
  'tools.html':       { CONTACT_HREF: 'index.html#contact', ABOUTME_HREF: 'index.html#aboutme', BLOG_HREF: 'index.html#blog' },
  'cp-rechner.html':  { CONTACT_HREF: 'index.html#contact', ABOUTME_HREF: 'index.html#aboutme', BLOG_HREF: 'index.html#blog' },
  'intervalle.html':  { CONTACT_HREF: 'index.html#contact', ABOUTME_HREF: 'index.html#aboutme', BLOG_HREF: 'index.html#blog' },
  'saisonplan.html':  { CONTACT_HREF: 'index.html#contact', ABOUTME_HREF: 'index.html#aboutme', BLOG_HREF: 'index.html#blog' },
  'impressum.html':   { CONTACT_HREF: 'index.html#contact' },
  'datenschutz.html': { CONTACT_HREF: 'index.html#contact' }
};

// marker name -> { variantKey: partialFileName }. "default" greift, wenn
// der Marker im HTML kein variant="..." trägt.
const PARTIAL_FILES = {
  HEAD_TOP:     { default: 'head-top.html' },
  HEAD_FAVICON: { default: 'head-favicon.html' },
  HEAD_ASSETS:  { default: 'head-assets.html' },
  HEADER:       { full: 'header-full.html', minimal: 'header-minimal.html' },
  FOOTER:       { default: 'footer.html' },
  SCRIPTS:      { default: 'scripts-content.html' }
};

const MARKER_NAMES = Object.keys(PARTIAL_FILES);

const partialCache = {};
function loadPartial(fileName) {
  if (!partialCache[fileName]) {
    partialCache[fileName] = fs.readFileSync(path.join(PARTIALS_DIR, fileName), 'utf8');
  }
  return partialCache[fileName];
}

function substituteTokens(text, tokens) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in tokens)) throw new Error('Unresolved token {{' + key + '}}');
    return tokens[key];
  });
}

// Ersetzt genau eine Marker-Region. Gibt { content, found } zurück;
// found=false heißt: dieser Marker existiert auf der Seite nicht (ok,
// z.B. BUILD:SCRIPTS auf den Legal-Seiten) -- Datei bleibt unverändert.
function replaceMarkerRegion(content, markerName, tokens, filePath) {
  const openRe = new RegExp('<!--\\s*BUILD:' + markerName + '(?:\\s+variant="([^"]*)")?\\s*-->');
  const closeTag = '<!-- /BUILD:' + markerName + ' -->';

  const openMatch = content.match(openRe);
  if (!openMatch) return { content, found: false };

  const afterOpen = openMatch.index + openMatch[0].length;
  const closeIdx = content.indexOf(closeTag, afterOpen);
  if (closeIdx === -1) {
    throw new Error(filePath + ': BUILD:' + markerName + ' geöffnet, aber nie geschlossen');
  }

  const variantKey = openMatch[1] || 'default';
  const partialFile = PARTIAL_FILES[markerName][variantKey];
  if (!partialFile) {
    throw new Error(filePath + ': kein Partial für BUILD:' + markerName + ' variant="' + variantKey + '" registriert');
  }

  // Nur rechts trimmen (Partials sind bereits mit der richtigen Einrückung
  // für Zeile 1 geschrieben) -- ein voller .trim() würde die führenden
  // Leerzeichen der ersten Zeile mitreißen und die Einrückung zerstören.
  const resolved = substituteTokens(loadPartial(partialFile), tokens).replace(/\s+$/, '');
  const before = content.slice(0, afterOpen);
  const after = content.slice(closeIdx);
  return { content: before + '\n' + resolved + '\n' + after, found: true };
}

function buildPage(fileName, pageTokens) {
  const filePath = path.join(ROOT, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const tokens = Object.assign({}, GLOBAL_TOKENS, pageTokens);

  MARKER_NAMES.forEach((markerName) => {
    content = replaceMarkerRegion(content, markerName, tokens, filePath).content;
  });

  // Zweiter Durchlauf über die GESAMTE Datei: fängt {{TOKEN}}-Stellen ab,
  // die außerhalb jeder Marker-Region liegen (z.B. die Cache-Buster in den
  // handgeschriebenen jsPDF-/Tool-Script-Tags auf den 3 Rechner-Seiten).
  content = substituteTokens(content, tokens);

  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const pages = Object.keys(PAGES);
  pages.forEach((fileName) => buildPage(fileName, PAGES[fileName]));
  console.log('build.js: ' + pages.length + ' Seiten aus partials/ synchronisiert.');
}

main();
