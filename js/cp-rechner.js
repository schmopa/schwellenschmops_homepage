/* SCHWELLENSCHMOPS — cp-rechner.js
   Critical-Power-/Critical-Speed-Rechner (Bike / Row / Run).
   Reines Client-Side-JS, keine Datenübertragung, keine Speicherung.
   Rechenmodell: siehe KONZEPT.md §7 — Formeln gegen Pauls echten
   CriticalPower-Report (CP≈274.5W, W'≈18732J bei 85kg,
   10s=1022W/2min=430W/5min=339W/12min=299W) verifiziert.
   Geteilte Helfer (parseTime/formatTime/hexMix/…) liegen in
   js/rechner-utils.js, das PDF-Pagination-Gerüst in js/pdf-utils.js. */

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
  const dragFactorField  = document.getElementById('cp-dragfactor-field');
  const dragFactorRow    = dragFactorField.querySelector('.cp-weight-row');
  const dragFactorInput  = document.getElementById('cp-dragfactor');
  const dragFactorError  = document.getElementById('cp-dragfactor-error');
  const genderField      = document.getElementById('cp-gender-field');
  const genderBtns       = document.querySelectorAll('.cp-gender-btn');
  const cycleField       = document.getElementById('cp-cycle-field');
  const cycleSelect      = document.getElementById('cp-cycle');
  const rowsContainer    = document.getElementById('cp-rows');
  const errorSummary     = document.getElementById('cp-error-summary');
  const resultsSection   = document.getElementById('cp-results');
  const resultsSub       = document.getElementById('cp-results-sub');
  const exportPdfBtn     = document.getElementById('cp-export-pdf');
  const tilesContainer   = document.getElementById('cp-tiles');
  const spectrumEl       = document.getElementById('cp-zone-spectrum');
  const spectrumEndEl    = document.getElementById('cp-zone-spectrum-end');
  const legendEl         = document.getElementById('cp-zone-legend');
  const protocolSection  = document.getElementById('cp-protocol');
  const protocolMeta     = document.getElementById('cp-protocol-meta');
  const protocolTable    = document.getElementById('cp-protocol-table');
  const intervalleCta    = document.getElementById('cp-intervalle-cta');

  // Handoff zum Intervallrechner: CP (Watt) bzw. CS (Pace) direkt als
  // URL-Parameter mitgeben, damit dort nichts erneut eingetippt werden muss.
  function updateIntervalleCta(sport, value) {
    if (!intervalleCta) return;
    intervalleCta.href = 'intervalle.html?sport=' + encodeURIComponent(sport) + '&value=' + encodeURIComponent(value);
  }

  const CYCLE_LABELS = {
    menstruation: 'Menstruation',
    erste_haelfte: 'Erste Zyklushälfte',
    zweite_haelfte: 'Zweite Zyklushälfte'
  };

  // Auto-Maske fuer alle Zeit-Felder (per Delegation, ueberlebt also auch das
  // Neu-Rendern der Zeilen beim Sportart-Wechsel): Ziffern -> "mm:ss".
  rowsContainer.addEventListener('input', (e) => {
    if (e.target.dataset.role !== 'time') return;
    const formatted = RechnerUtils.formatTimeDigits(e.target.value);
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
  let currentGender = 'm';
  let lastTilesData = []; // fuer PDF-Export: {label, value, sub, def}
  let lastZonesData = []; // fuer PDF-Export: {name, rangeLabel, pctLabel, bg}
  let lastProtocolRows = []; // fuer PDF-Export: {label, lacLabel, hrLabel}

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

  // Row/SkiErg: der kurze Sprint-Effort fließt (wie beim Bike) ohnehin nicht in
  // die CP-Regression ein, nur die 2/5(/12)-Minuten-Punkte tun das — anders als
  // beim Bike ist er hier deshalb bewusst optional (required: false).
  const ROWERG_ROWS = powerRows([750, 420, 360, 320]); // Concept2 RowErg, Richtwert
  ROWERG_ROWS[0].required = false;

  // Skiergometer nutzt nur drei Stützpunkte (30 Sek/2 Min/5 Min) statt der
  // sonst üblichen vier — 12-Minuten-Tests sind am SkiErg unüblich.
  const SKIERG_ROWS = [
    { key: 'p30', label: '30 SEK', timePlaceholder: '0:30', valueLabel: 'Leistung', valuePlaceholder: '400 W', required: false },
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
      const isOptional = def.required === false;
      const row = document.createElement('div');
      row.className = 'cp-row' + (isOptional ? ' cp-row--optional' : '');
      row.dataset.key = def.key;

      const labelCol = document.createElement('div');
      labelCol.className = 'cp-row-label';
      labelCol.textContent = def.label;
      if (isOptional) {
        const tag = document.createElement('span');
        tag.className = 'cp-row-optional-tag';
        tag.textContent = 'optional';
        labelCol.appendChild(tag);
      }

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

      // Laktat/Ø-Herzfrequenz je Zeitfahren — rein informativ zum Dokumentieren
      // des Testprotokolls, fließt in keine Formel ein, daher immer optional.
      const extraField = document.createElement('div');
      extraField.className = 'cp-row-extra';
      extraField.innerHTML =
        '<div></div>' +
        '<div class="cp-field"><label for="cp-' + def.key + '-lac">Laktat (optional)</label>' +
        '<input type="text" id="cp-' + def.key + '-lac" inputmode="decimal" autocomplete="off" ' +
        'placeholder="mmol/l" data-role="lac" /></div>' +
        '<div class="cp-field"><label for="cp-' + def.key + '-hr">Ø Herzfrequenz (optional)</label>' +
        '<input type="text" id="cp-' + def.key + '-hr" inputmode="numeric" autocomplete="off" ' +
        'placeholder="bpm" data-role="hr" /></div>';

      row.appendChild(labelCol);
      row.appendChild(timeField);
      row.appendChild(valueField);
      row.appendChild(extraField);
      rowsContainer.appendChild(row);
    });
  }

  function updateCycleVisibility() {
    // Geschlecht fließt jetzt bei jeder Sportart in eine VO2max-Schätzung ein
    // (Bike/Run direkt, Row/Ski dokumentarisch) — Zyklusphase daher überall
    // sichtbar, sobald "weiblich" gewählt ist.
    cycleField.hidden = currentGender !== 'w';
  }

  function switchSport(sport) {
    currentSport = sport;
    tabs.forEach((t) => {
      const active = t.dataset.sport === sport;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    sportIntroEl.textContent = SPORT_INTRO[sport];
    const isRun = sport === 'run';
    // Gewicht wird nur bei Bike/Row/Ski gebraucht (Watt/kg, VO2max-Formel).
    // Die Lauf-VO2max-Formel (ACSM) rechnet direkt mit der Geschwindigkeit
    // und ist bereits pro kg normiert — kein Körpergewicht nötig. Geschlecht
    // fließt dagegen bei allen Sportarten in die jeweilige VO2max-Schätzung
    // ein (bei Row/Ski rein dokumentarisch, siehe renderResultsBikeRow).
    weightField.hidden = isRun;
    genderField.hidden = false;
    dragFactorField.hidden = isRun || sport === 'bike';
    updateCycleVisibility();
    renderRows(sport);
    resultsSection.hidden = true;
    RechnerUtils.hideErrorSummary(errorSummary);
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => switchSport(btn.dataset.sport));
  });

  genderBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentGender = btn.dataset.gender;
      genderBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-checked', String(active));
      });
      updateCycleVisibility();
    });
  });

  /* ── Validierung & Ergebnis-Sammlung ─────────────────────────── */
  function collectPowerEfforts(errors) {
    const efforts = {};
    ROW_DEFS[currentSport].forEach((def) => {
      const timeInput  = document.getElementById('cp-' + def.key + '-time');
      const valueInput = document.getElementById('cp-' + def.key + '-value');
      timeInput.classList.remove('is-invalid');
      valueInput.classList.remove('is-invalid');

      const rawTime  = timeInput.value.trim();
      const rawValue = valueInput.value.trim();
      const bothEmpty = rawTime === '' && rawValue === '';

      if (def.required === false && bothEmpty) return; // Sprint optional, leer = ok

      const t = RechnerUtils.parseTime(rawTime);
      const p = RechnerUtils.parseNumber(rawValue);

      if (t === null || p === null || p <= 0) {
        timeInput.classList.add('is-invalid');
        valueInput.classList.add('is-invalid');
        errors.push(
          def.required === false
            ? '„' + def.label + '“: bitte entweder Zeit UND Leistung angeben, oder beide leer lassen.'
            : '„' + def.label + '“: bitte Zeit (mm:ss) und Leistung (Watt) angeben.'
        );
        return;
      }
      efforts[def.key] = { t, p };
    });
    return efforts;
  }

  function collectExtras(rows, efforts, errors) {
    const extras = {};
    rows.forEach((def) => {
      if (!efforts[def.key]) return; // ohne Zeitfahren keine sinnvolle Laktat/HF-Zuordnung
      const lacInput = document.getElementById('cp-' + def.key + '-lac');
      const hrInput  = document.getElementById('cp-' + def.key + '-hr');
      lacInput.classList.remove('is-invalid');
      hrInput.classList.remove('is-invalid');

      const rawLac = lacInput.value.trim();
      const rawHr  = hrInput.value.trim();
      let lac = null, hr = null;

      if (rawLac !== '') {
        lac = RechnerUtils.parseNumber(rawLac);
        if (lac === null || lac <= 0) {
          lacInput.classList.add('is-invalid');
          errors.push('„' + def.label + '“: Laktat bitte als Zahl (mmol/l) angeben oder leer lassen.');
        }
      }
      if (rawHr !== '') {
        hr = RechnerUtils.parseNumber(rawHr);
        if (hr === null || hr <= 0) {
          hrInput.classList.add('is-invalid');
          errors.push('„' + def.label + '“: Ø Herzfrequenz bitte als Zahl (bpm) angeben oder leer lassen.');
        }
      }
      if (lac !== null || hr !== null) extras[def.key] = { lac, hr };
    });
    return extras;
  }

  function collectDragFactor(errors) {
    dragFactorRow.classList.remove('is-invalid');
    dragFactorError.textContent = '';
    const raw = dragFactorInput.value.trim();
    if (raw === '') return null; // optional
    const df = RechnerUtils.parseNumber(raw);
    if (df === null || df <= 0) {
      dragFactorRow.classList.add('is-invalid');
      dragFactorError.textContent = 'Bitte einen gültigen Drag-Factor-Wert eingeben oder leer lassen.';
      errors.push('Bitte einen gültigen Drag-Factor-Wert eingeben oder leer lassen.');
      return null;
    }
    return df;
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

      const t = RechnerUtils.parseTime(rawTime);
      const d = RechnerUtils.parseNumber(rawValue);

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
    const w = RechnerUtils.parseNumber(weightInput.value);
    if (w === null || w <= 0) {
      weightRow.classList.add('is-invalid');
      weightError.textContent = 'Bitte ein gültiges Körpergewicht eingeben.';
      errors.push('Bitte ein gültiges Körpergewicht eingeben.');
      return null;
    }
    return w;
  }

  /* ── Rechenkern ───────────────────────────────────────────────── */
  // Geschlechtsspezifischer VO2max-Faktor aus Pauls Excel-Sheet (Formel-Zellen
  // F41/G41: ×0.96 und ×1.04, ohne Beschriftung welcher Wert für wen gilt).
  // Zuordnung hier per Recherche in der Sportphysiologie-Literatur bestätigt:
  // bei gleicher relativer Leistung liegt der VO2max-Koeffizient von Frauen
  // durchweg unter dem von Männern (z.B. FRIEND-Gleichung: 1.65 vs. 1.76;
  // Storer-Davis-Modell nutzt ebenfalls niedrigere Koeffizienten für Frauen) —
  // daher Frauen = 0.96 (niedriger), Männer = 1.04 (höher).
  const VO2MAX_GENDER_FACTOR = { m: 1.04, w: 0.96 };

  // Concept2-Formel (identisch für RowErg und SkiErg, offiziell bestätigt):
  // Watts = 2.80 × (500 / Pace[s/500m])³ → nach Pace aufgelöst.
  function paceFromWatts(watts) {
    return 500 * Math.pow(2.80 / watts, 1 / 3);
  }

  function computeBikeRow(weight, gender, e, rows) {
    // Erste Zeile ist immer der kurze Sprint-Effort (Bike/Row: 10 Sek, Ski: 30 Sek),
    // die übrigen Zeilen (2/5/12 Min bzw. 2/5 Min) gehen in die CP-Regression ein.
    const sprintDef = rows[0];
    const points = rows.slice(1).map((def) => ({ x: 1 / e[def.key].t, y: e[def.key].p }));
    const { slope: wPrime, intercept: cp } = linreg(points);
    const map = cp + wPrime / 300; // 300s = 5min, feste Konstante lt. Excel-Modell
    const factor = VO2MAX_GENDER_FACTOR[gender] || VO2MAX_GENDER_FACTOR.m;
    const vo2max = (10.8 * map / weight + 7) * factor;
    const sprint = e[sprintDef.key] ? e[sprintDef.key].p : null;
    return { cp, wPrime, map, vo2max, sprint, sprintLabel: sprintDef.label, weight, gender };
  }

  function computeRun(e, gender) {
    const speed1 = e.d1.d / e.d1.t;
    const speed3 = e.d3.d / e.d3.t;
    const points = [
      { x: 1 / e.d1.t, y: speed1 },
      { x: 1 / e.d3.t, y: speed3 }
    ];
    const { slope: dPrime, intercept: cs } = linreg(points);
    const paceSecPerKm = 1000 / cs;
    const sprintPaceSecPerKm = e.sprint ? 1000 / (e.sprint.d / e.sprint.t) : null;

    // Maximal Aerobic Speed (MAS): dieselbe Extrapolation auf ~5 Minuten wie
    // MAP beim Bike (map = cp + wPrime/300), nur mit Tempo statt Watt.
    // ACSM-Laufformel (horizontal, Steigung 0): VO2 (ml/kg/min) = 0.2 ×
    // Geschwindigkeit[m/min] + 3.5 — bereits pro kg normiert, kein Gewicht
    // nötig. Geschlechtsfaktor wie beim Bike (siehe VO2MAX_GENDER_FACTOR).
    const mas = cs + dPrime / 300;
    const factor = VO2MAX_GENDER_FACTOR[gender] || VO2MAX_GENDER_FACTOR.m;
    const vo2max = (0.2 * (mas * 60) + 3.5) * factor;

    return { cs, dPrime, paceSecPerKm, sprintPaceSecPerKm, vo2max };
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
      const bg = RechnerUtils.hexMix('#f5f4f0', '#ffe55c', i / (ZONES.length - 1));
      let rangeLabel, pctLabel, segLabel;

      if (mode === 'power') {
        const lowW  = RechnerUtils.round(z.lo * baseValue);
        const highW = RechnerUtils.round(z.hi * baseValue);
        rangeLabel = z.lo === 0 ? '< ' + highW + ' W' : lowW + '–' + highW + ' W';
        segLabel   = z.lo === 0 ? '0' : String(lowW);
      } else {
        const fastPace = 1000 / (z.hi * baseValue);
        const slowPace = z.lo === 0 ? null : 1000 / (z.lo * baseValue);
        rangeLabel = z.lo === 0
          ? 'langsamer als ' + RechnerUtils.formatTime(fastPace) + '/km'
          : RechnerUtils.formatTime(fastPace) + '–' + RechnerUtils.formatTime(slowPace) + '/km';
        segLabel = z.lo === 0 ? '' : RechnerUtils.formatTime(slowPace);
      }
      pctLabel = z.lo === 0 ? '< ' + RechnerUtils.round(z.hi * 100) + ' %' : RechnerUtils.round(z.lo * 100) + '–' + RechnerUtils.round(z.hi * 100) + ' %';
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
      ? RechnerUtils.round(topZone.hi * baseValue) + ' W'
      : RechnerUtils.formatTime(1000 / (topZone.hi * baseValue)) + '/km';

    lastZonesData = zonesData;
  }

  function metaSuffix(dragFactor) {
    // Geschlecht/Zyklus werden bei Bike/Row/Ski erfasst — bei Bike fließt das
    // Geschlecht in die VO2max-Schätzung ein, bei Row/Ski ist es (wie Drag
    // Factor) rein dokumentarisch.
    const parts = [currentGender === 'w' ? 'Weiblich' : 'Männlich'];
    if (currentGender === 'w' && cycleSelect.value) {
      parts.push(CYCLE_LABELS[cycleSelect.value]);
    }
    if (dragFactor) parts.push('Drag Factor ' + dragFactor);
    return parts.join(' · ');
  }

  function renderResultsBikeRow(res, dragFactor) {
    const suffix = metaSuffix(dragFactor);
    resultsSub.textContent = 'Deine Zahlen auf Basis deiner eingegebenen Zeitfahrten · ' + res.weight + ' kg Körpergewicht' + (suffix ? ' · ' + suffix : '') + '.';
    const tiles = [
      { label: 'CRITICAL POWER', value: RechnerUtils.round(res.cp) + ' W', sub: (res.cp / res.weight).toFixed(1) + ' W/KG', def: 'Deine theoretisch unbegrenzt haltbare Dauerleistungsgrenze.' },
      { label: "W' — ANAEROBE RESERVE", value: (res.wPrime / 1000).toFixed(1), sub: 'KILOJOULE', def: 'Dein Energie-Tank für Belastungen oberhalb der Critical Power.' },
      { label: 'MAP', value: RechnerUtils.round(res.map) + ' W', sub: (res.map / res.weight).toFixed(1) + ' W/KG', def: 'Die Leistung bei deiner höchsten Sauerstoffaufnahme.' }
    ];
    if (currentSport === 'bike') {
      tiles.push({ label: 'VO2MAX (GESCHÄTZT)', value: res.vo2max.toFixed(1), sub: 'ML/MIN/KG', def: 'Das maximale Sauerstoff-Volumen, das dein Körper pro Minute verwertet.' });
    } else {
      tiles.push({ label: '/500M PACE (CP)', value: RechnerUtils.formatTime(paceFromWatts(res.cp)), sub: 'MIN/500M', def: 'Deine Critical Power umgerechnet in die Concept2-Pace pro 500 Meter.' });
    }
    tilesContainer.innerHTML = tiles.map((t) => tileHTML(t.label, t.value, t.sub, t.def)).join('');
    lastTilesData = tiles;
    renderZones(res.cp, 'power');
    updateIntervalleCta(currentSport, RechnerUtils.round(res.cp));
  }

  function renderResultsRun(res) {
    const suffix = metaSuffix(null);
    resultsSub.textContent = 'Deine Zahlen auf Basis deiner eingegebenen Läufe' + (suffix ? ' · ' + suffix : '') + '.';
    const tiles = [
      { label: 'CRITICAL SPEED', value: RechnerUtils.formatTime(res.paceSecPerKm), sub: 'MIN/KM', def: 'Dein theoretisch unbegrenzt haltbares Tempo.' },
      { label: "D' — ANAEROBE RESERVE", value: RechnerUtils.round(res.dPrime), sub: 'METER', def: 'Dein Distanz-Puffer für Tempo oberhalb der Critical Speed.' },
      { label: 'VO2MAX (GESCHÄTZT)', value: res.vo2max.toFixed(1), sub: 'ML/MIN/KG', def: 'Das maximale Sauerstoff-Volumen, das dein Körper pro Minute verwertet.' }
    ];
    if (res.sprintPaceSecPerKm) {
      tiles.push({ label: 'SPRINT', value: RechnerUtils.formatTime(res.sprintPaceSecPerKm), sub: 'MIN/KM', def: 'Dein Tempo im maximalen Sprint.' });
    }
    tilesContainer.innerHTML = tiles.map((t) => tileHTML(t.label, t.value, t.sub, t.def)).join('');
    lastTilesData = tiles;
    renderZones(res.cs, 'pace');
    updateIntervalleCta('run', RechnerUtils.formatTime(res.paceSecPerKm));
  }

  // Laktat/Ø-HF sind reine Dokumentationswerte (fließen in keine Formel ein) —
  // die Tabelle erscheint daher nur, wenn zu mindestens einem Zeitfahren
  // tatsächlich etwas eingetragen wurde.
  function renderProtocol(rows, extras) {
    const filled = rows.filter((def) => extras[def.key]);
    if (filled.length === 0) {
      protocolSection.hidden = true;
      protocolTable.innerHTML = '';
      lastProtocolRows = [];
      return;
    }

    protocolMeta.textContent = 'Laktat- und Herzfrequenzwerte, die du zu deinen Zeitfahren angegeben hast.';

    const protocolRows = filled.map((def) => {
      const ex = extras[def.key];
      return {
        label: def.label,
        lacLabel: ex.lac !== null ? ex.lac.toFixed(1) + ' mmol/l' : '—',
        hrLabel: ex.hr !== null ? RechnerUtils.round(ex.hr) + ' bpm' : '—'
      };
    });

    const head =
      '<div class="cp-protocol-row cp-protocol-row-head">' +
      '<div>ZEITFAHREN</div><div>LAKTAT</div><div>Ø HERZFREQUENZ</div>' +
      '</div>';
    const body = protocolRows.map((r) =>
      '<div class="cp-protocol-row">' +
      '<div class="cp-protocol-label">' + r.label + '</div>' +
      '<div>' + r.lacLabel + '</div>' +
      '<div>' + r.hrLabel + '</div>' +
      '</div>'
    ).join('');

    protocolTable.innerHTML = head + body;
    protocolSection.hidden = false;
    lastProtocolRows = protocolRows;
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    RechnerUtils.hideErrorSummary(errorSummary);

    const errors = [];
    const rows = ROW_DEFS[currentSport];
    let results;
    let extras = {};

    if (currentSport === 'run') {
      const efforts = collectRunEfforts(errors);
      extras = collectExtras(rows, efforts, errors);
      if (errors.length === 0) results = computeRun(efforts, currentGender);
      if (errors.length === 0 && results) renderResultsRun(results);
    } else {
      const weight = collectWeight(errors);
      const dragFactor = (currentSport === 'row' || currentSport === 'ski') ? collectDragFactor(errors) : null;
      const efforts = collectPowerEfforts(errors);
      extras = collectExtras(rows, efforts, errors);
      if (errors.length === 0) results = computeBikeRow(weight, currentGender, efforts, rows);
      if (errors.length === 0 && results) renderResultsBikeRow(results, dragFactor);
    }

    if (errors.length > 0) {
      RechnerUtils.showErrorSummary(errorSummary, errors);
      return;
    }

    renderProtocol(rows, extras);

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
  function generatePdf() {
    if (!window.jspdf) {
      alert('PDF-Export ist gerade nicht verfügbar. Bitte Seite neu laden und erneut versuchen.');
      return;
    }
    const { doc, state } = PdfUtils.createDoc('CP-RECHNER');
    const ensureSpace = PdfUtils.makeEnsureSpace(doc, state, null);
    const { BLACK, ACCENT, GRAY } = PdfUtils.COLORS;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('DEIN ERGEBNIS', state.marginX, state.y);
    state.y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor.apply(doc, BLACK);
    doc.text('DEINE ZAHLEN.', state.marginX, state.y);
    state.y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, GRAY);
    const subLines = doc.splitTextToSize(resultsSub.textContent, state.contentW);
    doc.text(subLines, state.marginX, state.y);
    state.y += subLines.length * 5 + 8;

    // Ergebnis-Kacheln, 2 Spalten. Dünner Rahmen + Akzentstreifen statt
    // vollflächigem schwarzen Kasten — sieht gedruckt/als PDF sauberer aus.
    const gap = 6;
    const tileW = (state.contentW - gap) / 2;
    const tileH = 32;
    lastTilesData.forEach((t, i) => {
      const col = i % 2;
      if (col === 0) ensureSpace(tileH + gap);
      const x = state.marginX + col * (tileW + gap);

      doc.setDrawColor(225, 225, 225);
      doc.setLineWidth(0.3);
      doc.rect(x, state.y, tileW, tileH, 'S');
      doc.setFillColor.apply(doc, ACCENT);
      doc.rect(x, state.y, tileW, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(t.label, x + 5, state.y + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(String(t.value), x + 5, state.y + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(t.sub, x + 5, state.y + 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor.apply(doc, GRAY);
      const defLines = doc.splitTextToSize(t.def, tileW - 10).slice(0, 2);
      doc.text(defLines, x + 5, state.y + 28);

      if (col === 1 || i === lastTilesData.length - 1) state.y += tileH + gap;
    });
    state.y += 4;

    // Trainingszonen
    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('DEINE TRAININGSZONEN', state.marginX, state.y);
    state.y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor.apply(doc, BLACK);
    doc.text('VON EASY BIS VO2MAX.', state.marginX, state.y);
    state.y += 11;

    lastZonesData.forEach((z) => {
      ensureSpace(9);
      doc.setFillColor.apply(doc, PdfUtils.hexToRgb(z.bg));
      doc.setDrawColor(200, 200, 200);
      doc.rect(state.marginX, state.y - 3.6, 4.5, 4.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(z.name, state.marginX + 8, state.y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(z.rangeLabel + ' · ' + z.pctLabel, state.marginX + 8, state.y + 4.6);

      state.y += 11;
    });

    // Testprotokoll (Laktat/Ø-HF) — nur falls tatsächlich Werte eingetragen wurden.
    if (lastProtocolRows.length > 0) {
      state.y += 6;
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAY);
      doc.text('TESTPROTOKOLL', state.marginX, state.y);
      state.y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor.apply(doc, BLACK);
      doc.text('DEINE EINGABEN.', state.marginX, state.y);
      state.y += 11;

      lastProtocolRows.forEach((r) => {
        ensureSpace(9);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor.apply(doc, BLACK);
        doc.text(r.label, state.marginX, state.y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, GRAY);
        doc.text('Laktat ' + r.lacLabel + '  ·  Ø HF ' + r.hrLabel, state.marginX + 40, state.y);

        state.y += 7;
      });
    }

    PdfUtils.saveWithStamp(doc, 'CP-Rechner', currentSport);
  }

  exportPdfBtn.addEventListener('click', generatePdf);

  /* ── Init ────────────────────────────────────────────────────── */
  switchSport('bike');
})();
