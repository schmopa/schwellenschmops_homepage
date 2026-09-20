/* SCHWELLENSCHMOPS — pdf-utils.js
   Geteiltes PDF-Pagination-Gerüst für die Rechner-Tools (jsPDF, per CDN
   geladen). Vorher in allen drei generatePdf()-Implementierungen einzeln
   kopiert (und dabei bereits einmal divergiert — siehe saisonplan.js).
   Nach dem jsPDF-CDN-Script-Tag, vor dem jeweiligen <tool>.js laden. */

window.PdfUtils = (function () {
  'use strict';

  const COLORS = { BLACK: [10, 10, 10], ACCENT: [255, 229, 92], GRAY: [120, 120, 120] };

  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  // Erzeugt das Dokument + Standard-Geometrie und schreibt die "ERSTELLT
  // AM …"-Stempelzeile, die auf allen drei Tools identisch ist (nur der
  // Tool-Pfad im Label unterscheidet sich).
  function createDoc(toolPathLabel) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const marginX = 18;
    const state = {
      y: 18,
      pageH: doc.internal.pageSize.getHeight(),
      marginX,
      marginBottom: 18,
      contentW: doc.internal.pageSize.getWidth() - marginX * 2
    };

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, COLORS.GRAY);
    doc.text(
      'ERSTELLT AM ' + new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        '  ·  SCHWELLENSCHMOPS.AT/' + toolPathLabel,
      state.marginX, state.y
    );
    state.y += 11;

    return { doc, state };
  }

  // Gibt eine ensureSpace(h)-Closure zurück, die bei Bedarf eine neue Seite
  // anfängt (state.y wird dabei mutiert). onPageBreak(doc, state) — optional
  // — läuft direkt danach, z.B. um eine Tabellenkopfzeile oder ein
  // "FORTSETZUNG"-Label neu zu zeichnen.
  function makeEnsureSpace(doc, state, onPageBreak) {
    return function ensureSpace(h) {
      if (state.y + h > state.pageH - state.marginBottom) {
        doc.addPage();
        state.y = 18;
        if (onPageBreak) onPageBreak(doc, state);
      }
    };
  }

  function saveWithStamp(doc, prefix, suffix) {
    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(prefix + '_' + suffix + '_' + stamp + '.pdf');
  }

  return { COLORS, hexToRgb, createDoc, makeEnsureSpace, saveWithStamp };
})();
