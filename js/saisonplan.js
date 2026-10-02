/* SCHWELLENSCHMOPS — saisonplan.js
   Generischer Saisonplan-Rechner (Makro-/Meso-Ebene) für zwei Hauptfokusse:
   AUSDAUER (Grundlage/Aufbau/Wettkampf) oder KRAFT (Hypertrophie/
   Maximalkraft/Peaking) — die jeweils andere Qualität läuft als
   Begleitspur mit. Aus Tag X (+ optional 2. Höhepunkt als A- oder B-Ziel),
   Level und ggf. Wettkampfdauer wird ein Phasen-Zeitstrahl mit
   Entlastungswochen, eine schematische Ressourcen-Kurve und eine
   Phasen-Tabelle mit echten Kalenderdaten berechnet.
   Fachliche Grundlage: Ressourcen aufbauen vs. verwenden (allgemein vs.
   spezifisch), Mesozyklen mit Entlastung, Residualeffekte, Block-Logik für
   mehrere Höhepunkte (Issurin 2008; Williams et al. 2017).
   Reines Client-Side-JS, keine Datenübertragung, keine Speicherung.
   Bewusst kein Wochenplan — für individuelle Pläne siehe training.html.
   Geteilte Helfer (hexMix/…) liegen in js/rechner-utils.js, das
   PDF-Pagination-Gerüst in js/pdf-utils.js. */

