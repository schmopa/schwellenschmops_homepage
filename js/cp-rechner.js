/* SCHWELLENSCHMOPS — cp-rechner.js
   Critical-Power-/Critical-Speed-Rechner (Bike / Row / Run).
   Reines Client-Side-JS, keine Datenübertragung, keine Speicherung.
   Rechenmodell: siehe KONZEPT.md §7 — Formeln gegen Pauls echten
   CriticalPower-Report (CP≈274.5W, W'≈18732J bei 85kg,
   10s=1022W/2min=430W/5min=339W/12min=299W) verifiziert. */

(function () {
  'use strict';

  const form = document.getElementById('cp-form');
  if (!form) return; // Skript nur relevant auf cp-rechner.html

  const tabs            = document.querySelectorAll('.cp-tab');
  const sportIntroEl     = document.getElementById('cp-sport-intro');
  const weightField      = document.getElementById('cp-weight-field');
  const weightRow        = weightField.querySelector('.cp-weight-row');
  const weightInput      = document.getElementById('cp-weight');
  const weightError      = document.getElementById('cp-weight-error');
  const rowsContainer    = document.getElementById('cp-rows');
  const errorSummary     = document.getElementById('cp-error-summary');
  const resultsSection   = document.getElementById('cp-results');
  const resultsSub       = document.getElementById('cp-results-sub');
  const exportPdfBtn     = document.getElementById('cp-export-pdf');
  const tilesContainer   = document.getElementById('cp-tiles');
  const spectrumEl       = document.getElementById('cp-zone-spectrum');
  const spectrumEndEl    = document.getElementById('cp-zone-spectrum-end');
  const legendEl         = document.getElementById('cp-zone-legend');

  // Auto-Maske fuer alle Zeit-Felder (per Delegation, ueberlebt also auch das
  // Neu-Rendern der Zeilen beim Sportart-Wechsel): Ziffern -> "mm:ss".
  rowsContainer.addEventListener('input', (e) => {
    if (e.target.dataset.role !== 'time') return;
    const formatted = formatTimeDigits(e.target.value);
    e.target.value = formatted;
    e.target.setSelectionRange(formatted.length, formatted.length);
  });
  // Verlaesst man ein Zeit-Feld mit nur 1-2 eingetippten Ziffern (noch kein
  // Doppelpunkt gesetzt, z.B. Sprint-Feld "10" fuer 10 Sekunden), werden
  // diese als Sekunden interpretiert -> "0:10". Ohne das bliebe ein kurzer
  // Wert wie "10" ohne weitere Eingabe fuer immer ohne Doppelpunkt stehen.
  rowsContainer.addEventListener('focusout', (e) => {
    if (e.target.dataset.role !== 'time') return;
    const digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length <= 2) {
      e.target.value = '0:' + digits.padStart(2, '0');
    }
  });

  let currentSport = 'bike';
  let lastTilesData = []; // fuer PDF-Export: {label, value, sub, def}
  let lastZonesData = []; // fuer PDF-Export: {name, rangeLabel, pctLabel, bg}

  /* ── Sportart-Konfiguration ──────────────────────────────────── */
  const SPORT_INTRO = {
    bike: 'Vier All-Out-Efforts am Ergo-Bike — 10 Sekunden, 2, 5 und 12 Minuten.',
    run:  'Zwei Läufe — 1 und 3 Kilometer — plus ein optionaler Sprint.',
    row:  'Vier All-Out-Efforts am Rudergerät — 10 Sekunden, 2, 5 und 12 Minuten.',
    ski:  'Drei All-Out-Efforts am Skiergometer — 30 Sekunden, 2 und 5 Minuten.'
  };

  // Platzhalter je Sportart plausibel gehalten (Bike = Pauls echte Werte aus
  // dem CriticalPower-Report; Row/Ski = typische Concept2-Ergometer-Richtwerte
  // für einen trainierten Amateur, nur zur Orientierung beim Ausfüllen).
  function powerRows(placeholders) {
    return [
      { key: 'p10', label: '10 SEK', timePlaceholder: '0:10',  valueLabel: 'Leistung', valuePlaceholder: placeholders[0] + ' W', required: true },
      { key: 'p2',  label: '2 MIN',  timePlaceholder: '2:00',  valueLabel: 'Leistung', valuePlaceholder: placeholders[1] + ' W', required: true },
      { key: 'p5',  label: '5 MIN',  timePlaceholder: '5:00',  valueLabel: 'Leistung', valuePlaceholder: placeholders[2] + ' W', required: true },
      { key: 'p12', label: '12 MIN', timePlaceholder: '12:00', valueLabel: 'Leistung', valuePlaceholder: placeholders[3] + ' W', required: true }
    ];
  }

  const BIKE_ROWS = powerRows([1022, 430, 339, 299]); // Pauls echte Werte
  const ROWERG_ROWS = powerRows([750, 420, 360, 320]); // Concept2 RowErg, Richtwert

  // Skiergometer nutzt nur drei Stützpunkte (30 Sek/2 Min/5 Min) statt der
  // sonst üblichen vier — 12-Minuten-Tests sind am SkiErg unüblich.
  const SKIERG_ROWS = [
    { key: 'p30', label: '30 SEK', timePlaceholder: '0:30', valueLabel: 'Leistung', valuePlaceholder: '400 W', required: true },
    { key: 'p2',  label: '2 MIN',  timePlaceholder: '2:00', valueLabel: 'Leistung', valuePlaceholder: '320 W', required: true },
    { key: 'p5',  label: '5 MIN',  timePlaceholder: '5:00', valueLabel: 'Leistung', valuePlaceholder: '260 W', required: true }
  ]; // Concept2 SkiErg, Richtwerte

  const RUN_ROWS = [
    { key: 'sprint', label: 'SPRINT', timePlaceholder: '0:14',  valueLabel: 'Distanz', valuePlaceholder: '100 m (optional)', required: false },
    { key: 'd1',      label: '1 KM',   timePlaceholder: '3:45',  valueLabel: 'Distanz', valuePlaceholder: '1000 m',           required: true },
    { key: 'd3',      label: '3 KM',   timePlaceholder: '12:30', valueLabel: 'Distanz', valuePlaceholder: '3000 m',           required: true }
  ];

  const ROW_DEFS = { bike: BIKE_ROWS, run: RUN_ROWS, row: ROWERG_ROWS, ski: SKIERG_ROWS };

  /* ── Trainingszonen (%CP bzw. %CS-Bänder) ────────────────────────
     Quelle: Pauls CriticalPower-Report, mit Sportwissenschafts-
     Literatur gegengecheckt (TrainerRoad/Coggan-Zonenmodell: VO2max
     klassisch 106–120% CP, darüber "Anaerobic Capacity"). */
  const ZONES = [
    { name: 'EASY',           lo: 0,    hi: 0.50 },
    { name: 'LIT',             lo: 0.50, hi: 0.65 },
    { name: 'FATMAX',          lo: 0.65, hi: 0.75 },
    { name: 'ÜBERGANG',       lo: 0.75, hi: 0.85 },
    { name: 'SWEETSPOT',       lo: 0.85, hi: 0.95 },
    { name: 'CRITICAL POWER',  lo: 0.95, hi: 1.01 },
    { name: 'VO2MAX LANG',     lo: 1.01, hi: 1.09 },
    { name: 'VO2MAX MITTEL',   lo: 1.05, hi: 1.15 },
    { name: 'VO2MAX KURZ',     lo: 1.12, hi: 1.45 }
  ];

  /* ── Helfer ───────────────────────────────────────────────────── */
  function parseTime(str) {
    if (!str) return null;
    // ":" ist der Normalfall; "." und "," werden zur Sicherheit ebenfalls
    // akzeptiert (z.B. bei eingefügtem/eingetipptem Text ohne Auto-Maske).
    const m = String(str).trim().match(/^(\d{1,3})[:.,]([0-5]?\d)$/);
    if (!m) return null;
    const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return total > 0 ? total : null;
  }

  // Formatiert Zeit-Eingaben automatisch als "mm:ss" beim Tippen. Wichtig auf
  // Mobile: reine Ziffern-Tastaturen (inputmode="numeric") bieten auf vielen
  // Geraeten gar keine Satzzeichen-Taste an, der Doppelpunkt laesst sich also
  // nicht selbst eintippen. Nutzer:innen tippen daher einfach Ziffern
  // (z.B. "530" fuer 5:30), der Doppelpunkt wird automatisch eingefuegt.
  function formatTimeDigits(raw) {
    const digits = String(raw).replace(/\D/g, '').slice(0, 5);
    if (digits.length <= 2) return digits;
    return digits.slice(0, -2) + ':' + digits.slice(-2);
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return min + ':' + String(sec).padStart(2, '0');
  }

  function parseNumber(str) {
    if (str === null || str === undefined || String(str).trim() === '') return null;
    const cleaned = String(str).trim().replace(',', '.').match(/^-?\d+(\.\d+)?/);
    if (!cleaned) return null;
    const n = parseFloat(cleaned[0]);
    return Number.isFinite(n) ? n : null;
  }

  function round(n) { return Math.round(n); }

  function hexMix(h1, h2, t) {
    const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const [r1, g1, b1] = p(h1);
    const [r2, g2, b2] = p(h2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const toHex = (v) => v.toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  /* Lineare Regression (Excel SLOPE/INTERCEPT-Äquivalent) */
  function linreg(points) {
    const n = points.length;
    const xbar = points.reduce((s, p) => s + p.x, 0) / n;
    const ybar = points.reduce((s, p) => s + p.y, 0) / n;
    let num = 0, den = 0;
    points.forEach((p) => {
      num += (p.x - xbar) * (p.y - ybar);
      den += (p.x - xbar) * (p.x - xbar);
    });
    const slope = num / den;
    const intercept = ybar - slope * xbar;
    return { slope, intercept };
  }

  /* ── Formular-Rendering ──────────────────────────────────────── */
  function renderRows(sport) {
    rowsContainer.innerHTML = '';
    ROW_DEFS[sport].forEach((def) => {
      const row = document.createElement('div');
      row.className = 'cp-row';
      row.dataset.key = def.key;

      const labelCol = document.createElement('div');
      labelCol.className = 'cp-row-label';
      labelCol.textContent = def.label;

      const timeField = document.createElement('div');
      timeField.className = 'cp-field';
      timeField.innerHTML =
        '<label for="cp-' + def.key + '-time">Zeit (mm:ss)</label>' +
        '<input type="text" id="cp-' + def.key + '-time" inputmode="numeric" autocomplete="off" ' +
        'placeholder="' + def.timePlaceholder + '" data-role="time" />';

      const valueField = document.createElement('div');
      valueField.className = 'cp-field';
      valueField.innerHTML =
        '<label for="cp-' + def.key + '-value">' + def.valueLabel + '</label>' +
        '<input type="text" id="cp-' + def.key + '-value" inputmode="decimal" autocomplete="off" ' +
        'placeholder="' + def.valuePlaceholder + '" data-role="value" />';

      row.appendChild(labelCol);
      row.appendChild(timeField);
      row.appendChild(valueField);
      rowsContainer.appendChild(row);
    });
  }

  function switchSport(sport) {
    currentSport = sport;
    tabs.forEach((t) => {
      const active = t.dataset.sport === sport;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    sportIntroEl.textContent = SPORT_INTRO[sport];
    weightField.hidden = sport === 'run';
    renderRows(sport);
    resultsSection.hidden = true;
    hideErrorSummary();
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => switchSport(btn.dataset.sport));
  });

  /* ── Validierung & Ergebnis-Sammlung ─────────────────────────── */
  function showErrorSummary(messages) {
    errorSummary.innerHTML = messages.map((m) => '<p>' + m + '</p>').join('');
    errorSummary.hidden = false;
  }
  function hideErrorSummary() {
    errorSummary.hidden = true;
    errorSummary.innerHTML = '';
  }

  function collectPowerEfforts(errors) {
    const efforts = {};
    ROW_DEFS[currentSport].forEach((def) => {
      const timeInput  = document.getElementById('cp-' + def.key + '-time');
      const valueInput = document.getElementById('cp-' + def.key + '-value');
      timeInput.classList.remove('is-invalid');
      valueInput.classList.remove('is-invalid');

      const t = parseTime(timeInput.value);
      const p = parseNumber(valueInput.value);

      if (t === null || p === null || p <= 0) {
        timeInput.classList.add('is-invalid');
        valueInput.classList.add('is-invalid');
        errors.push('„' + def.label + '“: bitte Zeit (mm:ss) und Leistung (Watt) angeben.');
        return;
      }
      efforts[def.key] = { t, p };
    });
    return efforts;
  }

  function collectRunEfforts(errors) {
    const efforts = {};
    RUN_ROWS.forEach((def) => {
      const timeInput  = document.getElementById('cp-' + def.key + '-time');
      const valueInput = document.getElementById('cp-' + def.key + '-value');
      timeInput.classList.remove('is-invalid');
      valueInput.classList.remove('is-invalid');

      const rawTime  = timeInput.value.trim();
      const rawValue = valueInput.value.trim();
      const bothEmpty = rawTime === '' && rawValue === '';

      if (!def.required && bothEmpty) return; // Sprint optional, leer = ok

      const t = parseTime(rawTime);
      const d = parseNumber(rawValue);

      if (t === null || d === null || d <= 0) {
        timeInput.classList.add('is-invalid');
        valueInput.classList.add('is-invalid');
        errors.push(
          def.required
            ? '„' + def.label + '“: bitte Zeit (mm:ss) und Distanz (Meter) angeben.'
            : '„' + def.label + '“: bitte entweder Zeit UND Distanz angeben, oder beide leer lassen.'
        );
        return;
      }
      efforts[def.key] = { t, d };
    });
    return efforts;
  }

  function collectWeight(errors) {
    weightRow.classList.remove('is-invalid');
    weightError.textContent = '';
    const w = parseNumber(weightInput.value);
    if (w === null || w <= 0) {
      weightRow.classList.add('is-invalid');
      weightError.textContent = 'Bitte ein gültiges Körpergewicht eingeben.';
      errors.push('Bitte ein gültiges Körpergewicht eingeben.');
      return null;
    }
    return w;
  }

  /* ── Rechenkern ───────────────────────────────────────────────── */
  function computeBikeRow(weight, e, rows) {
    // Erste Zeile ist immer der kurze Sprint-Effort (Bike/Row: 10 Sek, Ski: 30 Sek),
    // die übrigen Zeilen (2/5/12 Min bzw. 2/5 Min) gehen in die CP-Regression ein.
    const sprintDef = rows[0];
    const points = rows.slice(1).map((def) => ({ x: 1 / e[def.key].t, y: e[def.key].p }));
    const { slope: wPrime, intercept: cp } = linreg(points);
    const map = cp + wPrime / 300; // 300s = 5min, feste Konstante lt. Excel-Modell
    const vo2max = (10.8 * map / weight + 7) * 1.0; // Einzelwert, Faktor 1.0
    return { cp, wPrime, map, vo2max, sprint: e[sprintDef.key].p, sprintLabel: sprintDef.label, weight };
  }

  function computeRun(e) {
    const speed1 = e.d1.d / e.d1.t;
    const speed3 = e.d3.d / e.d3.t;
    const points = [
      { x: 1 / e.d1.t, y: speed1 },
      { x: 1 / e.d3.t, y: speed3 }
    ];
    const { slope: dPrime, intercept: cs } = linreg(points);
    const paceSecPerKm = 1000 / cs;
    const sprintPaceSecPerKm = e.sprint ? 1000 / (e.sprint.d / e.sprint.t) : null;
    return { cs, dPrime, paceSecPerKm, sprintPaceSecPerKm };
  }

  /* ── Ergebnis-Rendering ──────────────────────────────────────── */
  function tileHTML(label, value, sub, def) {
    return (
      '<div class="result-tile">' +
      '<div class="result-tile-label">' + label + '</div>' +
      '<div class="result-tile-value">' + value + '</div>' +
      '<div class="result-tile-sub">' + sub + '</div>' +
      '<div class="result-tile-divider"></div>' +
      '<div class="result-tile-def">' + def + '</div>' +
      '</div>'
    );
  }

  function renderZones(baseValue, mode) {
    spectrumEl.innerHTML = '';
    legendEl.innerHTML = '';
    const zonesData = [];

    ZONES.forEach((z, i) => {
      const bg = hexMix('#f5f4f0', '#ffe55c', i / (ZONES.length - 1));
      let rangeLabel, pctLabel, segLabel;

      if (mode === 'power') {
        const lowW  = round(z.lo * baseValue);
        const highW = round(z.hi * baseValue);
        rangeLabel = z.lo === 0 ? '< ' + highW + ' W' : lowW + '–' + highW + ' W';
        segLabel   = z.lo === 0 ? '0' : String(lowW);
      } else {
        const fastPace = 1000 / (z.hi * baseValue);
        const slowPace = z.lo === 0 ? null : 1000 / (z.lo * baseValue);
        rangeLabel = z.lo === 0
          ? 'langsamer als ' + formatTime(fastPace) + '/km'
          : formatTime(fastPace) + '–' + formatTime(slowPace) + '/km';
        segLabel = z.lo === 0 ? '' : formatTime(slowPace);
      }
      pctLabel = z.lo === 0 ? '< ' + round(z.hi * 100) + ' %' : round(z.lo * 100) + '–' + round(z.hi * 100) + ' %';
      zonesData.push({ name: z.name, rangeLabel, pctLabel, bg });

      const seg = document.createElement('div');
      seg.className = 'zone-segment';
      seg.style.background = bg;
      seg.innerHTML = '<span class="zone-segment-label">' + segLabel + '</span>';
      spectrumEl.appendChild(seg);

      const item = document.createElement('div');
      item.className = 'zone-legend-item';
      item.innerHTML =
        '<div class="zone-legend-swatch" style="background:' + bg + ';"></div>' +
        '<div>' +
        '<div class="zone-legend-name">' + z.name + '</div>' +
        '<div class="zone-legend-range">' + rangeLabel + ' · ' + pctLabel + '</div>' +
        '</div>';
      legendEl.appendChild(item);
    });

    const topZone = ZONES[ZONES.length - 1];
    spectrumEndEl.textContent = mode === 'power'
      ? round(topZone.hi * baseValue) + ' W'
      : formatTime(1000 / (topZone.hi * baseValue)) + '/km';

    lastZonesData = zonesData;
  }

  function renderResultsBikeRow(res) {
    resultsSub.textContent = 'Deine Zahlen auf Basis deiner eingegebenen Zeitfahrten · ' + res.weight + ' kg Körpergewicht.';
    const tiles = [
      { label: 'CRITICAL POWER', value: round(res.cp) + ' W', sub: (res.cp / res.weight).toFixed(1) + ' W/KG', def: 'Deine theoretisch unbegrenzt haltbare Dauerleistungsgrenze.' },
      { label: "W' — ANAEROBE RESERVE", value: (res.wPrime / 1000).toFixed(1), sub: 'KILOJOULE', def: 'Dein Energie-Tank für Belastungen oberhalb der Critical Power.' },
      { label: 'MAP', value: round(res.map) + ' W', sub: (res.map / res.weight).toFixed(1) + ' W/KG', def: 'Die Leistung bei deiner höchsten Sauerstoffaufnahme.' },
      { label: 'VO2MAX (GESCHÄTZT)', value: res.vo2max.toFixed(1), sub: 'ML/MIN/KG', def: 'Das maximale Sauerstoff-Volumen, das dein Körper pro Minute verwertet.' },
      { label: 'SPRINT / MPO', value: round(res.sprint) + ' W', sub: (res.sprint / res.weight).toFixed(1) + ' W/KG', def: 'Deine maximale kurzzeitige Sprintleistung (' + res.sprintLabel.replace('SEK', 'Sekunden') + ').' }
    ];
    tilesContainer.innerHTML = tiles.map((t) => tileHTML(t.label, t.value, t.sub, t.def)).join('');
    lastTilesData = tiles;
    renderZones(res.cp, 'power');
  }

  function renderResultsRun(res) {
    resultsSub.textContent = 'Deine Zahlen auf Basis deiner eingegebenen Läufe.';
    const tiles = [
      { label: 'CRITICAL SPEED', value: formatTime(res.paceSecPerKm), sub: 'MIN/KM', def: 'Dein theoretisch unbegrenzt haltbares Tempo.' },
      { label: "D' — ANAEROBE RESERVE", value: round(res.dPrime), sub: 'METER', def: 'Dein Distanz-Puffer für Tempo oberhalb der Critical Speed.' }
    ];
    if (res.sprintPaceSecPerKm) {
      tiles.push({ label: 'SPRINT', value: formatTime(res.sprintPaceSecPerKm), sub: 'MIN/KM', def: 'Dein Tempo im maximalen Sprint.' });
    }
    tilesContainer.innerHTML = tiles.map((t) => tileHTML(t.label, t.value, t.sub, t.def)).join('');
    lastTilesData = tiles;
    renderZones(res.cs, 'pace');
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideErrorSummary();

    const errors = [];
    let results;

    if (currentSport === 'run') {
      const efforts = collectRunEfforts(errors);
      if (errors.length === 0) results = computeRun(efforts);
      if (errors.length === 0 && results) renderResultsRun(results);
    } else {
      const weight = collectWeight(errors);
      const efforts = collectPowerEfforts(errors);
      if (errors.length === 0) results = computeBikeRow(weight, efforts, ROW_DEFS[currentSport]);
      if (errors.length === 0 && results) renderResultsBikeRow(results);
    }

    if (errors.length > 0) {
      showErrorSummary(errors);
      return;
    }

    resultsSection.hidden = false;
    resultsSection.classList.add('is-visible');

    const offset = document.getElementById('site-header').offsetHeight;
    const top = resultsSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  /* ── PDF-Export ──────────────────────────────────────────────────
     Wird als eigenständige Datei per jsPDF gebaut statt über den
     Browser-Druckdialog: der lässt sich nicht von der Seite aus davon
     abhalten, seine eigene Kopf-/Fußzeile (Datum, Titel, URL,
     Seitenzahl) einzublenden, und die Seitenumbrüche mitten in den
     Kacheln/Zonen lassen sich darüber nicht kontrollieren. */
  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  function generatePdf() {
    if (!window.jspdf) {
      alert('PDF-Export ist gerade nicht verfügbar. Bitte Seite neu laden und erneut versuchen.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const marginBottom = 18;
    const contentW = doc.internal.pageSize.getWidth() - marginX * 2;
    const BLACK = [10, 10, 10], WHITE = [245, 244, 240], ACCENT = [255, 229, 92], GRAY = [120, 120, 120];
    let y = 18;

    function ensureSpace(h) {
      if (y + h > pageH - marginBottom) { doc.addPage(); y = 18; }
    }

    // Datum ganz oben — unabhängig vom Browser garantiert erste Zeile im Dokument.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('ERSTELLT AM ' + new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '  ·  SCHWELLENSCHMOPS.AT/CP-RECHNER', marginX, y);
    y += 11;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('DEIN ERGEBNIS', marginX, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor.apply(doc, BLACK);
    doc.text('DEINE ZAHLEN.', marginX, y);
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, GRAY);
    const subLines = doc.splitTextToSize(resultsSub.textContent, contentW);
    doc.text(subLines, marginX, y);
    y += subLines.length * 5 + 8;

    // Ergebnis-Kacheln, 2 Spalten
    const gap = 6;
    const tileW = (contentW - gap) / 2;
    const tileH = 32;
    lastTilesData.forEach((t, i) => {
      const col = i % 2;
      if (col === 0) ensureSpace(tileH + gap);
      const x = marginX + col * (tileW + gap);

      doc.setFillColor.apply(doc, BLACK);
      doc.rect(x, y, tileW, tileH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(t.label, x + 5, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor.apply(doc, ACCENT);
      doc.text(String(t.value), x + 5, y + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(t.sub, x + 5, y + 21);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor.apply(doc, WHITE);
      const defLines = doc.splitTextToSize(t.def, tileW - 10).slice(0, 2);
      doc.text(defLines, x + 5, y + 26);

      if (col === 1 || i === lastTilesData.length - 1) y += tileH + gap;
    });
    y += 4;

    // Trainingszonen
    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('DEINE TRAININGSZONEN', marginX, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor.apply(doc, BLACK);
    doc.text('VON EASY BIS VO2MAX.', marginX, y);
    y += 11;

    lastZonesData.forEach((z) => {
      ensureSpace(9);
      doc.setFillColor.apply(doc, hexToRgb(z.bg));
      doc.setDrawColor(200, 200, 200);
      doc.rect(marginX, y - 3.6, 4.5, 4.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(z.name, marginX + 8, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(z.rangeLabel + ' · ' + z.pctLabel, marginX + 8, y + 4.6);

      y += 11;
    });

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save('CP-Rechner_' + currentSport + '_' + stamp + '.pdf');
  }

  exportPdfBtn.addEventListener('click', generatePdf);

  /* ── Init ────────────────────────────────────────────────────── */
  switchSport('bike');
})();
