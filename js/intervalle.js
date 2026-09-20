/* SCHWELLENSCHMOPS — intervalle.js
   Intervallrechner (Bike / Row / Run / Ski).
   Leitet aus einem bekannten Schwellenwert (Critical Power in Watt bzw.
   Critical Speed als Pace) konkrete Intervallformate je Trainingszone ab.
   Zonen-Prozentbänder 1:1 aus js/cp-rechner.js (ZONES) übernommen, damit
   Diagnostik und Trainingsvorgabe konsistent bleiben. Pausen-/Reps-Logik
   ist recherchiert (siehe Kommentare bei INTERVAL_ZONES), nicht geraten.
   Reines Client-Side-JS, keine Datenübertragung, keine Speicherung. */

(function () {
  'use strict';

  const form = document.getElementById('int-form');
  if (!form) return; // Skript nur relevant auf intervalle.html

  const tabs          = document.querySelectorAll('.cp-tab');
  const sportIntroEl  = document.getElementById('int-sport-intro');
  const valueLabel    = document.getElementById('int-value-label');
  const valueUnit     = document.getElementById('int-value-unit');
  const valueInput    = document.getElementById('int-value');
  const valueRow      = document.getElementById('int-value-row');
  const valueError    = document.getElementById('int-value-error');
  const errorSummary  = document.getElementById('int-error-summary');
  const resultsSection = document.getElementById('int-results');
  const resultsSub    = document.getElementById('int-results-sub');
  const zoneListEl    = document.getElementById('int-zone-list');
  const exportPdfBtn  = document.getElementById('int-export-pdf');

  let currentSport = 'bike';
  let lastCardsData = []; // fuer PDF-Export

  /* ── Sportart-Konfiguration ──────────────────────────────────────
     mode 'power' = Bike/Row/Ski (Watt), 'pace' = Run (mm:ss/km).
     Row/Ski zeigen zusaetzlich die Concept2-Pace/500m je Zone. */
  const SPORT_CONFIG = {
    bike: { mode: 'power', label: 'Critical Power', unit: 'W', placeholder: '274', intro: 'Trag deine Critical Power aus dem CP-Rechner ein — oder klick dich direkt von dort herüber.' },
    row:  { mode: 'power', label: 'Critical Power', unit: 'W', placeholder: '230', intro: 'Trag deine Critical Power aus dem CP-Rechner ein — oder klick dich direkt von dort herüber.' },
    ski:  { mode: 'power', label: 'Critical Power', unit: 'W', placeholder: '220', intro: 'Trag deine Critical Power aus dem CP-Rechner ein — oder klick dich direkt von dort herüber.' },
    run:  { mode: 'pace',  label: 'Critical Speed (Pace)', unit: 'MIN/KM', placeholder: '4:32', intro: 'Trag deine Critical-Speed-Pace aus dem CP-Rechner ein — oder klick dich direkt von dort herüber.' }
  };

  /* ── Zonen-Konfiguration ──────────────────────────────────────────
     lo/hi 1:1 aus ZONES in js/cp-rechner.js (EASY/LIT/FATMAX/ÜBERGANG
     bleiben Dauerbelastung, keine Intervalle, daher hier nicht dabei).

     Pausen-Logik pro Zonencharakter, recherchiert statt pauschal:
     - Sweetspot/Schwelle: fixe kurze Pause unabhängig von der
       Wiederholungsdauer ("Zeit im Bereich sammeln" statt Erholung).
     - VO2max Lang/Mittel (2-5 min): 1:1-Verhältnis (Pause ≈ Arbeitszeit)
       ist über mehrere Quellen hinweg der Konsens (Laursen & Buchheit;
       2024-Metaanalyse zu Work:Rest-Verhältnissen).
     - VO2max Kurz (<60-90s): zwei Untervarianten, weil die Literatur
       hier einen echten Zielkonflikt zeigt — kurze Pause (2:1)
       maximiert nachweislich die Zeit bei VO2max, lange Pause erhält
       Tempoqualität/Technik (Pauls bisherige Excel-SPEED-Kategorie).
     Quellen: scientifictriathlon.com/tts139 (Laursen & Buchheit),
     runnersconnect.net/vo2-max-workout-rest-intervals.

     restPace: Pausenintensität als %CP/%CS-Band — aktive Erholung
     schlägt passive nachweislich; empfohlen 50-70% der Maximal-
     geschwindigkeit bzw. 60-80% der Schwellenintensität, deckt sich
     mit den bestehenden Zonen EASY (0-50%) / LIT (50-65%). */
  const INTERVAL_ZONES = [
    {
      key: 'sweetspot', name: 'SWEETSPOT', lo: 0.85, hi: 0.95,
      workLo: 480, workHi: 900, // 8-15 min
      rest: { type: 'fixed', lo: 180, hi: 300 }, // 3-5 min
      restPaceLo: 0.45, restPaceHi: 0.65, restPaceLabel: 'LOCKER (EASY–LIT)',
      repsLo: 2, repsHi: 4
    },
    {
      key: 'threshold', name: 'SCHWELLE (CRITICAL POWER)', lo: 0.95, hi: 1.01,
      workLo: 360, workHi: 720, // 6-12 min
      rest: { type: 'fixed', lo: 120, hi: 240 }, // 2-4 min
      restPaceLo: 0.45, restPaceHi: 0.65, restPaceLabel: 'LOCKER (EASY–LIT)',
      repsLo: 3, repsHi: 5
    },
    {
      key: 'vo2max-lang', name: 'VO2MAX LANG', lo: 1.01, hi: 1.09,
      workLo: 180, workHi: 300, // 3-5 min
      rest: { type: 'ratio', ratio: 1.0 }, // ≈ Arbeitszeit
      restPaceLo: 0.5, restPaceHi: 0.65, restPaceLabel: 'AKTIV (LIT)',
      repsLo: 4, repsHi: 6
    },
    {
      key: 'vo2max-mittel', name: 'VO2MAX MITTEL', lo: 1.05, hi: 1.15,
      workLo: 120, workHi: 180, // 2-3 min
      rest: { type: 'ratio', ratio: 1.0 },
      restPaceLo: 0.5, restPaceHi: 0.65, restPaceLabel: 'AKTIV (LIT)',
      repsLo: 5, repsHi: 8
    },
    {
      key: 'vo2max-kurz-a', name: 'VO2MAX KURZ — VO2MAX-FOKUSSIERT', lo: 1.12, hi: 1.45,
      workLo: 30, workHi: 60,
      rest: { type: 'ratio', ratio: 0.5 }, // 2:1 Arbeit:Pause
      restPaceLo: 0.5, restPaceHi: 0.65, restPaceLabel: 'AKTIV (LIT)',
      repsLo: 10, repsHi: 15,
      note: 'Kurze Pause hält die Sauerstoffaufnahme oben — mehr Zeit bei VO2max in derselben Session.'
    },
    {
      key: 'vo2max-kurz-b', name: 'VO2MAX KURZ — SPEED-FOKUSSIERT', lo: 1.12, hi: 1.45,
      workLo: 30, workHi: 90,
      rest: { type: 'ratio', ratio: 1.75 }, // 1,5-2x Arbeitszeit
      restPaceLo: 0.3, restPaceHi: 0.5, restPaceLabel: 'LOCKER/STEHEND (EASY)',
      repsLo: 6, repsHi: 10,
      note: 'Großzügige Pause erhält Tempoqualität und Technik bei voller Frische.'
    }
  ];

  /* ── Helfer (analog cp-rechner.js) ───────────────────────────────── */
  function parseTime(str) {
    if (!str) return null;
    const m = String(str).trim().match(/^(\d{1,3})[:.,]([0-5]?\d)$/);
    if (!m) return null;
    const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return total > 0 ? total : null;
  }

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

  // Rundet eine Laufdistanz auf 50m, mit 25m-Schritten unter 300m fuer
  // kurze Reps (sonst wirken z.B. 30-Sekunden-Reps unnoetig grob gerundet).
  function roundDistance(m) {
    const step = m < 300 ? 25 : 50;
    return Math.round(m / step) * step;
  }

  /* ── Formular ─────────────────────────────────────────────────── */
  function switchSport(sport) {
    currentSport = sport;
    tabs.forEach((t) => {
      const active = t.dataset.sport === sport;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    const cfg = SPORT_CONFIG[sport];
    sportIntroEl.textContent = cfg.intro;
    valueLabel.textContent = cfg.label;
    valueUnit.textContent = cfg.unit;
    valueInput.placeholder = cfg.placeholder;
    resultsSection.hidden = true;
    hideErrorSummary();
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => switchSport(btn.dataset.sport));
  });

  // Zeit-Eingabe (Run-Pace) automatisch als "mm:ss" maskieren.
  valueInput.addEventListener('input', () => {
    if (SPORT_CONFIG[currentSport].mode !== 'pace') return;
    const formatted = formatTimeDigits(valueInput.value);
    valueInput.value = formatted;
    valueInput.setSelectionRange(formatted.length, formatted.length);
  });
  valueInput.addEventListener('focusout', () => {
    if (SPORT_CONFIG[currentSport].mode !== 'pace') return;
    const digits = valueInput.value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length <= 2) {
      valueInput.value = '0:' + digits.padStart(2, '0');
    }
  });

  function showErrorSummary(messages) {
    errorSummary.innerHTML = messages.map((m) => '<p>' + m + '</p>').join('');
    errorSummary.hidden = false;
  }
  function hideErrorSummary() {
    errorSummary.hidden = true;
    errorSummary.innerHTML = '';
  }

  function collectValue(errors) {
    valueRow.classList.remove('is-invalid');
    valueError.textContent = '';
    const cfg = SPORT_CONFIG[currentSport];
    const raw = valueInput.value.trim();

    if (cfg.mode === 'pace') {
      const t = parseTime(raw);
      if (t === null) {
        valueRow.classList.add('is-invalid');
        valueError.textContent = 'Bitte deine Critical-Speed-Pace als mm:ss eingeben.';
        errors.push('Bitte deine Critical-Speed-Pace als mm:ss eingeben.');
        return null;
      }
      return t; // Sekunden pro Kilometer
    }

    const n = parseNumber(raw);
    if (n === null || n <= 0) {
      valueRow.classList.add('is-invalid');
      valueError.textContent = 'Bitte einen gültigen Watt-Wert eingeben.';
      errors.push('Bitte einen gültigen Watt-Wert eingeben.');
      return null;
    }
    return n; // Watt
  }

  /* ── Rendering ────────────────────────────────────────────────── */
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

  // Zwei konkrete Formate je Zone statt einer abstrakten Range — mehr
  // kürzere Wiederholungen (repsHi bei workLo) und weniger längere
  // (repsLo bei workHi), decken dieselbe Zonen-Bandbreite ab, sind aber
  // direkt umsetzbar (z.B. "8× 400m @ 4:15/km, Pause 2:00 @ 5:30/km"),
  // analog zu Pauls bisherigem Excel-Aufbau (mehrere konkrete Distanz-
  // Zeilen je Kategorie statt einer einzigen Bandbreite).
  function buildFormats(zone, baseValue, mode) {
    const targetPct = (zone.lo + zone.hi) / 2;
    const restPct = (zone.restPaceLo + zone.restPaceHi) / 2;
    const variants = [
      { workSec: zone.workLo, reps: zone.repsHi },
      { workSec: zone.workHi, reps: zone.repsLo }
    ];

    return variants.map((v) => {
      const restSec = zone.rest.type === 'fixed'
        ? (zone.rest.lo + zone.rest.hi) / 2
        : v.workSec * zone.rest.ratio;

      if (mode === 'power') {
        const onW = round(baseValue * targetPct);
        const offW = round(baseValue * restPct);
        return {
          line: v.reps + '× ' + formatTime(v.workSec) + ' @ ' + onW + ' W',
          restLine: 'Pause ' + formatTime(restSec) + ' @ ' + offW + ' W'
        };
      }

      const onPaceSec = baseValue / targetPct;
      const offPaceSec = baseValue / restPct;
      const distance = roundDistance((1000 / onPaceSec) * v.workSec);
      return {
        line: v.reps + '× ' + distance + ' m (' + formatTime(v.workSec) + ') @ ' + formatTime(onPaceSec) + '/km',
        restLine: 'Pause ' + formatTime(restSec) + ' @ ' + formatTime(offPaceSec) + '/km'
      };
    });
  }

  function buildCard(zone, baseValue, mode, bg) {
    return {
      key: zone.key,
      name: zone.name,
      bg,
      formats: buildFormats(zone, baseValue, mode),
      note: zone.note || null
    };
  }

  // Schlichte Tabelle statt breiter Kästchen mit viel Leerraum (Paul-
  // Feedback 2026-09-20) — wiederverwendet .cp-protocol-table/-row vom
  // CP-Rechner-Testprotokoll. Farbiger linker Rand pro Zone (statt großer
  // Farbfläche) hält die Zonen trotzdem auf einen Blick unterscheidbar.
  function rowsHTML(card) {
    const style = 'border-left: 4px solid ' + card.bg + ';';
    const rows = card.formats.map((f, i) => {
      const groupClass = i === 0 ? ' interval-row--group-start' : '';
      const labelCell = i === 0 ? '<div class="cp-protocol-label">' + card.name + '</div>' : '<div></div>';
      return '<div class="cp-protocol-row' + groupClass + '" style="' + style + '">' + labelCell + '<div>' + f.line + '</div><div>' + f.restLine + '</div></div>';
    });
    if (card.note) {
      rows.push('<div class="cp-protocol-row interval-note-row" style="' + style + '"><div></div><div class="interval-zone-note">' + card.note + '</div></div>');
    }
    return rows.join('');
  }

  function renderResults(baseValue) {
    const cfg = SPORT_CONFIG[currentSport];
    resultsSub.textContent = cfg.mode === 'power'
      ? 'Deine Intervallformate auf Basis von ' + round(baseValue) + ' W Critical Power.'
      : 'Deine Intervallformate auf Basis von ' + formatTime(baseValue) + '/km Critical Speed.';

    const cards = INTERVAL_ZONES.map((zone, i) => {
      const bg = hexMix('#f5f4f0', '#ffe55c', i / (INTERVAL_ZONES.length - 1));
      return buildCard(zone, baseValue, cfg.mode, bg);
    });

    const head = '<div class="cp-protocol-row cp-protocol-row-head"><div>ZONE</div><div>FORMAT</div><div>PAUSE</div></div>';
    zoneListEl.innerHTML = head + cards.map((c) => rowsHTML(c)).join('');
    lastCardsData = cards;

    resultsSection.hidden = false;
    resultsSection.classList.add('is-visible');

    const offset = document.getElementById('site-header').offsetHeight;
    const top = resultsSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /* ── Submit ───────────────────────────────────────────────────── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideErrorSummary();
    const errors = [];
    const value = collectValue(errors);
    if (errors.length > 0) {
      showErrorSummary(errors);
      return;
    }
    renderResults(value);
  });

  /* ── Handoff aus dem CP-Rechner (?sport=bike&value=274) ──────────── */
  function applyHandoff() {
    const params = new URLSearchParams(window.location.search);
    const sport = params.get('sport');
    const value = params.get('value');
    if (sport && SPORT_CONFIG[sport]) switchSport(sport);
    if (value) {
      valueInput.value = value;
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  /* ── PDF-Export ─────────────────────────────────────────────────── */
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
    const BLACK = [10, 10, 10], GRAY = [120, 120, 120];
    const colZone = marginX + 6, colFormat = marginX + 62, colPause = marginX + 122;
    let y = 18;

    function hexToRgb(hex) {
      return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    }

    // Tabellenkopf wird nach jedem Seitenumbruch neu gezeichnet, damit eine
    // fortgesetzte Tabelle auf Folgeseiten weiter als Tabelle lesbar bleibt.
    function drawTableHead() {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, GRAY);
      doc.text('ZONE', colZone, y);
      doc.text('FORMAT', colFormat, y);
      doc.text('PAUSE', colPause, y);
      y += 3;
      doc.setDrawColor.apply(doc, BLACK);
      doc.setLineWidth(0.5);
      doc.line(marginX, y, marginX + contentW, y);
      y += 7;
    }

    // h = benötigte Höhe der GESAMTEN Zonen-Gruppe (beide Formate + Notiz),
    // nie nur einer einzelnen Zeile — sonst könnte der Umbruch mitten in
    // einer Zone landen. Bricht die Seite, wird die Kopfzeile neu gezeichnet.
    function ensureSpace(h) {
      if (y + h > pageH - marginBottom) {
        doc.addPage();
        y = 18;
        drawTableHead();
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('ERSTELLT AM ' + new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '  ·  SCHWELLENSCHMOPS.AT/INTERVALLE', marginX, y);
    y += 11;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('DEINE INTERVALLFORMATE', marginX, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor.apply(doc, BLACK);
    doc.text('DEIN TRAINING.', marginX, y);
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, GRAY);
    const subLines = doc.splitTextToSize(resultsSub.textContent, contentW);
    doc.text(subLines, marginX, y);
    y += subLines.length * 5 + 8;

    // Tabelle statt Kästchen — spiegelt die Bildschirmdarstellung
    // (.cp-protocol-table). Farbiger linker Tick pro Zonen-Gruppe statt
    // Farbfläche, dickere Trennlinie zwischen Zonen-Gruppen.
    drawTableHead();

    lastCardsData.forEach((card) => {
      // Lange Zonennamen ("VO2MAX KURZ — VO2MAX-FOKUSSIERT") brechen bei
      // splitTextToSize sonst mitten im Wort um -- am " — " manuell in zwei
      // Zeilen teilen, jede für sich schmal genug für die Spalte.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const nameParts = card.name.split(' — ');
      const nameLines = nameParts.length === 2
        ? doc.splitTextToSize(nameParts[0], 46).concat(doc.splitTextToSize('— ' + nameParts[1], 46))
        : doc.splitTextToSize(card.name, 46);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      const noteLines = card.note ? doc.splitTextToSize(card.note, contentW - 46) : [];

      const row0H = Math.max(nameLines.length * 4.2, 5) + 4;
      const row1H = 9;
      const noteH = noteLines.length ? noteLines.length * 3.8 + 4 : 0;
      const groupH = row0H + row1H + noteH;
      ensureSpace(groupH + 6);

      const groupTop = y;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(nameLines, colZone, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(card.formats[0].line, colFormat, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(card.formats[0].restLine, colPause, y + 4);

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(marginX, y + row0H, marginX + contentW, y + row0H);
      y += row0H;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(card.formats[1].line, colFormat, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(card.formats[1].restLine, colPause, y + 4);
      y += row1H;

      if (noteLines.length) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, GRAY);
        doc.text(noteLines, colFormat, y + 3);
        y += noteH;
      }

      doc.setFillColor.apply(doc, hexToRgb(card.bg));
      doc.rect(marginX, groupTop, 1.5, y - groupTop, 'F');

      doc.setDrawColor.apply(doc, BLACK);
      doc.setLineWidth(0.5);
      doc.line(marginX, y, marginX + contentW, y);
      y += 7;
    });

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save('Intervalle_' + currentSport + '_' + stamp + '.pdf');
  }

  exportPdfBtn.addEventListener('click', generatePdf);

  /* ── Init ─────────────────────────────────────────────────────── */
  switchSport('bike');
  applyHandoff();
})();
