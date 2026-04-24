import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Copy,
  CornerDownRight,
  Move,
  Plus,
  Redo2,
  RotateCw,
  Search,
  Square,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clamp01 = (value) => clamp(value, 0, 1);

const T = {
  appTitle: "Holz-Ausbeute-App",
  uploadPhoto: "Brettfoto laden",
  rotateImage: "Foto 90° drehen",
  perspectiveTitle: "Perspektivkorrektur",
  startPerspective: "Brettecken wählen",
  resetPerspective: "Zurücksetzen",
  perspectiveHint: "Reihenfolge: oben links, oben rechts, unten rechts, unten links.",
  perspectiveRemaining: "Punkte offen:",
  boardTitle: "Brett kalibrieren",
  boardLength: "Länge [mm]",
  boardWidth: "Breite [mm]",
  moveFrame: "Rahmen bewegen",
  resizeFrame: "Rahmen skalieren",
  partsTitle: "Bauteile & Fehler",
  addPart: "Bauteil",
  addDefect: "Fehler",
  duplicatePart: "Duplizieren",
  partName: "Bezeichnung",
  partLength: "Länge [mm]",
  partWidth: "Breite [mm]",
  deletePart: "Bauteil löschen",
  deleteDefect: "Fehler löschen",
  gridTitle: "Raster & Sägefuge",
  showGrid: "10-cm-Raster anzeigen",
  kerfWidth: "Sägefuge [mm]",
  resultTitle: "Ausbeute",
  boardArea: "Brettfläche",
  validPartArea: "Gültige Teilefläche",
  yield: "Ausbeute",
  valid: "gültig",
  overlapsDefect: "überlappt Fehler",
  outsideBoard: "außerhalb",
  undo: "Zurück",
  redo: "Vor",
  zoomIn: "Zoom +",
  zoomOut: "Zoom −",
  zoomFit: "Einpassen",
  zoomReset: "100 %",
  exportPdf: "PDF",
  part: "Teil",
  defect: "Fehler",
};

const solveLinearSystem = (matrix, vector) => {
  const n = matrix.length;
  const a = matrix.map((row, index) => [...row, vector[index]]);
  for (let i = 0; i < n; i += 1) {
    let maxRow = i;
    for (let k = i + 1; k < n; k += 1) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) maxRow = k;
    }
    if (Math.abs(a[maxRow][i]) < 1e-10) return null;
    [a[i], a[maxRow]] = [a[maxRow], a[i]];
    const pivot = a[i][i];
    for (let j = i; j <= n; j += 1) a[i][j] /= pivot;
    for (let k = 0; k < n; k += 1) {
      if (k === i) continue;
      const factor = a[k][i];
      for (let j = i; j <= n; j += 1) a[k][j] -= factor * a[i][j];
    }
  }
  return a.map((row) => row[n]);
};

const computeHomography = (src, dst) => {
  const matrix = [];
  const vector = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    vector.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    vector.push(v);
  }
  const result = solveLinearSystem(matrix, vector);
  if (!result) return null;
  return [
    [result[0], result[1], result[2]],
    [result[3], result[4], result[5]],
    [result[6], result[7], 1],
  ];
};

const invert3x3 = (m) => {
  const [a, b, c] = m[0];
  const [d, e, f] = m[1];
  const [g, h, i] = m[2];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-10) return null;
  return [
    [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
};

const applyHomography = (m, x, y) => {
  const w = m[2][0] * x + m[2][1] * y + m[2][2];
  if (Math.abs(w) < 1e-10) return null;
  return {
    x: (m[0][0] * x + m[0][1] * y + m[0][2]) / w,
    y: (m[1][0] * x + m[1][1] * y + m[1][2]) / w,
  };
};

const rotateImage90Clockwise = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      resolve({ src: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height });
    };
    img.onerror = reject;
    img.src = src;
  });

