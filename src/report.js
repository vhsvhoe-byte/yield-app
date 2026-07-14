import { logoSvg, POLLMEIER_RED, POLLMEIER_BLACK } from "./components/Logo.jsx";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const statusLabel = (part, T) => {
  if (part.valid) return T.statusValid;
  if (!part.insideBoard) return T.statusOutside;
  if (part.overlapsDefect) return T.statusDefect;
  return T.statusOverlap;
};

/** Opens a branded, printable report in a new tab. Returns false if the pop-up was blocked. */
export const openReport = ({ T, locale, svgMarkup, board, parts, defects, sawKerfMm, boardAreaMm2, validAreaMm2, yieldPercent }) => {
  const win = window.open("", "_blank");
  if (!win) return false;

  const dateText = new Date().toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  const rows = parts
    .map(
      (p, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(p.name)}</td>
        <td class="num">${Math.round(p.lengthMm)}</td>
        <td class="num">${Math.round(p.widthMm)}</td>
        <td class="num">${(p.areaMm2 / 1e6).toFixed(3)}</td>
        <td>${p.valid ? "✓ " : "✗ "}${statusLabel(p, T)}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>${T.reportTitle} – Pollmeier</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: ${POLLMEIER_BLACK}; margin: 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid ${POLLMEIER_RED}; padding-bottom: 14px; margin-bottom: 20px; }
  h1 { font-size: 22px; margin: 10px 0 2px; }
  .meta { color: #55554f; font-size: 12px; line-height: 1.6; text-align: right; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
  .kpi { border: 1px solid #dddcd6; border-radius: 10px; padding: 12px 14px; }
  .kpi .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #55554f; }
  .kpi .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
  .kpi.accent .value { color: ${POLLMEIER_RED}; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .06em; margin: 22px 0 8px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #dddcd6; padding: 6px 8px; text-align: left; }
  th { background: #f4f3f0; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  img.board { width: 100%; border: 1px solid #dddcd6; border-radius: 8px; margin-top: 6px; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: ${POLLMEIER_RED}; color: #fff; border: 0; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
  footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #dddcd6; color: #8a8a84; font-size: 11px; display: flex; justify-content: space-between; }
  @media print { .print-btn { display: none; } body { margin: 12mm; } }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">${T.printReport}</button>
  <header>
    <div>
      ${logoSvg(30)}
      <h1>${T.reportTitle}</h1>
    </div>
    <div class="meta">
      ${T.reportDate}: ${escapeHtml(dateText)}<br>
      ${T.reportBoard}: ${Math.round(board.realLengthMm)} × ${Math.round(board.realWidthMm)} mm<br>
      ${T.reportKerf}: ${sawKerfMm} mm · ${T.defectsCount}: ${defects.length}
    </div>
  </header>
  <div class="kpis">
    <div class="kpi"><div class="label">${T.boardArea}</div><div class="value">${(boardAreaMm2 / 1e6).toFixed(3)} m²</div></div>
    <div class="kpi"><div class="label">${T.validArea}</div><div class="value">${(validAreaMm2 / 1e6).toFixed(3)} m²</div></div>
    <div class="kpi accent"><div class="label">${T.yield}</div><div class="value">${yieldPercent.toFixed(1)} %</div></div>
  </div>
  <h2>${T.imageTitle}</h2>
  <img class="board" src="${svgMarkup}" alt="${T.imageTitle}">
  <h2>${T.partsTableTitle} (${parts.length})</h2>
  <table>
    <thead><tr><th>#</th><th>${T.name}</th><th>X [mm]</th><th>Y [mm]</th><th>m²</th><th>${T.status}</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="6">–</td></tr>`}</tbody>
  </table>
  <footer><span>Pollmeier · ${T.appTitle}</span><span>${escapeHtml(dateText)}</span></footer>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
  return true;
};

/** Downloads the parts list as a semicolon-separated CSV (Excel-friendly, with BOM). */
export const downloadCsv = ({ T, parts, board, boardAreaMm2, validAreaMm2, yieldPercent, sawKerfMm }) => {
  const lines = [
    ["#", T.name, "X [mm]", "Y [mm]", "m²", T.status].join(";"),
    ...parts.map((p, i) =>
      [i + 1, `"${String(p.name).replace(/"/g, '""')}"`, Math.round(p.lengthMm), Math.round(p.widthMm), (p.areaMm2 / 1e6).toFixed(4), statusLabel(p, T)].join(";")
    ),
    "",
    [`${T.reportBoard}`, `${Math.round(board.realLengthMm)}x${Math.round(board.realWidthMm)} mm`].join(";"),
    [`${T.reportKerf}`, `${sawKerfMm} mm`].join(";"),
    [`${T.boardArea}`, `${(boardAreaMm2 / 1e6).toFixed(4)} m2`].join(";"),
    [`${T.validArea}`, `${(validAreaMm2 / 1e6).toFixed(4)} m2`].join(";"),
    [`${T.yield}`, `${yieldPercent.toFixed(1)} %`].join(";"),
  ];
  const blob = new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pollmeier-ausbeute-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