(function () {
  'use strict';

  const form = document.getElementById('plan-form');
  if (!form) return; // Skript nur relevant auf saisonplan.html

  const modeGroup       = document.getElementById('plan-mode-group');
  const sportBlock      = document.getElementById('plan-sport-block');
  const tabs            = document.querySelectorAll('.cp-tab');
  const sportIntroEl    = document.getElementById('plan-sport-intro');
  const startInput      = document.getElementById('plan-start');
  const startRow        = document.getElementById('plan-start-row');
  const startError      = document.getElementById('plan-start-error');
  const startTodayBtn   = document.getElementById('plan-start-today');
  const tagXInput       = document.getElementById('plan-tagx');
  const tagXRow         = document.getElementById('plan-tagx-row');
  const tagXError       = document.getElementById('plan-tagx-error');
  const eventInput      = document.getElementById('plan-event');
  const peak2Details    = document.getElementById('plan-peak2');
  const peak2DateInput  = document.getElementById('plan-peak2-date');
  const peak2Row        = document.getElementById('plan-peak2-row');
  const peak2Error      = document.getElementById('plan-peak2-error');
  const peak2NameInput  = document.getElementById('plan-peak2-name');
  const peak2KindGroup  = document.getElementById('plan-peak2-kind-group');
  const levelGroup      = document.getElementById('plan-level-group');
  const durationField   = document.getElementById('plan-duration-field');
  const durationGroup   = document.getElementById('plan-duration-group');
  const errorSummary    = document.getElementById('plan-error-summary');
  const resultsSection  = document.getElementById('plan-results');
  const resultsSub      = document.getElementById('plan-results-sub');
  const timelineEl      = document.getElementById('plan-timeline');
  const resourcesEl     = document.getElementById('plan-resources');
  const phaseCardsEl    = document.getElementById('plan-phase-cards');
  const exportPdfBtn    = document.getElementById('plan-export-pdf');
  const ctaSets         = document.querySelectorAll('.plan-ctas');

  let currentMode = 'endurance';
  let currentSport = 'bike';
  let currentLevel = 'beginner';
  let currentDuration = 'medium';
  let currentPeak2Kind = 'B';
  let lastPlanData = null; // fuer PDF-Export

  /* ── Konfiguration ────────────────────────────────────────────── */
  const SPORT_LABELS = {
    bike: { name: 'Rad', adj: 'Rad-' },
    run:  { name: 'Lauf', adj: 'Lauf-' },
    row:  { name: 'Ruder', adj: 'Ruder-' },
    ski:  { name: 'Ski', adj: 'Ski-' }
  };
  const SPORT_INTRO = {
    bike: 'Dein Saisonplan fürs Radtraining — Kraft läuft als Begleiter mit.',
    run:  'Dein Saisonplan fürs Lauftraining — Kraft läuft als Begleiter mit.',
    row:  'Dein Saisonplan fürs Rudertraining — Kraft läuft als Begleiter mit.',
    ski:  'Dein Saisonplan fürs Skitraining — Kraft läuft als Begleiter mit.'
  };
  const STRENGTH_INTRO = 'Dein Saisonplan fürs Krafttraining — Ausdauer läuft als Begleiter mit.';

  // Taper/Regeneration in Wochen, nach grober Wettkampfdauer (nur AUSDAUER).
  const DURATION_CONFIG = {
    short:  { taperWeeks: 1, regenWeeks: 1, label: '< 2 Std.' },
    medium: { taperWeeks: 2, regenWeeks: 2, label: '2–5 Std.' },
    long:   { taperWeeks: 3, regenWeeks: 3, label: '> 5 Std. (z.B. Ironman)' }
  };

  // Anteile von (Vor-Taper-Zeit) auf die drei Aufbau-Phasen, nach Level —
  // gilt für beide Modi (Ausdauer: Grundlage/Aufbau/Wettkampf,
  // Kraft: Hypertrophie/Maximalkraft/Peaking).
  const LEVEL_SPLIT = {
    beginner:     { ratios: [0.55, 0.30, 0.15], label: 'Einsteiger' },
    intermediate: { ratios: [0.45, 0.35, 0.20], label: 'Fortgeschritten' },
    advanced:     { ratios: [0.35, 0.35, 0.30], label: 'Ambitioniert' }
  };

  // Interne Phasen-Keys bleiben in beiden Modi gleich (grundlage/aufbau/
  // wettkampf/erhaltung/taper/regeneration), damit Rechenkern, Zeitstrahl
  // und Ressourcen-Modell modusunabhängig bleiben — Labels, Texte und
  // Spur-Werte kommen aus MODE_CONFIG.
  const BUILD_KEYS = ['grundlage', 'aufbau', 'wettkampf'];

  const MODE_CONFIG = {
    endurance: {
      label: 'Ausdauer',
      fixedDuration: null,
      labels: {
        grundlage: 'Grundlage', aufbau: 'Aufbau', wettkampf: 'Wettkampf',
        erhaltung: 'Erhaltung', taper: 'Taper', regeneration: 'Regeneration'
      },
      mainLine: {
        grundlage: 'LIT/HIT 85 / 15', aufbau: 'LIT/HIT 75 / 25', wettkampf: 'LIT/HIT 70 / 30',
        erhaltung: 'LIT/HIT 80 / 20', taper: 'LIT/HIT 80 / 20', regeneration: 'Schwerpunkt: aktive Erholung'
      },
      // Anteil allgemeiner (ressourcen-aufbauender) Inhalte in % — Rest ist
      // wettkampfspezifisch (ressourcen-verwendend).
      general: { grundlage: 80, aufbau: 60, wettkampf: 30, erhaltung: 40, taper: 20, regeneration: 90 },
      companionLabel: 'Kraft',
      companion: {
        grundlage: 'Athletik & Kraftaufbau, 2×/Woche',
        aufbau: 'Maximalkraft, 1–2×/Woche',
        wettkampf: 'Kraft erhalten, 1×/Woche kurz',
        erhaltung: 'Kraft erhalten, 1×/Woche kurz',
        taper: 'nur ein kurzer Reiz früh im Taper',
        regeneration: 'lockere Athletik, gern sportartfremd'
      },
      focusText: function (key, ctx) {
        switch (key) {
          case 'grundlage': return 'Ressourcen aufbauen: Ausdauer und ' + ctx.sportAdj + 'Technik, hoher Umfang, ruhige Intensität. Kurze, zügige Reize halten die Spritzigkeit.';
          case 'aufbau': return 'Ressourcen umwandeln: Belastung steigern, ' + ctx.sportAdj + 'spezifische Reize und erste Vorbereitungswettkämpfe.';
          case 'wettkampf': return 'Ressourcen einsetzen: wettkampfnahes Training. Lockere Grundlage nicht streichen — Ausdauer baut ohne Reiz nach rund 4 Wochen ab.';
          case 'taper': return 'Umfang deutlich runter, Intensität kurz halten — frisch werden für ' + ctx.goalLabel + '.';
          case 'regeneration': return 'Ressourcen auffüllen: aktiv und passiv erholen, bevor der nächste Zyklus beginnt.';
          case 'erhaltung': return 'Form halten statt neu aufbauen — kurze, knackige Reize statt großer Umfänge.';
          default: return '';
        }
      }
    },
    strength: {
      label: 'Kraft',
      fixedDuration: { taperWeeks: 1, regenWeeks: 1 },
      labels: {
        grundlage: 'Hypertrophie', aufbau: 'Maximalkraft', wettkampf: 'Peaking',
        erhaltung: 'Erhaltung', taper: 'Taper', regeneration: 'Regeneration'
      },
      mainLine: {
        grundlage: 'Volumen hoch · Intensität mittel', aufbau: 'Volumen mittel · Intensität hoch',
        wettkampf: 'Volumen niedrig · Intensität sehr hoch', erhaltung: 'Volumen mittel · Intensität hoch',
        taper: 'Volumen niedrig · Intensität hoch, wenige Sätze', regeneration: 'Schwerpunkt: aktive Erholung'
      },
      general: { grundlage: 80, aufbau: 40, wettkampf: 10, erhaltung: 40, taper: 10, regeneration: 90 },
      companionLabel: 'Ausdauer',
      companion: {
        grundlage: '2–3×/Woche locker, für bessere Erholung',
        aufbau: '1–2×/Woche locker',
        wettkampf: 'nur lockere Bewegung',
        erhaltung: '1–2×/Woche locker',
        taper: 'nur lockere Bewegung',
        regeneration: 'Ausdauer als aktive Pause'
      },
      focusText: function (key, ctx) {
        switch (key) {
          case 'grundlage': return 'Ressourcen aufbauen: Muskelmasse, Belastbarkeit und saubere Technik — mehr Wiederholungen, breite Übungsauswahl.';
          case 'aufbau': return 'Ressourcen umwandeln: schwerer, weniger Wiederholungen — die Wettkampfübungen rücken in den Mittelpunkt.';
          case 'wettkampf': return 'Ressourcen einsetzen: fast nur noch Wettkampfübungen, schwere Einzel- und Doppelwiederholungen.';
          case 'taper': return 'Volumen runter, Intensität halten — frisch und schwer werden für ' + ctx.goalLabel + '.';
          case 'regeneration': return 'Ressourcen auffüllen: Gelenke und Kopf erholen, allgemeine Übungen statt Wettkampfübungen.';
          case 'erhaltung': return 'Kraft halten statt neu aufbauen — wenige schwere Sätze statt großer Umfänge.';
          default: return '';
        }
      }
    }
  };

  // Schematisches Ressourcen-Modell (keine Messgröße!): verfügbare
  // Ressourcen bewegen sich pro Woche mit RES_RATE auf das Phasenziel zu.
  // Taper hält den Stand (Ermüdung baut ab, Spezifik bleibt hoch),
  // Entlastungswochen geben einen kleinen Bonus. Konstanten so gewählt,
  // dass ein normaler Plan am Tag X knapp über der Überlastungsgrenze (50)
  // landet und zu kurze Vorbereitungen darunter fallen.
  const RES_START = 50;
  const RES_LIMIT = 50;
  const RES_RATE = 0.15;
  const RES_DELOAD_BONUS = 2;
  const RES_TARGET = { grundlage: 85, aufbau: 68, wettkampf: 48, erhaltung: 30, taper: null, regeneration: 90 };

  const PHASE_OPACITY = {
    grundlage: 0.2, aufbau: 0.4, wettkampf: 0.7, erhaltung: 0.5, taper: 0.35, regeneration: 0.3
  };

  // Kürzt lange Eventnamen für Stellen mit wenig Platz (Zeitstrahl-Marker),
  // volle Namen bleiben in Fließtext/PDF-Titel/Aria-Label erhalten.
  function shortLabel(name, max) {
    return name.length > max ? name.slice(0, max - 1).trimEnd() + '…' : name;
  }
  // Greedy-Zeilenwahl für Labels: ein Label kommt in die erste Zeile, in
  // der es das vorherige Label nicht berührt; passt es nirgends, in die
  // Zeile, die am weitesten links endet. rows hält das rechte Ende je
  // Zeile und wird mutiert.
  function pickLabelRow(rows, left, right, gap) {
    let row = rows.findIndex((end) => left > end + gap);
    if (row === -1) row = rows.indexOf(Math.min.apply(null, rows));
    rows[row] = right;
    return row;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function genSpecText(general) { return general + ' / ' + (100 - general); }

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
  // Fuer <input type="date"> — braucht "YYYY-MM-DD" in lokaler Zeit, nicht toISOString()
  // (das wuerde bei UTC-Verschiebung auf den Vortag zurueckfallen koennen).
  function toISODateInput(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  function parseDateInput(value) { return startOfDay(new Date(value + 'T00:00:00')); }

  // Teilt totalDays nach Anteilen auf n Phasen auf (alle außer der letzten
  // auf ganze Wochen gerundet), jede Phase min. 7 Tage (sofern totalDays das
  // zulässt) — fehlende Tage der letzten Phase werden der größten genommen.
  function splitDays(totalDays, ratios) {
    const sum = ratios.reduce((s, r) => s + r, 0);
    const parts = ratios.slice(0, -1).map((r) => Math.round(totalDays * (r / sum) / 7) * 7);
    let last = totalDays - parts.reduce((s, d) => s + d, 0);
    let guard = 0;
    while (last < 7 && parts.some((d) => d > 7) && guard < 100) {
      let maxIdx = 0;
      parts.forEach((d, i) => { if (d > parts[maxIdx]) maxIdx = i; });
      parts[maxIdx] -= 7;
      last = totalDays - parts.reduce((s, d) => s + d, 0);
      guard++;
    }
    return parts.concat(last).map((d) => Math.max(7, d));
  }

  // Mesozyklen: Blöcke à ~4 Wochen (3 Belastung + 1 Entlastung), Blocklänge
  // 3–5 Wochen. Gibt die Startdaten der Entlastungswochen zurück. Die
  // Phase direkt vor dem Taper bekommt am Ende keine Entlastung — diese
  // Rolle übernimmt der Taper.
  function computeDeloads(start, days, beforeTaper) {
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return [];
    const n = Math.max(1, Math.round(weeks / 4));
    const base = Math.floor(weeks / n);
    const extra = weeks % n;
    const deloads = [];
    let cum = 0;
    for (let i = 0; i < n; i++) {
      cum += base + (i < extra ? 1 : 0);
      if (beforeTaper && i === n - 1) break;
      deloads.push(addDays(start, (cum - 1) * 7));
    }
    return deloads;
  }

  /* ── Rechenkern ───────────────────────────────────────────────── */
  function durationFor(mode, duration) {
    return MODE_CONFIG[mode].fixedDuration || DURATION_CONFIG[duration];
  }

  function buildPhase(key, start, days, ctx, extra) {
    const cfg = MODE_CONFIG[ctx.mode];
    const end = addDays(start, days - 1);
    return Object.assign({
      key, label: cfg.labels[key], opacity: PHASE_OPACITY[key],
      start, end, days, weeks: Math.max(1, Math.round(days / 7)),
      isPostRace: key === 'regeneration',
      endsAtRace: null,
      focusText: cfg.focusText(key, ctx),
      mainLine: cfg.mainLine[key],
      general: cfg.general[key],
      companionLabel: cfg.companionLabel,
      companion: cfg.companion[key],
      deloads: [],
      notes: []
    }, extra || {});
  }

  // Ein Zyklus von start bis raceDate (Rennen/Test selbst nicht enthalten):
  // Grundlage/Aufbau/Wettkampf (bzw. Erhaltung bei wenig Zeit) + Taper.
  // skipFirst: Block-Logik für den zweiten Zyklus nach einem A-Ziel —
  // die Ressourcen sind schon aufgebaut, es geht direkt mit Aufbau weiter.
  function buildCycle(start, raceDate, race, ctx, opts) {
    const totalDays = daysBetween(start, raceDate);
    const taperDays = ctx.dur.taperWeeks * 7;
    if (totalDays < taperDays) return { mode: 'tooClose', phases: [] };

    const preTaperDays = totalDays - taperDays;
    const phases = [];
    let cursor = start;
    let mode = 'full';

    if (preTaperDays < 7) {
      // Weniger als eine Woche vor dem Taper: der Taper beginnt einfach
      // früher, statt eine Mini-Phase hineinzuzwängen.
      mode = 'condensed';
    } else if (preTaperDays < 21) {
      mode = 'condensed';
      phases.push(buildPhase('erhaltung', cursor, preTaperDays, ctx));
      cursor = addDays(cursor, preTaperDays);
    } else {
      const keys = opts && opts.skipFirst ? BUILD_KEYS.slice(1) : BUILD_KEYS;
      const ratios = LEVEL_SPLIT[ctx.level].ratios.slice(BUILD_KEYS.length - keys.length);
      const daysArr = splitDays(preTaperDays, ratios);
      keys.forEach((key, i) => {
        const p = buildPhase(key, cursor, daysArr[i], ctx);
        p.deloads = computeDeloads(cursor, daysArr[i], i === keys.length - 1);
        phases.push(p);
        cursor = addDays(cursor, daysArr[i]);
      });
    }

    // Taper endet exakt einen Tag vor dem Rennen.
    const taper = buildPhase('taper', cursor, daysBetween(cursor, raceDate), ctx);
    taper.endsAtRace = race;
    phases.push(taper);
    return { mode, phases };
  }

  function computePlan(input) {
    const { startDate, tagXDate, mode, sport, level, duration, eventName, peak2 } = input;
    const dur = durationFor(mode, duration);
    const goalLabel = eventName || 'Tag X';
    const ctx = { mode, level, dur, sportAdj: sport ? SPORT_LABELS[sport].adj : '', goalLabel };
    const totalDays = daysBetween(startDate, tagXDate);
    const mainRace = { date: tagXDate, label: goalLabel, kind: 'main' };
    // focus = Ausdauer/Kraft; plan.mode (unten) = full/condensed/tooClose.
    const base = Object.assign({}, input, { focus: mode, weeksTotal: Math.round(totalDays / 7), markers: [], bMarker: null });

    let cycles;
    if (peak2 && peak2.kind === 'A') {
      const aRace = { date: peak2.date, label: peak2.name || '1. Höhepunkt', kind: 'A' };
      const c1 = buildCycle(startDate, peak2.date, aRace, Object.assign({}, ctx, { goalLabel: aRace.label }));
      const regenStart = addDays(peak2.date, 1);
      const regen1 = buildPhase('regeneration', regenStart, 7, ctx);
      const c2Start = addDays(regenStart, 7);
      const c2 = buildCycle(c2Start, tagXDate, mainRace, ctx, { skipFirst: daysBetween(c2Start, tagXDate) < 84 });
      cycles = [c1, { mode: 'full', phases: [regen1] }, c2];
    } else {
      cycles = [buildCycle(startDate, tagXDate, mainRace, ctx)];
    }

    if (cycles.some((c) => c.mode === 'tooClose')) {
      return Object.assign(base, { mode: 'tooClose', phases: [] });
    }

    const phases = [].concat.apply([], cycles.map((c) => c.phases));
    phases.push(buildPhase('regeneration', addDays(tagXDate, 1), dur.regenWeeks * 7, ctx));

    if (mode === 'strength' && level === 'beginner') {
      const first = phases[0];
      if (first && !first.isPostRace) first.notes.push('Als Einsteiger gilt: Technik vor Last.');
    }

    if (peak2 && peak2.kind === 'B') {
      const host = phases.find((p) => !p.isPostRace && p.start <= peak2.date && p.end >= peak2.date);
      const bLabel = peak2.name || 'Formtest';
      if (host) host.notes.push(bLabel + ' am ' + formatDate(peak2.date) + ': 3–4 Tage locker davor, danach normal weiter.');
      base.bMarker = { date: peak2.date, label: bLabel };
    }

    base.markers = phases.filter((p) => p.endsAtRace).map((p) => p.endsAtRace);
    const plan = Object.assign(base, {
      mode: cycles.some((c) => c.mode === 'condensed') ? 'condensed' : 'full',
      phases
    });
    plan.resources = computeResources(plan);
    return plan;
  }

  /* ── Ressourcen-Modell (schematisch) ──────────────────────────── */
  function computeResources(plan) {
    let R = RES_START;
    let belowBeforeRace = false;
    const lastRaceEnd = plan.phases.reduce((idx, p, i) => (p.endsAtRace && p.endsAtRace.kind === 'main' ? i : idx), -1);
    const weeks = [];
    plan.phases.forEach((p, pi) => {
      const deloadIdx = p.deloads.map((d) => Math.round(daysBetween(p.start, d) / 7));
      for (let w = 0; w < p.weeks; w++) {
        const target = RES_TARGET[p.key];
        if (target !== null) R += (target - R) * RES_RATE;
        const isDeload = deloadIdx.indexOf(w) !== -1;
        if (isDeload) R += RES_DELOAD_BONUS;
        R = Math.max(0, Math.min(100, R));
        if (pi <= lastRaceEnd && R < RES_LIMIT - 0.5) belowBeforeRace = true;
        weeks.push({ phaseIndex: pi, phase: p, weekStart: addDays(p.start, w * 7), general: p.general, R, isDeload });
      }
    });
    return { weeks, belowBeforeRace };
  }

  /* ── Geometrie: Phasen- und Wochen-Positionen auf der x-Achse ─── */
  // Heller Stil wie die Blog-Diagramme (kein dunkler Kasten), daher fast
  // volle Breite statt Innenabstand.
  const SVG_W = 640;
  const PLOT_X = 14, PLOT_END_X = 626, PLOT_W = PLOT_END_X - PLOT_X;

  function phaseGeometry(plan) {
    const totalWeeks = plan.phases.reduce((s, p) => s + p.weeks, 0);
    let x = PLOT_X;
    return plan.phases.map((p) => {
      const w = PLOT_W * (p.weeks / totalWeeks);
      const g = { x, w };
      x += w;
      return g;
    });
  }
  // x-Position eines Datums innerhalb der Phase, in die es fällt.
  function dateToX(plan, geo, date) {
    for (let i = 0; i < plan.phases.length; i++) {
      const p = plan.phases[i];
      if (date >= p.start && date <= p.end) {
        return geo[i].x + geo[i].w * (daysBetween(p.start, date) / p.days);
      }
    }
    return null;
  }

  /* ── Zeitstrahl (SVG) ─────────────────────────────────────────── */
  function renderTimeline(plan) {
    if (plan.mode === 'tooClose') {
      timelineEl.innerHTML =
        '<div class="plan-timeline-warning">Dein Ziel ist näher als eine sinnvolle Taper-Phase — ' +
        'starte am besten entspannt mit einer kurzen, lockeren Woche hinein, statt jetzt noch groß umzuplanen.</div>';
      return;
    }

    const bandY = 40, bandH = 14;
    const geo = phaseGeometry(plan);
    const lastIdx = plan.phases.length - 1;
    let rects = '', stripes = '', dividers = '', labels = '', markers = '';
    const labelRows = [-Infinity, -Infinity, -Infinity];
    const markerRows = [-Infinity, -Infinity];

    plan.phases.forEach((p, i) => {
      const { x, w } = geo[i];
      const fill = p.key === 'regeneration' ? 'var(--gray-light)' : 'var(--accent)';
      rects += '<rect x="' + x.toFixed(1) + '" y="' + bandY + '" width="' + Math.max(2, w).toFixed(1) + '" height="' + bandH + '" fill="' + fill + '" fill-opacity="' + Math.min(1, p.opacity + 0.15) + '"/>';
      p.deloads.forEach((d) => {
        const sx = x + w * (daysBetween(p.start, d) / p.days);
        const sw = w * (7 / p.days);
        stripes += '<rect x="' + sx.toFixed(1) + '" y="' + bandY + '" width="' + sw.toFixed(1) + '" height="' + bandH + '" fill="var(--white)" fill-opacity="0.6"/>';
      });
      if (i > 0) {
        dividers += '<line x1="' + x.toFixed(1) + '" y1="' + bandY + '" x2="' + x.toFixed(1) + '" y2="' + (bandY + bandH) + '" stroke="var(--white)" stroke-width="1.5"/>';
      }

      // Schmale Segmente: das Segment vor einem Rennen fließt nach links
      // (anchor=end), das danach nach rechts (anchor=start) — sonst
      // überlappen die Labels an der engen Rennstelle (siehe
      // [[saisonplan-feature]]-Bug-Learning). Passt ein Label trotzdem
      // nicht neben das vorherige (z.B. 3-Wochen-Peaking direkt vor einem
      // 1-Wochen-Taper), rutscht es in eine zweite Zeile.
      const cx = x + w / 2;
      const compact = w < 55;
      const fontSize = compact ? 9 : 10;
      let anchor = 'middle', labelX = cx;
      if (compact && p.endsAtRace) { anchor = 'end'; labelX = x + w - 3; }
      else if (compact && p.isPostRace) { anchor = 'start'; labelX = x + 3; }
      // Ab hier immer linksbündig an der berechneten Kante — so lässt sich
      // die Kante gleichzeitig am SVG-Rand festklemmen (sonst wird z.B.
      // eine 1-Wochen-Regeneration ganz rechts abgeschnitten).
      const textW = p.label.length * fontSize * 0.62;
      const rawLeft = anchor === 'start' ? labelX : anchor === 'end' ? labelX - textW : labelX - textW / 2;
      const left = Math.max(2, Math.min(SVG_W - 2 - textW, rawLeft));
      const labelY = [68, 92, 104][pickLabelRow(labelRows, left, left + textW, 6)];

      labels += '<text x="' + left.toFixed(1) + '" y="' + labelY + '" font-family="var(--font-cond)" font-size="' + fontSize + '" font-weight="600" letter-spacing="0.05em" fill="var(--black)">' + escapeHtml(p.label.toUpperCase()) + '</text>';
      if (!compact) {
        labels += '<text x="' + cx.toFixed(1) + '" y="79" text-anchor="middle" font-family="var(--font-cond)" font-size="8.5" letter-spacing="0.02em" fill="var(--gray)">' + p.weeks + ' Wo.</text>';
      }

      if (p.endsAtRace) {
        const mx = x + w;
        // Zwei Rennen nah beieinander: zweite Beschriftung eine Zeile höher.
        // Name + Datum zentriert über dem Marker, am SVG-Rand festgeklemmt;
        // überlappt die Beschriftung die vorige, rutscht sie eine Zeile höher.
        const name = shortLabel(p.endsAtRace.label, 18).toUpperCase();
        const textW = (name.length + 8) * 10 * 0.6;
        const left = Math.max(2, Math.min(SVG_W - 2 - textW, mx - textW / 2));
        const labelYm = pickLabelRow(markerRows, left, left + textW, 8) === 0 ? 28 : 12;
        markers +=
          '<line x1="' + mx.toFixed(1) + '" y1="' + (labelYm + 4) + '" x2="' + mx.toFixed(1) + '" y2="' + bandY + '" stroke="var(--black)" stroke-width="1.2" stroke-dasharray="2 3"/>' +
          '<circle cx="' + mx.toFixed(1) + '" cy="' + bandY + '" r="3" fill="var(--black)"/>' +
          '<text x="' + left.toFixed(1) + '" y="' + labelYm + '" font-family="var(--font-cond)" font-size="10" font-weight="700" letter-spacing="0.06em" fill="var(--black)">' + escapeHtml(shortLabel(p.endsAtRace.label, 18).toUpperCase()) +
          '<tspan font-weight="400" fill="var(--gray)"> · ' + formatDateShort(p.endsAtRace.date) + '</tspan></text>';
      }
    });

    if (plan.bMarker) {
      const bx = dateToX(plan, geo, plan.bMarker.date);
      if (bx !== null) {
        const nearEnd = bx > PLOT_END_X - 90;
        markers +=
          '<path d="M' + bx.toFixed(1) + ' ' + (bandY - 1) + ' l-4 -6 h8 z" fill="var(--black)"/>' +
          '<text x="' + (nearEnd ? bx - 8 : bx + 8).toFixed(1) + '" y="' + (bandY - 4) + '" text-anchor="' + (nearEnd ? 'end' : 'start') + '" font-family="var(--font-cond)" font-size="9" letter-spacing="0.06em" fill="var(--gray)">B · ' + escapeHtml(shortLabel(plan.bMarker.label, 18).toUpperCase()) + ' ' + formatDateShort(plan.bMarker.date) + '</text>';
      }
    }

    const svg =
      '<svg viewBox="0 0 640 126" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      rects + stripes + dividers + labels + markers +
      '<text x="' + PLOT_X + '" y="122" font-family="var(--font-cond)" font-size="9" letter-spacing="0.06em" fill="var(--gray)">START · ' + formatDateShort(plan.startDate) + '</text>' +
      '<text x="' + PLOT_END_X + '" y="122" text-anchor="end" font-family="var(--font-cond)" font-size="9" letter-spacing="0.06em" fill="var(--gray)">' + formatDateShort(plan.phases[lastIdx].end) + '</text>' +
      '</svg>';

    const hasDeloads = plan.phases.some((p) => p.deloads.length);
    const ariaLabel = 'Zeitstrahl deines Saisonplans mit den Phasen ' +
      plan.phases.map((p) => p.label + ' (' + weekLabel(p.weeks) + ')').join(', ') +
      ', mit ' + plan.markers.map((m) => m.label + ' am ' + formatDate(m.date)).join(' und ') +
      (plan.bMarker ? ', Formtest ' + plan.bMarker.label + ' am ' + formatDate(plan.bMarker.date) : '') + '.';

    timelineEl.innerHTML =
      '<div class="plan-timeline-svg-wrap" role="img" aria-label="' + escapeHtml(ariaLabel) + '">' + svg + '</div>' +
      '<p class="plan-timeline-caption">Von deinem Startdatum (' + formatDate(plan.startDate) + ') bis ' + escapeHtml(plan.markers[plan.markers.length - 1].label) + ' (' + formatDate(plan.tagXDate) + ') und der Regeneration danach.' +
      (hasDeloads ? ' Helle Streifen = Entlastungswochen am Ende jedes Blocks.' : '') + '</p>';
  }

  /* ── Ressourcen-Kurve (SVG) ───────────────────────────────────────
     Schematische Erklär-Grafik: Anteil ressourcen-aufbauender (allgemein)
     vs. ressourcen-verwendender (spezifisch) Inhalte + verfügbare
     Ressourcen. Gleiche x-Achse wie der Zeitstrahl. Heller Stil wie die
     Blog-Diagramme (Paul-Feedback 2026-10-02: dunkle Kästen zu wuchtig):
     Aufbau/Verwendung grau, unterschieden über Linienstil + Direktlabels,
     verfügbare Ressourcen als schwarze Linie mit gelber Fläche. */
  const CHART_COLORS = { build: '#9a9a9a', use: '#9a9a9a', res: 'var(--black)' };
  const CHART_TOP = 8, CHART_BOTTOM = 118;
  function yFor(v) { return CHART_BOTTOM - (CHART_BOTTOM - CHART_TOP) * (v / 100); }

  // Monotone kubische Interpolation (Fritsch–Carlson) — glättet ohne
  // Überschwingen, wichtig bei den stufenförmigen Phasen-Anteilen.
  function smoothPath(pts) {
    const n = pts.length;
    if (n < 2) return '';
    const dx = [], m = [], t = new Array(n);
    for (let i = 0; i < n - 1; i++) {
      dx.push(pts[i + 1][0] - pts[i][0]);
      m.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1));
    }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += ' C' + (pts[i][0] + h).toFixed(1) + ' ' + (pts[i][1] + t[i] * h).toFixed(1) + ' ' +
        (pts[i + 1][0] - h).toFixed(1) + ' ' + (pts[i + 1][1] - t[i + 1] * h).toFixed(1) + ' ' +
        pts[i + 1][0].toFixed(1) + ' ' + pts[i + 1][1].toFixed(1);
    }
    return d;
  }

  function renderResourceChart(plan) {
    if (plan.mode === 'tooClose') { resourcesEl.innerHTML = ''; return; }

    const weeks = plan.resources.weeks;
    const n = weeks.length;
    const stepW = PLOT_W / n;
    const cx = (i) => PLOT_X + stepW * (i + 0.5);
    const buildPts = [[PLOT_X, yFor(weeks[0].general)]];
    const usePts = [[PLOT_X, yFor(100 - weeks[0].general)]];
    const resPts = [[PLOT_X, yFor(RES_START)]];
    weeks.forEach((wk, i) => {
      buildPts.push([cx(i), yFor(wk.general)]);
      usePts.push([cx(i), yFor(100 - wk.general)]);
      resPts.push([cx(i), yFor(wk.R)]);
    });
    buildPts.push([PLOT_END_X, yFor(weeks[n - 1].general)]);
    usePts.push([PLOT_END_X, yFor(100 - weeks[n - 1].general)]);

    const geo = phaseGeometry(plan);
    let raceLines = '';
    plan.phases.forEach((p, i) => {
      if (!p.endsAtRace) return;
      const mx = geo[i].x + geo[i].w;
      raceLines += '<line x1="' + mx.toFixed(1) + '" y1="' + CHART_TOP + '" x2="' + mx.toFixed(1) + '" y2="' + CHART_BOTTOM + '" stroke="var(--black)" stroke-opacity="0.5" stroke-width="1" stroke-dasharray="2 3"/>';
    });

    let hits = '';
    weeks.forEach((wk, i) => {
      hits += '<rect class="plan-res-hit" data-i="' + i + '" x="' + (PLOT_X + stepW * i).toFixed(1) + '" y="' + CHART_TOP + '" width="' + stepW.toFixed(1) + '" height="' + (CHART_BOTTOM - CHART_TOP) + '" fill="transparent"/>';
    });

    // Direktlabels im ersten Block, wo die drei Linien sicher getrennt sind.
    const lx = PLOT_X + 6;
    const directLabels =
      '<text x="' + lx + '" y="' + (yFor(weeks[0].general) - 7).toFixed(1) + '" font-family="var(--font-cond)" font-size="9" font-weight="600" letter-spacing="0.06em" fill="var(--black)">AUFBAU</text>' +
      '<text x="' + lx + '" y="' + (yFor(100 - weeks[0].general) + 14).toFixed(1) + '" font-family="var(--font-cond)" font-size="9" font-weight="600" letter-spacing="0.06em" fill="var(--black)">VERWENDUNG</text>';

    // Gelbe Fläche unter der Ressourcen-Linie (bis zum Ende des Plans).
    const resPath = smoothPath(resPts);
    const resArea = resPath + ' L' + resPts[resPts.length - 1][0].toFixed(1) + ' ' + CHART_BOTTOM + ' L' + PLOT_X + ' ' + CHART_BOTTOM + ' Z';

    const svg =
      '<svg viewBox="0 0 640 134" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="' + resArea + '" fill="var(--accent)" fill-opacity="0.55"/>' +
      '<line x1="' + PLOT_X + '" y1="' + CHART_BOTTOM + '" x2="' + PLOT_END_X + '" y2="' + CHART_BOTTOM + '" stroke="var(--gray-light)" stroke-width="1"/>' +
      '<line x1="' + PLOT_X + '" y1="' + yFor(RES_LIMIT) + '" x2="' + PLOT_END_X + '" y2="' + yFor(RES_LIMIT) + '" stroke="var(--black)" stroke-width="1" stroke-dasharray="2 4"/>' +
      '<text x="' + (PLOT_X + 4) + '" y="' + (yFor(RES_LIMIT) + 11) + '" font-family="var(--font-cond)" font-size="8.5" letter-spacing="0.06em" fill="var(--gray)">ÜBERLASTUNGSGRENZE</text>' +
      raceLines +
      '<path d="' + smoothPath(buildPts) + '" fill="none" stroke="' + CHART_COLORS.build + '" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="' + smoothPath(usePts) + '" fill="none" stroke="' + CHART_COLORS.use + '" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round"/>' +
      '<path d="' + resPath + '" fill="none" stroke="' + CHART_COLORS.res + '" stroke-width="2" stroke-linecap="round"/>' +
      directLabels +
      '<line class="plan-res-cross" x1="0" y1="' + CHART_TOP + '" x2="0" y2="' + CHART_BOTTOM + '" stroke="var(--black)" stroke-opacity="0.4" stroke-width="1" visibility="hidden"/>' +
      hits +
      '<text x="' + PLOT_X + '" y="132" font-family="var(--font-cond)" font-size="9" letter-spacing="0.06em" fill="var(--gray)">SCHEMATISCH · KEINE MESSWERTE</text>' +
      '</svg>';

    const legend =
      '<div class="plan-res-legend">' +
      '<span><i class="plan-res-swatch plan-res-swatch--build"></i>Ressourcen aufbauen (allgemein)</span>' +
      '<span><i class="plan-res-swatch plan-res-swatch--use"></i>Ressourcen verwenden (spezifisch)</span>' +
      '<span><i class="plan-res-swatch plan-res-swatch--res"></i>Verfügbare Ressourcen</span>' +
      '</div>';

    const warning = plan.resources.belowBeforeRace
      ? '<div class="plan-timeline-warning plan-res-warning">Achtung, Raubbau: In diesem Plan bleibt zu wenig Zeit, um Ressourcen aufzubauen — du zehrst vor allem von dem, was schon da ist. ' +
        'Das geht einmal gut, über mehrere Saisons hinweg aber auf Kosten von Form und Gesundheit. Mehr Vorlauf, ' +
        (plan.peak2 && plan.peak2.kind === 'A' ? 'den ersten Höhepunkt als B-Ziel ' : 'ein späteres Ziel ') + 'oder eine echte Regeneration danach helfen.</div>'
      : '';

    resourcesEl.innerHTML =
      '<h3 class="plan-res-title">RESSOURCEN-VERLAUF</h3>' +
      legend +
      '<div class="plan-timeline-svg-wrap plan-res-wrap" role="img" aria-label="Schematischer Ressourcen-Verlauf: Anteil allgemeiner Inhalte sinkt von Phase zu Phase, spezifische Inhalte steigen; verfügbare Ressourcen ' +
      (plan.resources.belowBeforeRace ? 'fallen vor dem Ziel unter die Überlastungsgrenze.' : 'landen zum Ziel knapp über der Überlastungsgrenze.') + ' Die Werte je Phase stehen in der Tabelle unten.">' +
      svg + '<div class="plan-res-tip" hidden></div></div>' +
      '<p class="plan-timeline-caption">Erst Ressourcen aufbauen, dann gezielt einsetzen: Die verfügbaren Ressourcen sollen zum Ziel möglichst voll genutzt werden, ohne unter die Überlastungsgrenze zu fallen. Danach wird wieder aufgefüllt.</p>' +
      warning;

    wireResourceHover(plan);
  }

  function wireResourceHover(plan) {
    const wrap = resourcesEl.querySelector('.plan-res-wrap');
    const tip = resourcesEl.querySelector('.plan-res-tip');
    const cross = resourcesEl.querySelector('.plan-res-cross');
    if (!wrap || !tip || !cross) return;
    const weeks = plan.resources.weeks;

    function show(rect) {
      const wk = weeks[Number(rect.dataset.i)];
      const x = parseFloat(rect.getAttribute('x')) + parseFloat(rect.getAttribute('width')) / 2;
      cross.setAttribute('x1', x.toFixed(1));
      cross.setAttribute('x2', x.toFixed(1));
      cross.setAttribute('visibility', 'visible');
      tip.innerHTML =
        '<strong>' + escapeHtml(wk.phase.label.toUpperCase()) + (wk.isDeload ? ' · ENTLASTUNG' : '') + '</strong>' +
        '<span>Woche ab ' + formatDateShort(wk.weekStart) + '</span>' +
        '<span>Allgemein ' + wk.general + ' % · Spezifisch ' + (100 - wk.general) + ' %</span>';
      tip.hidden = false;
      const wrapBox = wrap.getBoundingClientRect();
      const box = rect.getBoundingClientRect();
      const left = box.left - wrapBox.left + wrap.scrollLeft + box.width / 2;
      const maxLeft = wrap.scrollWidth - tip.offsetWidth - 8;
      tip.style.left = Math.max(8, Math.min(maxLeft, left - tip.offsetWidth / 2)) + 'px';
    }
    function hide() {
      tip.hidden = true;
      cross.setAttribute('visibility', 'hidden');
    }
    resourcesEl.querySelectorAll('.plan-res-hit').forEach((r) => {
      r.addEventListener('pointerenter', () => show(r));
    });
    wrap.addEventListener('pointerleave', hide);
  }

  /* ── Phasen-Tabelle ───────────────────────────────────────────────
     Schlichte Tabelle statt voller Farbkarten (gleicher Standard wie
     [[intervalle-feature]]: .cp-protocol-table, farbiger linker Rand
     statt Farbfläche) — einheitliches Muster über alle Rechner-Tools.
     Dient gleichzeitig als Tabellen-Ansicht der Ressourcen-Kurve. */
  function detailLine(p) {
    return 'Allgemein/Spezifisch ' + genSpecText(p.general) + ' · ' + p.companionLabel + ': ' + p.companion;
  }
  function deloadLine(p) {
    return p.deloads.length ? 'Entlastung: ' + p.deloads.map((d) => 'ab ' + formatDateShort(d)).join(', ') : '';
  }

  function phaseRowHTML(p, bg) {
    const style = 'border-left: 4px solid ' + bg + ';';
    const meta = formatDate(p.start) + ' – ' + formatDate(p.end) + ' · ' + weekLabel(p.weeks) + ' · ' + p.mainLine;
    const extra = [detailLine(p), deloadLine(p)].concat(p.notes).filter(Boolean)
      .map((t) => '<span class="plan-phase-detail">' + escapeHtml(t) + '</span>').join('');
    return (
      '<div class="cp-protocol-row interval-row--group-start" style="' + style + '">' +
      '<div class="cp-protocol-label">' + escapeHtml(p.label) + '</div>' +
      '<div>' + escapeHtml(meta) + '</div><div></div>' +
      '</div>' +
      '<div class="cp-protocol-row interval-note-row" style="' + style + '">' +
      '<div></div><div class="interval-zone-note">' + escapeHtml(p.focusText) + extra + '</div>' +
      '</div>'
    );
  }

  function renderPhaseCards(plan) {
    if (plan.mode === 'tooClose') {
      phaseCardsEl.innerHTML = '';
      return;
    }
    const head = '<div class="cp-protocol-row cp-protocol-row-head"><div>PHASE</div><div>ZEITRAUM</div><div></div></div>';
    const rows = plan.phases.map((p, i) => phaseRowHTML(p, RechnerUtils.hexMix('#f5f4f0', '#ffe55c', i / (plan.phases.length - 1 || 1)))).join('');
    phaseCardsEl.innerHTML = head + rows;
  }

  /* ── Modus-/Sportart-/Pill-Auswahl ────────────────────────────── */
  function updateIntro() {
    sportIntroEl.textContent = currentMode === 'strength' ? STRENGTH_INTRO : SPORT_INTRO[currentSport];
  }

  function switchSport(sport) {
    currentSport = sport;
    tabs.forEach((t) => {
      const active = t.dataset.sport === sport;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    updateIntro();
  }
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => switchSport(btn.dataset.sport));
  });

  function switchMode(mode) {
    currentMode = mode;
    const strength = mode === 'strength';
    sportBlock.hidden = strength;
    durationField.hidden = strength;
    ctaSets.forEach((el) => { el.hidden = el.dataset.mode !== mode; });
    updateIntro();
  }

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
  wirePillGroup(modeGroup, 'mode', switchMode);
  wirePillGroup(levelGroup, 'level', (v) => { currentLevel = v; });
  wirePillGroup(durationGroup, 'duration', (v) => { currentDuration = v; });
  wirePillGroup(peak2KindGroup, 'kind', (v) => { currentPeak2Kind = v; });

  /* ── Validierung & Submit ─────────────────────────────────────── */
  startTodayBtn.addEventListener('click', () => {
    startInput.value = toISODateInput(new Date());
  });

  function clearFieldError(row, errorEl) {
    row.classList.remove('is-invalid');
    errorEl.textContent = '';
  }
  function setFieldError(row, errorEl, msg) {
    row.classList.add('is-invalid');
    errorEl.textContent = msg;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    RechnerUtils.hideErrorSummary(errorSummary);
    clearFieldError(startRow, startError);
    clearFieldError(tagXRow, tagXError);
    clearFieldError(peak2Row, peak2Error);

    const errors = [];
    let startDate = null, tagXDate = null, peak2 = null;

    if (!startInput.value) {
      errors.push('Bitte ein Startdatum angeben.');
      setFieldError(startRow, startError, errors[errors.length - 1]);
    } else {
      startDate = parseDateInput(startInput.value);
    }

    if (!tagXInput.value) {
      errors.push('Bitte ein Zieldatum (Tag X) angeben.');
      setFieldError(tagXRow, tagXError, errors[errors.length - 1]);
    } else {
      tagXDate = parseDateInput(tagXInput.value);
    }

    if (startDate && tagXDate) {
      const days = daysBetween(startDate, tagXDate);
      if (days < 1) {
        errors.push('Tag X muss nach dem Startdatum liegen.');
        startRow.classList.add('is-invalid');
        setFieldError(tagXRow, tagXError, errors[errors.length - 1]);
      } else if (days > 730) {
        errors.push('Tag X liegt mehr als 2 Jahre nach dem Startdatum — bitte näher beieinanderliegende Daten wählen.');
        setFieldError(tagXRow, tagXError, errors[errors.length - 1]);
      }
    }

    // 2. Höhepunkt zählt nur, wenn der Bereich offen ist und ein Datum hat.
    if (errors.length === 0 && peak2Details.open && peak2DateInput.value) {
      const p2Date = parseDateInput(peak2DateInput.value);
      const taperDays = durationFor(currentMode, currentDuration).taperWeeks * 7;
      let msg = '';
      if (p2Date <= startDate || p2Date >= tagXDate) {
        msg = 'Der 2. Höhepunkt muss zwischen Startdatum und Tag X liegen.';
      } else if (currentPeak2Kind === 'A' && daysBetween(startDate, p2Date) < taperDays + 7) {
        msg = 'Der 2. Höhepunkt liegt zu nah am Startdatum für ein A-Ziel — wähle B-Ziel oder ein späteres Datum.';
      } else if (currentPeak2Kind === 'A' && daysBetween(p2Date, tagXDate) < 8 + taperDays + 21) {
        msg = 'Für zwei A-Ziele ist der Abstand zu knapp (Taper, Erholung und neuer Aufbau brauchen Zeit) — wähle B-Ziel oder ein früheres Datum.';
      }
      if (msg) {
        errors.push(msg);
        setFieldError(peak2Row, peak2Error, msg);
      } else {
        peak2 = { date: p2Date, name: peak2NameInput.value.trim() || null, kind: currentPeak2Kind };
      }
    }

    if (errors.length > 0) {
      RechnerUtils.showErrorSummary(errorSummary, errors);
      return;
    }

    const eventName = eventInput.value.trim() || null;
    const strength = currentMode === 'strength';
    const plan = computePlan({
      startDate, tagXDate, mode: currentMode, sport: strength ? null : currentSport,
      level: currentLevel, duration: strength ? null : currentDuration, eventName, peak2
    });
    lastPlanData = plan;

    const goalLabel = eventName || 'Tag X';
    const parts = [
      weekLabel(plan.weeksTotal) + ' bis ' + goalLabel + ' (' + formatDate(tagXDate) + ')',
      strength ? 'Kraft' : MODE_CONFIG.endurance.label + ' · ' + SPORT_LABELS[currentSport].name,
      LEVEL_SPLIT[currentLevel].label
    ];
    if (!strength) parts.push(DURATION_CONFIG[currentDuration].label);
    if (peak2) parts.push((peak2.kind === 'A' ? 'A-Ziel ' : 'B-Ziel ') + (peak2.name || '') + (peak2.name ? ' ' : '') + formatDate(peak2.date));
    resultsSub.textContent = parts.join(' · ');

    renderTimeline(plan);
    renderResourceChart(plan);
    renderPhaseCards(plan);

    resultsSection.hidden = false;
    resultsSection.classList.add('is-visible');

    const offset = document.getElementById('site-header').offsetHeight;
    const top = resultsSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  /* ── PDF-Export ──────────────────────────────────────────────────
     Wie beim CP-Rechner per jsPDF statt Browser-Druckdialog (siehe
     js/cp-rechner.js für die ausführliche Begründung). Der Saisonplan ist
     realistisch mehrseitig — ensureSpace()/addPage() wird hier tatsächlich
     mehrfach ausgelöst, mit schlankem Fortsetzungs-Kopf auf Folgeseiten.
     Die Ressourcen-Kurve bleibt bewusst nur am Bildschirm (Erklär-Grafik);
     ihre Werte stehen in den Phasenkarten. */
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
    const plan = lastPlanData;
    const { doc, state } = PdfUtils.createDoc('SAISONPLAN');
    const { BLACK, ACCENT, GRAY } = PdfUtils.COLORS;

    // Fortsetzungs-Kopf auf Folgeseiten, statt einfach mit y=18 weiterzuschreiben.
    function onPageBreak(d, s) {
      d.setFont('helvetica', 'bold');
      d.setFontSize(9);
      d.setTextColor.apply(d, GRAY);
      d.text('SAISONPLAN — FORTSETZUNG', s.marginX, s.y);
      s.y += 10;
    }
    const ensureSpace = PdfUtils.makeEnsureSpace(doc, state, onPageBreak);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, GRAY);
    doc.text('DEIN SAISONPLAN · FOKUS ' + MODE_CONFIG[plan.focus].label.toUpperCase(), state.marginX, state.y);
    state.y += 8;

    // Lange Eventnamen (statt "Tag X") koennten die Titelzeile sonst ueber
    // den Seitenrand hinausschieben -- bei Bedarf auf 2 Zeilen umbrechen.
    const goalLabelPdf = plan.eventName || 'Tag X';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor.apply(doc, BLACK);
    const titleLines = doc.splitTextToSize((goalLabelPdf + ': ' + formatDate(plan.tagXDate)).toUpperCase(), state.contentW);
    doc.text(titleLines, state.marginX, state.y);
    state.y += 9 + (titleLines.length - 1) * 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, GRAY);
    const subLines = doc.splitTextToSize(resultsSub.textContent, state.contentW);
    doc.text(subLines, state.marginX, state.y);
    state.y += subLines.length * 5 + 8;

    // Zeitstrahl — vektorbasiert nachgebaut (kein SVG-Embed nötig), spiegelt
    // die Bildschirm-Grafik (Phasenbänder, Entlastungsstreifen, Marker).
    const bandH = 12;
    ensureSpace(bandH + 30);
    const bandY = state.y + 10;
    const totalWeeks = plan.phases.reduce((s, p) => s + p.weeks, 0);
    let x = state.marginX;
    const pdfLabelRows = [-Infinity, -Infinity, -Infinity];
    const pdfMarkerRows = [-Infinity, -Infinity];
    const pageRight = state.marginX + state.contentW;

    plan.phases.forEach((p, i) => {
      const w = state.contentW * (p.weeks / totalWeeks);
      const tint = p.key === 'regeneration' ? '#cccccc' : '#ffe55c';
      doc.setFillColor.apply(doc, PdfUtils.hexToRgb(RechnerUtils.hexMix('#ffffff', tint, p.opacity)));
      doc.rect(x, bandY, w, bandH, 'F');
      p.deloads.forEach((d) => {
        doc.setFillColor(255, 255, 255);
        doc.rect(x + w * (daysBetween(p.start, d) / p.days), bandY, w * (7 / p.days), bandH, 'F');
      });
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.rect(x, bandY, w, bandH, 'S');

      // Schmale Segmente (< 20mm, z.B. 1-Wochen-Taper) bekommen wie im
      // SVG rechts-/linksbündige Labels statt zentriert, sonst kollidieren
      // benachbarte kurze Phasen (siehe [[saisonplan-feature]]-Bug-Learning).
      const compact = w < 20;
      let labelAlign = 'center', labelX = x + w / 2;
      if (compact && p.endsAtRace) { labelAlign = 'right'; labelX = x + w - 1.5; }
      else if (compact && p.isPostRace) { labelAlign = 'left'; labelX = x + 1.5; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const textW = doc.getTextWidth(p.label.toUpperCase());
      // Wie im SVG: linke Kante berechnen, am Seitenrand festklemmen.
      const rawLeft = labelAlign === 'left' ? labelX : labelAlign === 'right' ? labelX - textW : labelX - textW / 2;
      const left = Math.max(state.marginX, Math.min(pageRight - textW, rawLeft));
      const labelY = bandY + bandH + [5, 13, 17][pickLabelRow(pdfLabelRows, left, left + textW, 1.5)];
      doc.setTextColor.apply(doc, BLACK);
      doc.text(p.label.toUpperCase(), left, labelY);
      if (!compact) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor.apply(doc, GRAY);
        doc.text(weekLabel(p.weeks), x + w / 2, bandY + bandH + 9, { align: 'center' });
      }

      if (p.endsAtRace) {
        const markX = x + w;
        const name = shortLabel(p.endsAtRace.label, 22).toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const nameW = doc.getTextWidth(name);
        const nameLeft = Math.max(state.marginX, Math.min(pageRight - nameW, markX - nameW / 2));
        const textY = pickLabelRow(pdfMarkerRows, nameLeft, nameLeft + nameW, 2) === 0 ? bandY - 7 : bandY - 11;
        doc.setDrawColor.apply(doc, BLACK);
        doc.setLineWidth(0.4);
        doc.line(markX, textY + 2, markX, bandY);
        doc.setTextColor.apply(doc, BLACK);
        doc.text(name, nameLeft, textY);
      }
      x += w;
    });

    if (plan.bMarker) {
      // Gleiche Datum→x-Logik wie dateToX(), nur in mm statt SVG-Einheiten.
      let bx = null, px = state.marginX;
      plan.phases.forEach((p) => {
        const w = state.contentW * (p.weeks / totalWeeks);
        if (bx === null && plan.bMarker.date >= p.start && plan.bMarker.date <= p.end) {
          bx = px + w * (daysBetween(p.start, plan.bMarker.date) / p.days);
        }
        px += w;
      });
      if (bx !== null) {
        doc.setFillColor.apply(doc, BLACK);
        doc.triangle(bx - 1.5, bandY - 3, bx + 1.5, bandY - 3, bx, bandY, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor.apply(doc, GRAY);
        doc.text('B · ' + shortLabel(plan.bMarker.label, 18).toUpperCase(), bx, bandY - 4, { align: bx > state.marginX + state.contentW - 30 ? 'right' : 'left' });
      }
    }

    state.y = bandY + bandH + 22;

    // Phasen, volle Breite je Karte. Dünner Akzentstreifen statt
    // vollflächigem schwarzen Kasten — sieht gedruckt/als PDF sauberer aus.
    // Kartenhöhe ergibt sich aus der Zeilenanzahl (Detail-/Entlastungs-/
    // Hinweiszeilen variieren je Phase).
    const innerW = state.contentW - 15;
    plan.phases.forEach((p) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const focusLines = doc.splitTextToSize(p.focusText, innerW).slice(0, 3);
      doc.setFontSize(8.5);
      const extraLines = [].concat.apply([], [detailLine(p), deloadLine(p)].concat(p.notes).filter(Boolean)
        .map((t) => doc.splitTextToSize(t, innerW)));
      const cardH = 25 + focusLines.length * 4.6 + extraLines.length * 4.2;
      ensureSpace(cardH + 5);

      doc.setDrawColor(225, 225, 225);
      doc.setLineWidth(0.3);
      doc.rect(state.marginX, state.y, state.contentW, cardH, 'S');
      doc.setFillColor.apply(doc, ACCENT);
      doc.rect(state.marginX, state.y, 3, cardH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(p.label.toUpperCase(), state.marginX + 9, state.y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(formatDate(p.start) + ' – ' + formatDate(p.end) + '  ·  ' + weekLabel(p.weeks) + '  ·  ' + p.mainLine, state.marginX + 9, state.y + 16);

      let ty = state.y + 23;
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(focusLines, state.marginX + 9, ty);
      ty += focusLines.length * 4.6 + 1;

      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(extraLines, state.marginX + 9, ty);

      state.y += cardH + 5;
    });

    state.y += 4;
    ensureSpace(16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor.apply(doc, GRAY);
    const discLines = doc.splitTextToSize(DISCLAIMER_TEXT, state.contentW);
    doc.text(discLines, state.marginX, state.y);

    PdfUtils.saveWithStamp(doc, 'Saisonplan', plan.sport || 'kraft');
  }

  exportPdfBtn.addEventListener('click', generatePdf);

  /* ── Init ────────────────────────────────────────────────────── */
  startInput.value = toISODateInput(new Date());
  switchSport('bike');
  switchMode('endurance');
})();
