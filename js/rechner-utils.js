/* SCHWELLENSCHMOPS — rechner-utils.js
   Geteilte Utility-Funktionen für die Rechner-Tools (CP-Rechner,
   Intervallrechner, Saisonplan) — vorher in allen drei Tool-Dateien
   einzeln kopiert. Vor dem jeweiligen <tool>.js-Script-Tag laden. */

window.RechnerUtils = (function () {
  'use strict';

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

  // Nimmt das Ziel-Element als Parameter statt es zu schließen — jede
  // Tool-Seite hat eine andere Error-Summary-Element-ID.
  function showErrorSummary(el, messages) {
    el.innerHTML = messages.map((m) => '<p>' + m + '</p>').join('');
    el.hidden = false;
  }

  function hideErrorSummary(el) {
    el.hidden = true;
    el.innerHTML = '';
  }

  return {
    parseTime, formatTimeDigits, formatTime, parseNumber, round, hexMix,
    showErrorSummary, hideErrorSummary
  };
})();