const rectifyImageFromCorners = (src, points, targetAspectRatio) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const topWidth = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const bottomWidth = Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y);
      const leftHeight = Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y);
      const rightHeight = Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y);
      const measuredWidth = Math.max(topWidth, bottomWidth);
      const measuredHeight = Math.max(leftHeight, rightHeight);
      const measuredArea = Math.max(1, measuredWidth * measuredHeight);
      const aspect = Number.isFinite(targetAspectRatio) && targetAspectRatio > 0 ? targetAspectRatio : measuredWidth / Math.max(1, measuredHeight);
      const targetWidth = Math.max(1, Math.round(Math.sqrt(measuredArea * aspect)));
      const targetHeight = Math.max(1, Math.round(targetWidth / aspect));
      const dst = [
        { x: 0, y: 0 },
        { x: targetWidth - 1, y: 0 },
        { x: targetWidth - 1, y: targetHeight - 1 },
        { x: 0, y: targetHeight - 1 },
      ];
      const homography = computeHomography(points, dst);
      const inverse = homography ? invert3x3(homography) : null;
      if (!inverse) return resolve(null);
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      const srcCtx = srcCanvas.getContext("2d");
      const outCanvas = document.createElement("canvas");
      outCanvas.width = targetWidth;
      outCanvas.height = targetHeight;
      const outCtx = outCanvas.getContext("2d");
      if (!srcCtx || !outCtx) return reject(new Error("Canvas unavailable"));
      srcCtx.drawImage(img, 0, 0);
      const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
      const outData = outCtx.createImageData(targetWidth, targetHeight);
      for (let y = 0; y < targetHeight; y += 1) {
        for (let x = 0; x < targetWidth; x += 1) {
          const mapped = applyHomography(inverse, x, y);
          if (!mapped) continue;
          const sx = Math.round(mapped.x);
          const sy = Math.round(mapped.y);
          if (sx < 0 || sy < 0 || sx >= srcCanvas.width || sy >= srcCanvas.height) continue;
          const srcIndex = (sy * srcCanvas.width + sx) * 4;
          const dstIndex = (y * targetWidth + x) * 4;
          outData.data[dstIndex] = srcData.data[srcIndex];
          outData.data[dstIndex + 1] = srcData.data[srcIndex + 1];
          outData.data[dstIndex + 2] = srcData.data[srcIndex + 2];
          outData.data[dstIndex + 3] = srcData.data[srcIndex + 3];
        }
      }
      outCtx.putImageData(outData, 0, 0);
      resolve({ src: outCanvas.toDataURL("image/png"), width: targetWidth, height: targetHeight });
    };
    img.onerror = reject;
    img.src = src;
  });

const snapshotState = (parts, defects, selectedPartId, selectedDefectId) => ({
  parts: JSON.parse(JSON.stringify(parts)),
  defects: JSON.parse(JSON.stringify(defects)),
  selectedPartId,
  selectedDefectId,
});

function CardBox({ title, collapsed, onToggle, children }) {
  return (
    <section className="card">
      <button className="cardHeader" type="button" onClick={onToggle}>
        <span>{title}</span>
        <ChevronDown className={collapsed ? "chevron rotated" : "chevron"} size={18} />
      </button>
      {!collapsed && <div className="cardBody">{children}</div>}
    </section>
  );
}

