/* SCHWELLENSCHMOPS — saisonplan.js
   Generischer Saisonplan-Rechner (Makro-Ebene): aus Tag X, Sportart,
   Erfahrungslevel und Wettkampfdauer wird ein Phasen-Zeitstrahl
   (Grundlage/Aufbau/Wettkampf/Taper/Regeneration) mit echten
   Kalenderdaten berechnet. Reines Client-Side-JS, keine Datenübertragung,
   keine Speicherung. Bewusst nur Makro-Ebene — für individuelle
   Wochenpläne/Einheiten siehe training.html. */

(function () {
  'use strict';

  const form = document.getElementById('plan-form');
  if (!form) return; // Skript nur relevant auf saisonplan.html

  const tabs           = document.querySelectorAll('.cp-tab');
  const sportIntroEl    = document.getElementById('plan-sport-intro');
  const tagXInput       = document.getElementById('plan-tagx');
  const tagXRow         = document.getElementById('plan-tagx-row');
  const tagXError       = document.getElementById('plan-tagx-error');
  const levelGroup      = document.getElementById('plan-level-group');
  const durationGroup   = document.getElementById('plan-duration-group');
  const errorSummary    = document.getElementById('plan-error-summary');
  const resultsSection  = document.getElementById('plan-results');
  const resultsSub      = document.getElementById('plan-results-sub');
  const timelineEl      = document.getElementById('plan-timeline');
  const phaseCardsEl    = document.getElementById('plan-phase-cards');
  const exportPdfBtn    = document.getElementById('plan-export-pdf');

  let currentSport = 'bike';
  let currentLevel = 'beginner';
  let currentDuration = 'medium';
  let lastPlanData = null; // fuer PDF-Export: { mode, weeksTotal, phases, tagXDate, sport, level, duration }

  /* ── Konfiguration ────────────────────────────────────────────── */
  const SPORT_LABELS = {
    bike: { name: 'Rad', adj: 'Rad-' },
    run:  { name: 'Lauf', adj: 'Lauf-' },
    row:  { name: 'Ruder', adj: 'Ruder-' },
    ski:  { name: 'Ski', adj: 'Ski-' }
  };
  const SPORT_INTRO = {
    bike: 'Dein Saisonplan fürs Radtraining.',
    run:  'Dein Saisonplan fürs Lauftraining.',
    row:  'Dein Saisonplan fürs Rudertraining.',
    ski:  'Dein Saisonplan fürs Skitraining.'
  };

  // Taper/Regeneration in Wochen, nach grober Wettkampfdauer.
  const DURATION_CONFIG = {
    short:  { taperWeeks: 1, regenWeeks: 1, label: '< 2 Std.' },
    medium: { taperWeeks: 2, regenWeeks: 2, label: '2–5 Std.' },
    long:   { taperWeeks: 3, regenWeeks: 3, label: '> 5 Std. (z.B. Ironman)' }
  };

  // Anteile von (Vor-Taper-Zeit) auf Grundlage/Aufbau/Wettkampf, nach Level.
  const LEVEL_SPLIT = {
    beginner:     { grundlage: 0.55, aufbau: 0.30, wettkampf: 0.15, label: 'Einsteiger' },
    intermediate: { grundlage: 0.45, aufbau: 0.35, wettkampf: 0.20, label: 'Fortgeschritten' },
    advanced:     { grundlage: 0.35, aufbau: 0.35, wettkampf: 0.30, label: 'Ambitioniert' }
  };

  // Grobe LIT/HIT-Orientierung pro Phase (qualitativ, keine exakte Studienzahl).
  // Regeneration bekommt keinen Ratio-Wert — da geht es nicht um Trainingszonen.
  const LIT_HIT = {
    grundlage: '85 / 15', aufbau: '75 / 25', wettkampf: '70 / 30',
    taper: '80 / 20', erhaltung: '80 / 20'
  };
  function intensityLine(key) {
    return key === 'regeneration' ? 'SCHWERPUNKT: AKTIVE ERHOLUNG' : 'LIT/HIT ' + LIT_HIT[key];
  }

  const PHASE_META = {
    grundlage:  { label: 'Grundlage', color: 'var(--accent)', opacity: 0.2 },
    aufbau:     { label: 'Aufbau', color: 'var(--accent)', opacity: 0.4 },
    wettkampf:  { label: 'Wettkampf', color: 'var(--accent)', opacity: 0.7 },
    erhaltung:  { label: 'Erhaltung', color: 'var(--accent)', opacity: 0.5 },
    taper:      { label: 'Taper', color: 'var(--accent)', opacity: 0.35 },
    regeneration: { label: 'Regeneration', color: 'var(--gray-light)', opacity: 0.3 }
  };

  function focusText(key, sportAdj) {
    switch (key) {
      case 'grundlage': return 'Ausdauer und ' + sportAdj + 'Technik aufbauen — hoher Umfang, ruhige Intensität.';
      case 'aufbau': return 'Belastung steigern, erste ' + sportAdj + 'spezifische Reize und Vorbereitungswettkämpfe.';
      case 'wettkampf': return 'Wettkampfnahes Training, die Leistung wird abgerufen.';
      case 'taper': return 'Umfang deutlich runter, frisch werden für Tag X.';
      case 'regeneration': return 'Aktiv und passiv erholen, bevor der nächste Zyklus beginnt.';
      case 'erhaltung': return 'Form halten statt neu aufbauen — kurze, knackige Reize statt großer Umfänge.';
      default: return '';
    }
  }

  /* ── Datums-Helfer ────────────────────────────────────────────── */
  function startOfDay(d) { const n = new Date(d); n.setHours(0, 0, 0, 0); return n; }
  function addDays(d, days) { const n = new Date(d); n.setDate(n.getDate() + days); return n; }
  function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }
  function formatDate(d) {
    return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function formatDateShort(d) {
    return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
  }
  // Deutsche Substantive bleiben auch mitten im Satz groß ("1 Woche", "8 Wochen").
  function weekLabel(n) { return n + (n === 1 ? ' Woche' : ' Wochen'); }

  // Teilt totalDays auf 3 Phasen nach Anteilen auf, jede Phase min. 7 Tage
  // (sofern totalDays das zulässt) — Rest wandert zur größten Phase.
  function splitDays(totalDays, ratios) {
    let a = Math.round(totalDays * ratios.grundlage / 7) * 7;
    let b = Math.round(totalDays * ratios.aufbau / 7) * 7;
    let c = totalDays - a - b;
    let guard = 0;
    while (c < 7 && (a > 7 || b > 7) && guard < 100) {
      if (a >= b && a > 7) a -= 7; else if (b > 7) b -= 7;
      c = totalDays - a - b;
      guard++;
    }
    return [Math.max(7, a), Math.max(7, b), Math.max(7, c)];
  }

  /* ── Rechenkern ───────────────────────────────────────────────── */
  function computePlan({ tagXDate, sport, level, duration }) {
    const today = startOfDay(new Date());
    const totalDays = daysBetween(today, tagXDate);
    const cfg = DURATION_CONFIG[duration];
    const taperDays = cfg.taperWeeks * 7;
    const regenDays = cfg.regenWeeks * 7;
    const sportAdj = SPORT_LABELS[sport].adj;

    if (totalDays < taperDays) {
      return { mode: 'tooClose', weeksTotal: Math.round(totalDays / 7), phases: [], tagXDate };
    }

    const preTaperDays = totalDays - taperDays;
    const phases = [];
    let cursor = today;

    if (preTaperDays < 21) {
      // Condensed: eine Erhaltungsphase statt Grundlage/Aufbau/Wettkampf.
      const erhaltungDays = Math.max(7, preTaperDays);
      phases.push(buildPhase('erhaltung', cursor, erhaltungDays, sportAdj));
      cursor = addDays(cursor, erhaltungDays);
    } else {
      const split = LEVEL_SPLIT[level];
      const [gDays, aDays, wDays] = splitDays(preTaperDays, split);
      phases.push(buildPhase('grundlage', cursor, gDays, sportAdj)); cursor = addDays(cursor, gDays);
      phases.push(buildPhase('aufbau', cursor, aDays, sportAdj)); cursor = addDays(cursor, aDays);
      phases.push(buildPhase('wettkampf', cursor, wDays, sportAdj)); cursor = addDays(cursor, wDays);
    }

    // Taper endet exakt einen Tag vor Tag X (cursor steht hier bereits an
    // dieser Stelle, da preTaperDays/erhaltungDays exakt bis hierhin reichen).
    phases.push(buildPhase('taper', cursor, taperDays, sportAdj));

    const regenStart = addDays(tagXDate, 1);
    phases.push(buildPhase('regeneration', regenStart, regenDays, sportAdj));

    return {
      mode: preTaperDays < 21 ? 'condensed' : 'full',
      weeksTotal: Math.round(totalDays / 7),
      phases, tagXDate, sport, level, duration
    };
  }

  function buildPhase(key, start, days, sportAdj) {
    const meta = PHASE_META[key];
    const end = addDays(start, days - 1);
    return {
      key, label: meta.label, color: meta.color, opacity: meta.opacity,
      start, end, weeks: Math.max(1, Math.round(days / 7)),
      isPostRace: key === 'regeneration',
      focusText: focusText(key, sportAdj),
      litHit: intensityLine(key)
    };
  }

  /* ── Zeitstrahl (SVG) ─────────────────────────────────────────── */
  function renderTimeline(plan) {
    if (plan.mode === 'tooClose') {
      timelineEl.innerHTML =
        '<div class="plan-timeline-warning">Dein Tag X ist näher als eine sinnvolle Taper-Phase — ' +
        'starte am besten entspannt mit einer kurzen, lockeren Woche in dein Ziel, statt jetzt noch groß umzuplanen.</div>';
      return;
    }

    const plotX = 50, plotEndX = 590, plotW = plotEndX - plotX, bandY = 80, bandH = 40;
    const totalWeeksForWidth = plan.phases.reduce((s, p) => s + p.weeks, 0);

    let x = plotX;
    let rects = '', dividers = '', labels = '', tagXMarkup = '';

    plan.phases.forEach((p, i) => {
      const w = Math.max(4, plotW * (p.weeks / totalWeeksForWidth));
      rects += '<rect x="' + x.toFixed(1) + '" y="' + bandY + '" width="' + w.toFixed(1) + '" height="' + bandH + '" fill="' + p.color + '" fill-opacity="' + p.opacity + '"/>';
      if (i > 0) {
        dividers += '<line x1="' + x.toFixed(1) + '" y1="' + bandY + '" x2="' + x.toFixed(1) + '" y2="' + (bandY + bandH) + '" stroke="var(--dark)" stroke-width="2"/>';
      }

      const cx = x + w / 2;
      const compact = w < 55;
      const isLastPreRace = !p.isPostRace && (i === plan.phases.length - 1 || plan.phases[i + 1].isPostRace);
      const isFirstPostRace = p.isPostRace && (i === 0 || !plan.phases[i - 1].isPostRace);
      let anchor = 'middle', labelX = cx;
      if (compact && isLastPreRace) { anchor = 'end'; labelX = x + w - 3; }
      else if (compact && isFirstPostRace) { anchor = 'start'; labelX = x + 3; }
      const fontSize = compact ? 9.5 : 11;

      labels += '<text x="' + labelX.toFixed(1) + '" y="140" text-anchor="' + anchor + '" font-family="var(--font-cond)" font-size="' + fontSize + '" font-weight="600" letter-spacing="0.05em" fill="var(--white)">' + p.label.toUpperCase() + '</text>';
      if (!compact) {
        labels += '<text x="' + cx.toFixed(1) + '" y="153" text-anchor="middle" font-family="var(--font-cond)" font-size="8.5" letter-spacing="0.02em" fill="var(--gray-light)">' + p.weeks + ' Wo.</text>';
      }

      if (isLastPreRace) {
        const tagXPixel = x + w;
        tagXMarkup =
          '<line x1="' + tagXPixel.toFixed(1) + '" y1="55" x2="' + tagXPixel.toFixed(1) + '" y2="' + bandY + '" stroke="var(--white)" stroke-width="1.5" stroke-dasharray="3 4"/>' +
          '<circle cx="' + tagXPixel.toFixed(1) + '" cy="' + bandY + '" r="4" fill="var(--white)"/>' +
          '<text x="' + tagXPixel.toFixed(1) + '" y="42" text-anchor="middle" font-family="var(--font-cond)" font-size="11" font-weight="700" letter-spacing="0.08em" fill="var(--accent)">TAG X</text>' +
          '<text x="' + tagXPixel.toFixed(1) + '" y="30" text-anchor="middle" font-family="var(--font-cond)" font-size="8.5" letter-spacing="0.02em" fill="var(--gray-light)">' + formatDateShort(plan.tagXDate) + '</text>';
      }

      x += w;
    });

    const svg =
      '<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<title>Dein Saisonplan-Zeitstrahl</title>' +
      rects + dividers + labels + tagXMarkup +
      '<text x="50" y="182" font-family="var(--font-cond)" font-size="10" letter-spacing="0.06em" fill="var(--gray)">HEUTE</text>' +
      '<text x="590" y="182" text-anchor="end" font-family="var(--font-cond)" font-size="10" letter-spacing="0.06em" fill="var(--gray)">' + formatDateShort(plan.phases[plan.phases.length - 1].end) + '</text>' +
      '</svg>';

    const ariaLabel = 'Zeitstrahl deines Saisonplans mit den Phasen ' +
      plan.phases.map((p) => p.label + ' (' + weekLabel(p.weeks) + ')').join(', ') +
      ', mit Tag X am ' + formatDate(plan.tagXDate) + '.';

    timelineEl.innerHTML =
      '<div class="plan-timeline-svg-wrap" role="img" aria-label="' + ariaLabel + '">' + svg + '</div>' +
      '<p class="plan-timeline-caption">Vom heutigen Tag bis Tag X (' + formatDate(plan.tagXDate) + ') und der Regeneration danach — dein persönlicher Saisonplan im Überblick.</p>';
  }

  /* ── Phasen-Karten ────────────────────────────────────────────── */
  function phaseCardHTML(p) {
    return (
      '<div class="plan-phase-card">' +
      '<div class="plan-phase-card-label">' + p.label + '</div>' +
      '<div class="plan-phase-card-dates">' + formatDate(p.start) + ' – ' + formatDate(p.end) + '</div>' +
      '<div class="plan-phase-card-weeks">' + weekLabel(p.weeks) + '</div>' +
      '<div class="plan-phase-card-divider"></div>' +
      '<div class="plan-phase-card-focus">' + p.focusText + '</div>' +
      '<div class="plan-phase-card-lithit">' + p.litHit + '</div>' +
      '</div>'
    );
  }

  function renderPhaseCards(plan) {
    if (plan.mode === 'tooClose') {
      phaseCardsEl.innerHTML = '';
      return;
    }
    phaseCardsEl.innerHTML = plan.phases.map(phaseCardHTML).join('');
  }

  /* ── Sportart-/Pill-Auswahl ───────────────────────────────────── */
  function switchSport(sport) {
    currentSport = sport;
    tabs.forEach((t) => {
      const active = t.dataset.sport === sport;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    sportIntroEl.textContent = SPORT_INTRO[sport];
  }
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => switchSport(btn.dataset.sport));
  });

  function wirePillGroup(groupEl, dataAttr, onChange) {
    groupEl.querySelectorAll('.plan-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        groupEl.querySelectorAll('.plan-pill').forEach((p) => {
          p.classList.remove('is-active');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('is-active');
        pill.setAttribute('aria-checked', 'true');
        onChange(pill.dataset[dataAttr]);
      });
    });
  }
  wirePillGroup(levelGroup, 'level', (v) => { currentLevel = v; });
  wirePillGroup(durationGroup, 'duration', (v) => { currentDuration = v; });

  /* ── Validierung & Submit ─────────────────────────────────────── */
  function showErrorSummary(messages) {
    errorSummary.innerHTML = messages.map((m) => '<p>' + m + '</p>').join('');
    errorSummary.hidden = false;
  }
  function hideErrorSummary() {
    errorSummary.hidden = true;
    errorSummary.innerHTML = '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideErrorSummary();
    tagXRow.classList.remove('is-invalid');
    tagXError.textContent = '';

    const errors = [];
    let tagXDate = null;
    if (!tagXInput.value) {
      errors.push('Bitte ein Zieldatum (Tag X) angeben.');
    } else {
      tagXDate = startOfDay(new Date(tagXInput.value + 'T00:00:00'));
      const today = startOfDay(new Date());
      const days = daysBetween(today, tagXDate);
      if (days < 1) {
        errors.push('Tag X muss in der Zukunft liegen.');
      } else if (days > 730) {
        errors.push('Tag X liegt mehr als 2 Jahre in der Zukunft — bitte ein näheres Datum wählen.');
      }
    }

    if (errors.length > 0) {
      tagXRow.classList.add('is-invalid');
      tagXError.textContent = errors[0];
      showErrorSummary(errors);
      return;
    }

    const plan = computePlan({ tagXDate, sport: currentSport, level: currentLevel, duration: currentDuration });
    lastPlanData = plan;

    const levelLabel = LEVEL_SPLIT[currentLevel].label;
    const durationLabel = DURATION_CONFIG[currentDuration].label;
    resultsSub.textContent = weekLabel(plan.weeksTotal) + ' bis Tag X (' + formatDate(tagXDate) + ') · ' +
      SPORT_LABELS[currentSport].name + ' · ' + levelLabel + ' · ' + durationLabel;

    renderTimeline(plan);
    renderPhaseCards(plan);

    resultsSection.hidden = false;
    resultsSection.classList.add('is-visible');

    const offset = document.getElementById('site-header').offsetHeight;
    const top = resultsSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  /* ── PDF-Export ──────────────────────────────────────────────────
     Wie beim CP-Rechner per jsPDF statt Browser-Druckdialog (siehe
     js/cp-rechner.js für die ausführliche Begründung). Anders als dort
     ist der Saisonplan realistisch mehrseitig — ensureSpace()/addPage()
     wird hier tatsächlich mehrfach ausgelöst, mit schlankem
     Fortsetzungs-Kopf auf Folgeseiten. */
  const DISCLAIMER_TEXT = 'Generischer Planentwurf, kein individueller Trainingsplan. ' +
    'Für eine individuelle Betreuung: schwellenschmops.at/training.html';

  function generatePdf() {
    if (!lastPlanData || lastPlanData.mode === 'tooClose') {
      alert('Bitte zuerst einen Plan berechnen.');
      return;
    }
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
      if (y + h > pageH - marginBottom) {
        doc.addPage();
        y = 18;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, GRAY);
        doc.text('SAISONPLAN — FORTSETZUNG', marginX, y);
        y += 10;
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('ERSTELLT AM ' + new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '  ·  SCHWELLENSCHMOPS.AT/SAISONPLAN', marginX, y);
    y += 11;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('DEIN SAISONPLAN', marginX, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor.apply(doc, BLACK);
    doc.text('TAG X: ' + formatDate(lastPlanData.tagXDate).toUpperCase(), marginX, y);
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, GRAY);
    const subLines = doc.splitTextToSize(resultsSub.textContent, contentW);
    doc.text(subLines, marginX, y);
    y += subLines.length * 5 + 8;

    // Phasen, volle Breite je Karte (mehr Text als bei CP-Rechner-Kacheln).
    const cardH = 40;
    lastPlanData.phases.forEach((p) => {
      ensureSpace(cardH + 5);

      doc.setFillColor.apply(doc, BLACK);
      doc.rect(marginX, y, contentW, cardH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor.apply(doc, ACCENT);
      doc.text(p.label.toUpperCase(), marginX + 6, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(formatDate(p.start) + ' – ' + formatDate(p.end) + '  ·  ' + weekLabel(p.weeks) + '  ·  ' + p.litHit, marginX + 6, y + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, WHITE);
      const focusLines = doc.splitTextToSize(p.focusText, contentW - 12).slice(0, 2);
      doc.text(focusLines, marginX + 6, y + 25);

      y += cardH + 5;
    });

    y += 4;
    ensureSpace(16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor.apply(doc, GRAY);
    const discLines = doc.splitTextToSize(DISCLAIMER_TEXT, contentW);
    doc.text(discLines, marginX, y);

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save('Saisonplan_' + currentSport + '_' + stamp + '.pdf');
  }

  exportPdfBtn.addEventListener('click', generatePdf);

  /* ── Init ────────────────────────────────────────────────────── */
  switchSport('bike');
})();