function IconButton({ children, onClick, disabled, active, danger }) {
  return (
    <button type="button" className={`btn ${active ? "active" : ""} ${danger ? "danger" : ""}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default function App() {
  const [imageSrc, setImageSrc] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1000, height: 600 });
  const [board, setBoard] = useState({ x: 80, y: 60, width: 700, height: 240, realLengthMm: 4000, realWidthMm: 500 });
  const [parts, setParts] = useState([]);
  const [defects, setDefects] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [selectedDefectId, setSelectedDefectId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [boardMode, setBoardMode] = useState("move");
  const [showGrid, setShowGrid] = useState(true);
  const [sawKerfMm, setSawKerfMm] = useState(4);
  const [perspectiveMode, setPerspectiveMode] = useState(false);
  const [perspectivePoints, setPerspectivePoints] = useState([]);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState({ setup: false, perspective: true, board: false, parts: false, grid: true, result: false });

  const svgRef = useRef(null);
  const workspaceRef = useRef(null);
  const rectifyingRef = useRef(false);
  const nextPartId = useRef(1);
  const nextDefectId = useRef(1);

  const mmPerPxX = board.width > 0 ? board.realLengthMm / board.width : 1;
  const mmPerPxY = board.height > 0 ? board.realWidthMm / board.height : 1;
  const safeMmPerPxX = Number.isFinite(mmPerPxX) && mmPerPxX > 0 ? mmPerPxX : 1;
  const safeMmPerPxY = Number.isFinite(mmPerPxY) && mmPerPxY > 0 ? mmPerPxY : 1;
  const boardAreaMm2 = Math.max(0, board.realLengthMm) * Math.max(0, board.realWidthMm);
  const gridStepPxX = 100 / safeMmPerPxX;
  const gridStepPxY = 100 / safeMmPerPxY;
  const sawKerfStrokePx = Math.max(1, ((Math.max(0, sawKerfMm) / safeMmPerPxX) + (Math.max(0, sawKerfMm) / safeMmPerPxY)) / 2);

  const enrichedDefects = useMemo(() => defects.map((d) => ({ ...d, widthPx: d.lengthMm / safeMmPerPxX, heightPx: d.widthMm / safeMmPerPxY })), [defects, safeMmPerPxX, safeMmPerPxY]);

  const enrichedParts = useMemo(() => parts.map((p) => {
    const widthPx = p.lengthMm / safeMmPerPxX;
    const heightPx = p.widthMm / safeMmPerPxY;
    const insideBoard = p.x >= 0 && p.y >= 0 && p.x + widthPx <= board.width && p.y + heightPx <= board.height;
    const overlapsDefect = enrichedDefects.some((d) => !(p.x + widthPx <= d.x || p.x >= d.x + d.widthPx || p.y + heightPx <= d.y || p.y >= d.y + d.heightPx));
    return { ...p, widthPx, heightPx, areaMm2: p.lengthMm * p.widthMm, insideBoard, overlapsDefect, valid: insideBoard && !overlapsDefect };
  }), [parts, enrichedDefects, board.width, board.height, safeMmPerPxX, safeMmPerPxY]);

  const selectedPart = enrichedParts.find((p) => p.id === selectedPartId) || null;
  const selectedDefect = enrichedDefects.find((d) => d.id === selectedDefectId) || null;
  const validAreaMm2 = enrichedParts.filter((p) => p.valid).reduce((sum, p) => sum + p.areaMm2, 0);
  const yieldPercent = boardAreaMm2 > 0 ? (validAreaMm2 / boardAreaMm2) * 100 : 0;

  const fitImageToWorkspace = () => {
    const container = workspaceRef.current;
    if (!container || imageSize.width <= 0 || imageSize.height <= 0) return;
    const availableWidth = Math.max(200, container.clientWidth - 32);
    const availableHeight = Math.max(200, container.clientHeight - 32);
    const nextZoom = clamp(Math.min(availableWidth / imageSize.width, availableHeight / imageSize.height), 0.2, 8);
    setZoom(Number(nextZoom.toFixed(3)));
  };

  useEffect(() => {
    window.setTimeout(fitImageToWorkspace, 0);
  }, [imageSize.width, imageSize.height]);

  const toggle = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const pushHistory = () => setHistory((prev) => ({ past: [...prev.past, snapshotState(parts, defects, selectedPartId, selectedDefectId)], future: [] }));

  const undo = () => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const current = snapshotState(parts, defects, selectedPartId, selectedDefectId);
      setParts(previous.parts);
      setDefects(previous.defects);
      setSelectedPartId(previous.selectedPartId);
      setSelectedDefectId(previous.selectedDefectId);
      return { past: prev.past.slice(0, -1), future: [current, ...prev.future] };
    });
  };

  const redo = () => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const current = snapshotState(parts, defects, selectedPartId, selectedDefectId);
      setParts(next.parts);
      setDefects(next.defects);
      setSelectedPartId(next.selectedPartId);
      setSelectedDefectId(next.selectedDefectId);
      return { past: [...prev.past, current], future: prev.future.slice(1) };
    });
  };

  const resetGeometry = () => {
    setParts([]);
    setDefects([]);
    setSelectedPartId(null);
    setSelectedDefectId(null);
    nextPartId.current = 1;
    nextDefectId.current = 1;
    setHistory({ past: [], future: [] });
  };

  const resetBoardToImage = (width, height) => setBoard((prev) => ({ ...prev, x: width * 0.1, y: height * 0.3, width: width * 0.8, height: height * 0.35 }));
  const setBoardToFullImage = (width, height) => setBoard((prev) => ({ ...prev, x: 0, y: 0, width, height }));

  const getMousePos = (event) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return { x: ((event.clientX - rect.left) / rect.width) * imageSize.width, y: ((event.clientY - rect.top) / rect.height) * imageSize.height };
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        resetBoardToImage(img.naturalWidth, img.naturalHeight);
        resetGeometry();
        setPerspectivePoints([]);
        setPerspectiveMode(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleRotateImage = async () => {
    if (!imageSrc) return;
    const rotated = await rotateImage90Clockwise(imageSrc);
    setImageSrc(rotated.src);
    setImageSize({ width: rotated.width, height: rotated.height });
    resetBoardToImage(rotated.width, rotated.height);
    resetGeometry();
    setPerspectivePoints([]);
    setPerspectiveMode(false);
  };

  useEffect(() => {
    const run = async () => {
      if (perspectivePoints.length !== 4 || !imageSrc || rectifyingRef.current) return;
      rectifyingRef.current = true;
      const ratio = board.realWidthMm > 0 ? board.realLengthMm / board.realWidthMm : undefined;
      const rectified = await rectifyImageFromCorners(imageSrc, perspectivePoints, ratio);
      if (rectified) {
        setImageSrc(rectified.src);
        setImageSize({ width: rectified.width, height: rectified.height });
        setBoardToFullImage(rectified.width, rectified.height);
        resetGeometry();
      }
      setPerspectiveMode(false);
      setPerspectivePoints([]);
      rectifyingRef.current = false;
    };
    run();
  }, [perspectivePoints]);

  const exportPdf = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const cloned = svgElement.cloneNode(true);
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    cloned.setAttribute("width", imageSize.width);
    cloned.setAttribute("height", imageSize.height);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(cloned))}`;
    const rows = enrichedParts.map((p) => `<tr><td>${p.name}</td><td>${Math.round(p.lengthMm)}</td><td>${Math.round(p.widthMm)}</td><td>${(p.areaMm2 / 1000000).toFixed(3)}</td><td>${p.valid ? T.valid : p.overlapsDefect ? T.overlapsDefect : T.outsideBoard}</td></tr>`).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${T.exportPdf}</title><style>body{font-family:Arial;margin:24px;color:#111}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ccc;padding:6px}.layout{display:grid;grid-template-columns:1fr 1.2fr;gap:20px}img{width:100%;border:1px solid #ccc}.summary{display:flex;gap:12px;margin:12px 0}.box{border:1px solid #ccc;padding:10px;border-radius:8px}</style></head><body><button onclick="window.print()">PDF drucken</button><h1>Ausbeutebericht</h1><div class="summary"><div class="box">${T.boardArea}<br>${(boardAreaMm2 / 1000000).toFixed(3)} m²</div><div class="box">${T.validPartArea}<br>${(validAreaMm2 / 1000000).toFixed(3)} m²</div><div class="box">${T.yield}<br>${yieldPercent.toFixed(1)} %</div></div><div class="layout"><div><h2>Bauteile</h2><table><thead><tr><th>Name</th><th>L</th><th>B</th><th>m²</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><div><h2>Bild</h2><img src="${svgUrl}"></div></div></body></html>`);
    win.document.close();
  };

  const addPart = () => {
    pushHistory();
    const id = nextPartId.current;
    const lengthMm = 300;
    const widthMm = 80;
    const widthPx = lengthMm / safeMmPerPxX;
    const heightPx = widthMm / safeMmPerPxY;
    const part = { id, name: `${T.part} ${id}`, lengthMm, widthMm, x: Math.max(10, board.width / 2 - widthPx / 2), y: Math.max(10, board.height / 2 - heightPx / 2) };
    nextPartId.current += 1;
    setParts((prev) => [...prev, part]);
    setSelectedPartId(id);
    setSelectedDefectId(null);
  };

  const addDefect = () => {
    pushHistory();
    const id = nextDefectId.current;
    const lengthMm = 120;
    const widthMm = 80;
    const widthPx = lengthMm / safeMmPerPxX;
    const heightPx = widthMm / safeMmPerPxY;
    const defect = { id, name: `${T.defect} ${id}`, lengthMm, widthMm, x: Math.max(10, board.width / 2 - widthPx / 2), y: Math.max(10, board.height / 2 - heightPx / 2) };
    nextDefectId.current += 1;
    setDefects((prev) => [...prev, defect]);
    setSelectedDefectId(id);
    setSelectedPartId(null);
  };

  const duplicateSelectedPart = () => {
    if (!selectedPart) return;
    pushHistory();
    const id = nextPartId.current;
    const copy = { id, name: `${selectedPart.name} ${id}`, lengthMm: selectedPart.lengthMm, widthMm: selectedPart.widthMm, x: clamp(selectedPart.x + 20, 0, Math.max(0, board.width - selectedPart.widthPx)), y: clamp(selectedPart.y + 20, 0, Math.max(0, board.height - selectedPart.heightPx)) };
    nextPartId.current += 1;
    setParts((prev) => [...prev, copy]);
    setSelectedPartId(id);
  };

  const removeSelectedPart = () => {
    if (selectedPartId === null) return;
    pushHistory();
    setParts((prev) => prev.filter((p) => p.id !== selectedPartId));
    setSelectedPartId(null);
  };

  const removeSelectedDefect = () => {
    if (selectedDefectId === null) return;
    pushHistory();
    setDefects((prev) => prev.filter((d) => d.id !== selectedDefectId));
    setSelectedDefectId(null);
  };

  const updateSelectedPart = (patch) => setParts((prev) => prev.map((p) => (p.id === selectedPartId ? { ...p, ...patch } : p)));

  const handlePerspectivePoint = (event) => {
    if (!perspectiveMode || perspectivePoints.length >= 4) return;
    event.preventDefault();
    event.stopPropagation();
    const pos = getMousePos(event);
    setPerspectivePoints((prev) => [...prev, { x: clamp01(pos.x / imageSize.width) * imageSize.width, y: clamp01(pos.y / imageSize.height) * imageSize.height }]);
  };

  const onPointerDownBoard = (event) => {
    if (perspectiveMode) return;
    const pos = getMousePos(event);
    setDragState({ type: boardMode === "move" ? "board-move" : "board-resize", startX: pos.x, startY: pos.y, startBoard: { ...board } });
  };

  const onPointerDownPart = (event, partId) => {
    if (perspectiveMode) return;
    event.stopPropagation();
    const pos = getMousePos(event);
    const part = parts.find((p) => p.id === partId);
    if (!part) return;
    pushHistory();
    setSelectedPartId(partId);
    setSelectedDefectId(null);
    setDragState({ type: "part-move", partId, offsetX: pos.x - (board.x + part.x), offsetY: pos.y - (board.y + part.y) });
  };

  const onPointerDownDefect = (event, defectId) => {
    if (perspectiveMode) return;
    event.stopPropagation();
    const pos = getMousePos(event);
    const defect = defects.find((d) => d.id === defectId);
    if (!defect) return;
    pushHistory();
    setSelectedDefectId(defectId);
    setSelectedPartId(null);
    setDragState({ type: "defect-move", defectId, offsetX: pos.x - (board.x + defect.x), offsetY: pos.y - (board.y + defect.y) });
  };

  const onPointerDownResizeDefect = (event, defectId, handle) => {
    if (perspectiveMode) return;
    event.stopPropagation();
    const pos = getMousePos(event);
    const defect = defects.find((d) => d.id === defectId);
    const enriched = enrichedDefects.find((d) => d.id === defectId);
    if (!defect || !enriched) return;
    pushHistory();
    setSelectedDefectId(defectId);
    setSelectedPartId(null);
    setDragState({ type: "defect-resize", defectId, handle, startX: pos.x, startY: pos.y, startDefect: { ...defect, widthPx: enriched.widthPx, heightPx: enriched.heightPx } });
  };

  const onPointerMove = (event) => {
    if (!dragState || perspectiveMode) return;
    const pos = getMousePos(event);
    if (dragState.type === "board-move") {
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      setBoard((prev) => ({ ...prev, x: clamp(dragState.startBoard.x + dx, 0, imageSize.width - prev.width), y: clamp(dragState.startBoard.y + dy, 0, imageSize.height - prev.height) }));
      return;
    }
    if (dragState.type === "board-resize") {
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      setBoard((prev) => ({ ...prev, width: clamp(dragState.startBoard.width + dx, 80, imageSize.width - dragState.startBoard.x), height: clamp(dragState.startBoard.height + dy, 60, imageSize.height - dragState.startBoard.y) }));
      return;
    }
    if (dragState.type === "part-move") {
      const dragged = enrichedParts.find((p) => p.id === dragState.partId);
      setParts((prev) => prev.map((p) => p.id === dragState.partId ? { ...p, x: clamp(pos.x - board.x - dragState.offsetX, 0, Math.max(0, board.width - (dragged?.widthPx || 0))), y: clamp(pos.y - board.y - dragState.offsetY, 0, Math.max(0, board.height - (dragged?.heightPx || 0))) } : p));
      return;
    }
    if (dragState.type === "defect-move") {
      const dragged = enrichedDefects.find((d) => d.id === dragState.defectId);
      setDefects((prev) => prev.map((d) => d.id === dragState.defectId ? { ...d, x: clamp(pos.x - board.x - dragState.offsetX, 0, Math.max(0, board.width - (dragged?.widthPx || 0))), y: clamp(pos.y - board.y - dragState.offsetY, 0, Math.max(0, board.height - (dragged?.heightPx || 0))) } : d));
      return;
    }
    if (dragState.type === "defect-resize") {
      const { startDefect, handle } = dragState;
      const localX = pos.x - board.x;
      const localY = pos.y - board.y;
      let x = startDefect.x;
      let y = startDefect.y;
      let widthPx = startDefect.widthPx;
      let heightPx = startDefect.heightPx;
      const right = startDefect.x + startDefect.widthPx;
      const bottom = startDefect.y + startDefect.heightPx;
      if (handle.includes("e")) widthPx = clamp(localX - startDefect.x, 8, board.width - startDefect.x);
      if (handle.includes("s")) heightPx = clamp(localY - startDefect.y, 8, board.height - startDefect.y);
      if (handle.includes("w")) {
        x = clamp(localX, 0, right - 8);
        widthPx = right - x;
      }
      if (handle.includes("n")) {
        y = clamp(localY, 0, bottom - 8);
        heightPx = bottom - y;
      }
      setDefects((prev) => prev.map((d) => d.id === dragState.defectId ? { ...d, x, y, lengthMm: widthPx * safeMmPerPxX, widthMm: heightPx * safeMmPerPxY } : d));
    }
  };

  const onPointerUp = () => setDragState(null);

  return (
    <div className="shell">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .shell { height: 100vh; display: grid; grid-template-columns: 340px 1fr; background: #0f172a; color: #e5e7eb; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; }
        .sidebar { background: #172033; border-right: 1px solid #263449; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .brand { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
        .brand h1 { font-size: 20px; line-height: 1.1; margin: 0; }
        .brand p { margin: 0; color: #94a3b8; font-size: 13px; }
        .card { border: 1px solid #2d3a50; background: #111827; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.15); }
        .cardHeader { width: 100%; border: 0; background: #111827; color: #f8fafc; padding: 14px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 700; font-size: 14px; }
        .cardBody { padding: 14px; border-top: 1px solid #253145; display: flex; flex-direction: column; gap: 12px; }
        .chevron { transition: transform .2s ease; }
        .rotated { transform: rotate(180deg); }
        .toolbar { position: sticky; top: 0; z-index: 10; background: rgba(15,23,42,.94); backdrop-filter: blur(8px); border-bottom: 1px solid #263449; padding: 12px; display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
        .toolbarLeft, .toolbarRight, .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .workspaceColumn { min-width: 0; display: flex; flex-direction: column; height: 100vh; }
        .workspace { flex: 1; overflow: auto; padding: 24px; background: radial-gradient(circle at center, #182235 0%, #0f172a 70%); }
        .canvasWrap { min-width: 100%; min-height: 100%; display: flex; align-items: center; justify-content: center; }
        .surface { background: #dbe4ee; border-radius: 12px; box-shadow: 0 18px 50px rgba(0,0,0,.35); overflow: hidden; }
        .btn { min-height: 38px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; border-radius: 10px; padding: 0 12px; display: inline-flex; align-items: center; gap: 7px; cursor: pointer; font-weight: 650; font-size: 13px; }
        .btn:hover:not(:disabled) { background: #273449; }
        .btn:disabled { opacity: .42; cursor: not-allowed; }
        .btn.active { background: #2563eb; border-color: #2563eb; }
        .btn.danger { background: #991b1b; border-color: #991b1b; }
        .input, select { width: 100%; min-height: 38px; border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; padding: 8px 10px; }
        .inputFile { width: 100%; color: #dbeafe; font-size: 13px; }
        label { display: block; color: #cbd5e1; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .hint { color: #fbbf24; background: rgba(251,191,36,.1); border: 1px solid rgba(251,191,36,.3); border-radius: 10px; padding: 10px; font-size: 12px; }
        .muted { color: #94a3b8; font-size: 12px; }
        .panel { border: 1px solid #334155; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: #0f172a; }
        .summary { display: grid; gap: 8px; font-size: 13px; }
        .resultBig { color: #38bdf8; font-size: 28px; font-weight: 800; }
        .status { border-radius: 10px; padding: 8px; font-size: 12px; border: 1px solid #334155; }
        .ok { background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.35); }
        .bad { background: rgba(244,63,94,.12); border-color: rgba(244,63,94,.35); }
        .svg { touch-action: none; display: block; }
        @media (max-width: 900px) { .shell { grid-template-columns: 1fr; grid-template-rows: auto 1fr; } .sidebar { height: 38vh; border-right: 0; border-bottom: 1px solid #263449; } .workspaceColumn { height: 62vh; } .toolbar { position: relative; } }
      `}</style>

      <aside className="sidebar">
        <div className="brand">
          <h1>{T.appTitle}</h1>
          <p>Ausbeute visuell planen und dokumentieren</p>
        </div>

        <CardBox title="Foto" collapsed={collapsed.setup} onToggle={() => toggle("setup")}>
          <div className="field">
            <label>{T.uploadPhoto}</label>
            <input className="inputFile" type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
          <div className="row">
            <IconButton onClick={handleRotateImage} disabled={!imageSrc}><RotateCw size={16} />{T.rotateImage}</IconButton>
          </div>
        </CardBox>

        <CardBox title={T.perspectiveTitle} collapsed={collapsed.perspective} onToggle={() => toggle("perspective")}>
          <div className="row">
            <IconButton active={perspectiveMode} onClick={() => { setPerspectiveMode(true); setPerspectivePoints([]); }} disabled={!imageSrc}><CornerDownRight size={16} />{T.startPerspective}</IconButton>
            <IconButton onClick={() => { setPerspectivePoints([]); setPerspectiveMode(false); }}>{T.resetPerspective}</IconButton>
          </div>
          <div className="hint">{T.perspectiveHint}</div>
          <div className="muted">{T.perspectiveRemaining} {Math.max(0, 4 - perspectivePoints.length)}</div>
        </CardBox>

        <CardBox title={T.boardTitle} collapsed={collapsed.board} onToggle={() => toggle("board")}>
          <div className="grid2">
            <div className="field"><label>{T.boardLength}</label><input className="input" type="number" value={board.realLengthMm} onChange={(e) => setBoard((p) => ({ ...p, realLengthMm: Number(e.target.value) || 0 }))} /></div>
            <div className="field"><label>{T.boardWidth}</label><input className="input" type="number" value={board.realWidthMm} onChange={(e) => setBoard((p) => ({ ...p, realWidthMm: Number(e.target.value) || 0 }))} /></div>
          </div>
          <div className="row">
            <IconButton active={boardMode === "move"} onClick={() => setBoardMode("move")}><Move size={16} />{T.moveFrame}</IconButton>
            <IconButton active={boardMode === "resize"} onClick={() => setBoardMode("resize")}><Square size={16} />{T.resizeFrame}</IconButton>
          </div>
          <div className="muted">1 px = {safeMmPerPxX.toFixed(2)} mm Länge / {safeMmPerPxY.toFixed(2)} mm Breite</div>
        </CardBox>

        <CardBox title={T.partsTitle} collapsed={collapsed.parts} onToggle={() => toggle("parts")}>
          <div className="row">
            <IconButton onClick={addPart}><Plus size={16} />{T.addPart}</IconButton>
            <IconButton onClick={addDefect}><AlertCircle size={16} />{T.addDefect}</IconButton>
            <IconButton onClick={duplicateSelectedPart} disabled={!selectedPart}><Copy size={16} />{T.duplicatePart}</IconButton>
          </div>
          {selectedPart && (
            <div className="panel">
              <div className="field"><label>{T.partName}</label><input className="input" value={selectedPart.name} onChange={(e) => updateSelectedPart({ name: e.target.value })} /></div>
              <div className="grid2">
                <div className="field"><label>{T.partLength}</label><input className="input" type="number" value={selectedPart.lengthMm} onChange={(e) => updateSelectedPart({ lengthMm: Number(e.target.value) || 0 })} /></div>
                <div className="field"><label>{T.partWidth}</label><input className="input" type="number" value={selectedPart.widthMm} onChange={(e) => updateSelectedPart({ widthMm: Number(e.target.value) || 0 })} /></div>
              </div>
              <IconButton danger onClick={removeSelectedPart}><Trash2 size={16} />{T.deletePart}</IconButton>
            </div>
          )}
          {selectedDefect && (
            <div className="panel">
              <div className="muted">Fehler mit Ziehpunkten an den Ecken skalieren.</div>
              <IconButton danger onClick={removeSelectedDefect}><Trash2 size={16} />{T.deleteDefect}</IconButton>
            </div>
          )}
        </CardBox>

        <CardBox title={T.gridTitle} collapsed={collapsed.grid} onToggle={() => toggle("grid")}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />{T.showGrid}</label>
          <div className="field"><label>{T.kerfWidth}</label><input className="input" type="number" value={sawKerfMm} min="0" onChange={(e) => setSawKerfMm(Number(e.target.value) || 0)} /></div>
          <div className="muted">Linienstärke: {sawKerfStrokePx.toFixed(2)} px</div>
        </CardBox>

        <CardBox title={T.resultTitle} collapsed={collapsed.result} onToggle={() => toggle("result")}>
          <div className="summary">
            <div>{T.boardArea}: {(boardAreaMm2 / 1000000).toFixed(3)} m²</div>
            <div>{T.validPartArea}: {(validAreaMm2 / 1000000).toFixed(3)} m²</div>
            <div className="resultBig">{yieldPercent.toFixed(1)} %</div>
          </div>
          {enrichedParts.map((p) => (
            <div className={`status ${p.valid ? "ok" : "bad"}`} key={p.id}>
              <strong>{p.name}</strong><br />{Math.round(p.lengthMm)} × {Math.round(p.widthMm)} mm · {p.valid ? T.valid : p.overlapsDefect ? T.overlapsDefect : T.outsideBoard}
            </div>
          ))}
        </CardBox>
      </aside>

      <main className="workspaceColumn">
        <div className="toolbar">
          <div className="toolbarLeft">
            <IconButton onClick={undo} disabled={history.past.length === 0}><Undo2 size={16} />{T.undo}</IconButton>
            <IconButton onClick={redo} disabled={history.future.length === 0}><Redo2 size={16} />{T.redo}</IconButton>
            <IconButton onClick={exportPdf}>PDF {T.exportPdf}</IconButton>
          </div>
          <div className="toolbarRight">
            <IconButton onClick={() => setZoom((z) => clamp(Number((z - 0.25).toFixed(2)), 0.2, 8))}><ZoomOut size={16} />{T.zoomOut}</IconButton>
            <IconButton onClick={() => setZoom((z) => clamp(Number((z + 0.25).toFixed(2)), 0.2, 8))}><ZoomIn size={16} />{T.zoomIn}</IconButton>
            <IconButton onClick={fitImageToWorkspace}><Search size={16} />{T.zoomFit}</IconButton>
            <IconButton onClick={() => setZoom(1)}>{T.zoomReset}</IconButton>
            <span className="muted">{Math.round(zoom * 100)} %</span>
          </div>
        </div>

        <div ref={workspaceRef} className="workspace">
          <div className="canvasWrap">
            <div className="surface" style={{ width: imageSize.width * zoom, height: imageSize.height * zoom }}>
              <svg
                ref={svgRef}
                className="svg"
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                width={imageSize.width * zoom}
                height={imageSize.height * zoom}
                onPointerDown={handlePerspectivePoint}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {imageSrc ? <image href={imageSrc} x="0" y="0" width={imageSize.width} height={imageSize.height} preserveAspectRatio="none" /> : <rect x="0" y="0" width={imageSize.width} height={imageSize.height} fill="#dbe4ee" />}
                {perspectivePoints.map((point, index) => (
                  <g key={`perspective-${index}`} pointerEvents="none">
                    <circle cx={point.x} cy={point.y} r="9" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                    <text x={point.x + 12} y={point.y - 12} fontSize="20" fill="#78350f">{index + 1}</text>
                  </g>
                ))}
                <g transform={`translate(${board.x}, ${board.y})`}>
                  <rect x="0" y="0" width={board.width} height={board.height} fill="rgba(34,197,94,.10)" stroke="#16a34a" strokeWidth="4" onPointerDown={onPointerDownBoard} />
                  {showGrid && gridStepPxX > 0 && gridStepPxY > 0 && (
                    <g pointerEvents="none">
                      {Array.from({ length: Math.floor(board.width / gridStepPxX) + 1 }, (_, i) => <line key={`gx-${i}`} x1={i * gridStepPxX} y1="0" x2={i * gridStepPxX} y2={board.height} stroke="rgba(15,23,42,.20)" strokeWidth="0.8" />)}
                      {Array.from({ length: Math.floor(board.height / gridStepPxY) + 1 }, (_, i) => <line key={`gy-${i}`} x1="0" y1={i * gridStepPxY} x2={board.width} y2={i * gridStepPxY} stroke="rgba(15,23,42,.20)" strokeWidth="0.8" />)}
                    </g>
                  )}
                  {enrichedDefects.map((d) => {
                    const handles = [
                      { key: "nw", x: d.x, y: d.y },
                      { key: "ne", x: d.x + d.widthPx, y: d.y },
                      { key: "se", x: d.x + d.widthPx, y: d.y + d.heightPx },
                      { key: "sw", x: d.x, y: d.y + d.heightPx },
                    ];
                    return (
                      <g key={d.id}>
                        <rect x={d.x} y={d.y} width={d.widthPx} height={d.heightPx} fill={d.id === selectedDefectId ? "rgba(239,68,68,.35)" : "rgba(239,68,68,.20)"} stroke="#dc2626" strokeWidth={sawKerfStrokePx} onPointerDown={(e) => onPointerDownDefect(e, d.id)} />
                        <text x={d.x + 8} y={d.y + 20} fontSize="18" fill="#7f1d1d">{d.name}</text>
                        {d.id === selectedDefectId && handles.map((h) => <rect key={h.key} x={h.x - 7} y={h.y - 7} width="14" height="14" fill="#fff" stroke="#dc2626" strokeWidth="2" onPointerDown={(e) => onPointerDownResizeDefect(e, d.id, h.key)} />)}
                      </g>
                    );
                  })}
                  {enrichedParts.map((p) => (
                    <g key={p.id} onPointerDown={(e) => onPointerDownPart(e, p.id)}>
                      <rect x={p.x} y={p.y} width={p.widthPx} height={p.heightPx} fill={p.valid ? "rgba(59,130,246,.22)" : "rgba(244,63,94,.22)"} stroke={p.id === selectedPartId ? "#1d4ed8" : p.valid ? "#2563eb" : "#e11d48"} strokeWidth={sawKerfStrokePx} />
                      <text x={p.x + 8} y={p.y + 20} fontSize="18" fill="#0f172a">{p.name}</text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
