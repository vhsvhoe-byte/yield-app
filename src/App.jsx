import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Crop,
  FileDown,
  FileSpreadsheet,
  HelpCircle,
  Image as ImageIcon,
  ImagePlus,
  Images,
  Layers,
  Maximize2,
  PieChart,
  Plus,
  Redo2,
  RefreshCcw,
  RotateCw,
  Ruler,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { TRANSLATIONS, LANGUAGES, format } from "./i18n.js";
import {
  clamp,
  clamp01,
  downscaleImage,
  readFileAsDataUrl,
  rectifyImageFromCorners,
  rotateImage90Clockwise,
} from "./geometry.js";
import { Logo } from "./components/Logo.jsx";
import { Button, Card, Field, FileButton, Modal, NumberField, Toasts } from "./components/ui.jsx";
import { openReport, downloadCsv } from "./report.js";

const STORAGE_KEY = "pollmeier-holzausbeute-v2";
const SNAP_DISTANCE_PX = 14;
const HISTORY_LIMIT = 60;
const MIN_PART_MM = 5;
const MIN_BOARD_PX = { width: 60, height: 40 };
const DEFAULT_BOARD = { x: 80, y: 60, width: 700, height: 240, realLengthMm: 4000, realWidthMm: 500 };

const RESIZE_CURSORS = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

const createWoodPreview = (label, width, height, seed) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const base = ["#d9bb90", "#d2ae7f", "#e0c49c", "#cba775"][seed % 4];
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, base);
  grad.addColorStop(1, "#b98f5f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 26; i += 1) {
    const y = ((i * 137 + seed * 61) % height);
    ctx.fillStyle = `rgba(96, 62, 30, ${0.05 + ((i * 7 + seed) % 10) / 90})`;
    ctx.fillRect(0, y, width, 1.5 + ((i + seed) % 4));
  }
  for (let k = 0; k < 3; k += 1) {
    const kx = ((k * 431 + seed * 199) % (width - 120)) + 60;
    const ky = ((k * 257 + seed * 83) % (height - 80)) + 40;
    ctx.fillStyle = "rgba(74, 46, 20, 0.55)";
    ctx.beginPath();
    ctx.ellipse(kx, ky, 14 + (k % 3) * 5, 9 + (k % 2) * 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(29,29,27,.78)";
  ctx.font = `600 ${Math.round(height * 0.09)}px "Segoe UI", sans-serif`;
  ctx.fillText(label, 20, Math.round(height * 0.13));
  return canvas.toDataURL("image/jpeg", 0.86);
};

const buildInitialLibrary = () =>
  Array.from({ length: 6 }, (_, index) => {
    const quality = ["A", "B", "C"][index % 3];
    const width = 1280;
    const height = 420 + (index % 3) * 60;
    const label = `Demo ${index + 1}`;
    return {
      id: `demo-${index + 1}`,
      label,
      quality,
      width,
      height,
      demo: true,
      src: createWoodPreview(`${label} · ${quality}`, width, height, index + 1),
    };
  });

export default function App() {
  const [language, setLanguage] = useState("de");
  const T = TRANSLATIONS[language];

  const [started, setStarted] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1400, height: 600 });
  const [board, setBoard] = useState(DEFAULT_BOARD);
  const [parts, setParts] = useState([]);
  const [defects, setDefects] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [selectedDefectId, setSelectedDefectId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [sawKerfMm, setSawKerfMm] = useState(4);
  const [perspectiveMode, setPerspectiveMode] = useState(false);
  const [perspectivePoints, setPerspectivePoints] = useState([]);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState({ photo: false, board: false, parts: false, result: false });
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [libraryPhotos, setLibraryPhotos] = useState(() => buildInitialLibrary());
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const svgRef = useRef(null);
  const workspaceRef = useRef(null);
  const nextPartId = useRef(1);
  const nextDefectId = useRef(1);
  const rectifyingRef = useRef(false);
  const toastIdRef = useRef(0);
  const restoreRanRef = useRef(false);
  const storageWarnedRef = useRef(false);
  const persistTimerRef = useRef(null);
  const historyKeyRef = useRef({ key: null, time: 0 });

  // Latest state mirror so window-level listeners and drag handlers never see stale closures.
  const latest = useRef({});
  latest.current = {
    T,
    language,
    started,
    imageSrc,
    imageSize,
    board,
    parts,
    defects,
    selectedPartId,
    selectedDefectId,
    perspectiveMode,
    perspectivePoints,
    history,
    zoom,
    sawKerfMm,
  };

  /* ---------- derived values ---------- */

  const mmPerPxX = board.width > 0 ? board.realLengthMm / board.width : 1;
  const mmPerPxY = board.height > 0 ? board.realWidthMm / board.height : 1;
  const safeMmPerPxX = Number.isFinite(mmPerPxX) && mmPerPxX > 0 ? mmPerPxX : 1;
  const safeMmPerPxY = Number.isFinite(mmPerPxY) && mmPerPxY > 0 ? mmPerPxY : 1;
  const boardAreaMm2 = Math.max(0, board.realLengthMm) * Math.max(0, board.realWidthMm);
  const gridStepPxX = 100 / safeMmPerPxX;
  const gridStepPxY = 100 / safeMmPerPxY;
  const kerfStrokePx = Math.max(1, (Math.max(0, sawKerfMm) / safeMmPerPxX + Math.max(0, sawKerfMm) / safeMmPerPxY) / 2);

  const enrichedDefects = useMemo(
    () =>
      defects.map((d) => ({
        ...d,
        widthPx: d.lengthMm / safeMmPerPxX,
        heightPx: d.widthMm / safeMmPerPxY,
        areaMm2: d.lengthMm * d.widthMm,
      })),
    [defects, safeMmPerPxX, safeMmPerPxY]
  );

  const enrichedParts = useMemo(() => {
    const baseParts = parts.map((p) => {
      const widthPx = p.lengthMm / safeMmPerPxX;
      const heightPx = p.widthMm / safeMmPerPxY;
      const insideBoard = p.x >= -0.5 && p.y >= -0.5 && p.x + widthPx <= board.width + 0.5 && p.y + heightPx <= board.height + 0.5;
      const overlapsDefect = enrichedDefects.some(
        (d) => !(p.x + widthPx <= d.x || p.x >= d.x + d.widthPx || p.y + heightPx <= d.y || p.y >= d.y + d.heightPx)
      );
      return { ...p, widthPx, heightPx, areaMm2: p.lengthMm * p.widthMm, insideBoard, overlapsDefect };
    });
    return baseParts.map((p) => {
      const overlapsPart = baseParts.some(
        (other) =>
          other.id !== p.id &&
          !(p.x + p.widthPx <= other.x || p.x >= other.x + other.widthPx || p.y + p.heightPx <= other.y || p.y >= other.y + other.heightPx)
      );
      return { ...p, overlapsPart, valid: p.insideBoard && !p.overlapsDefect && !overlapsPart };
    });
  }, [parts, enrichedDefects, board.width, board.height, safeMmPerPxX, safeMmPerPxY]);

  const selectedPart = enrichedParts.find((p) => p.id === selectedPartId) || null;
  const selectedDefect = enrichedDefects.find((d) => d.id === selectedDefectId) || null;
  const validParts = enrichedParts.filter((p) => p.valid);
  const validAreaMm2 = validParts.reduce((sum, p) => sum + p.areaMm2, 0);
  const yieldPercent = boardAreaMm2 > 0 ? (validAreaMm2 / boardAreaMm2) * 100 : 0;
  const hasCanvas = started || Boolean(imageSrc);

  const partStatus = (p) => {
    if (p.valid) return { text: T.statusValid, ok: true };
    if (!p.insideBoard) return { text: T.statusOutside, ok: false };
    if (p.overlapsDefect) return { text: T.statusDefect, ok: false };
    return { text: T.statusOverlap, ok: false };
  };

  /* ---------- toasts ---------- */

  const pushToast = useCallback((text, type = "info") => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  /* ---------- history ---------- */

  const takeSnapshot = () => {
    const L = latest.current;
    return {
      board: { ...L.board },
      parts: L.parts.map((p) => ({ ...p })),
      defects: L.defects.map((d) => ({ ...d })),
      selectedPartId: L.selectedPartId,
      selectedDefectId: L.selectedDefectId,
    };
  };

  const pushHistory = useCallback(() => {
    historyKeyRef.current = { key: null, time: 0 };
    const snap = takeSnapshot();
    setHistory((prev) => ({ past: [...prev.past.slice(-(HISTORY_LIMIT - 1)), snap], future: [] }));
  }, []);

  /** Coalesces rapid same-source changes (typing, arrow-key nudges) into one undo step. */
  const pushHistoryCoalesced = useCallback((key) => {
    const now = Date.now();
    if (historyKeyRef.current.key === key && now - historyKeyRef.current.time < 900) {
      historyKeyRef.current.time = now;
      return;
    }
    const snap = takeSnapshot();
    historyKeyRef.current = { key, time: now };
    setHistory((prev) => ({ past: [...prev.past.slice(-(HISTORY_LIMIT - 1)), snap], future: [] }));
  }, []);

  const applySnapshot = (snap) => {
    setBoard(snap.board);
    setParts(snap.parts);
    setDefects(snap.defects);
    setSelectedPartId(snap.selectedPartId);
    setSelectedDefectId(snap.selectedDefectId);
  };

  const undo = useCallback(() => {
    const L = latest.current;
    if (L.history.past.length === 0) return;
    const previous = L.history.past[L.history.past.length - 1];
    const current = takeSnapshot();
    applySnapshot(previous);
    setHistory({ past: L.history.past.slice(0, -1), future: [current, ...L.history.future] });
    historyKeyRef.current = { key: null, time: 0 };
  }, []);

  const redo = useCallback(() => {
    const L = latest.current;
    if (L.history.future.length === 0) return;
    const next = L.history.future[0];
    const current = takeSnapshot();
    applySnapshot(next);
    setHistory({ past: [...L.history.past, current], future: L.history.future.slice(1) });
    historyKeyRef.current = { key: null, time: 0 };
  }, []);

  /* ---------- persistence ---------- */

  useEffect(() => {
    if (restoreRanRef.current) return;
    restoreRanRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === "object") {
          if (TRANSLATIONS[data.language]) setLanguage(data.language);
          if (data.board && Number.isFinite(data.board.width)) setBoard({ ...DEFAULT_BOARD, ...data.board });
          if (Array.isArray(data.parts)) setParts(data.parts);
          if (Array.isArray(data.defects)) setDefects(data.defects);
          if (typeof data.sawKerfMm === "number") setSawKerfMm(data.sawKerfMm);
          if (typeof data.showGrid === "boolean") setShowGrid(data.showGrid);
          if (typeof data.imageSrc === "string" && data.imageSrc) setImageSrc(data.imageSrc);
          if (data.imageSize && Number.isFinite(data.imageSize.width)) setImageSize(data.imageSize);
          if (data.started) setStarted(true);
          nextPartId.current = (Array.isArray(data.parts) ? data.parts : []).reduce((m, p) => Math.max(m, p.id), 0) + 1;
          nextDefectId.current = (Array.isArray(data.defects) ? data.defects : []).reduce((m, d) => Math.max(m, d.id), 0) + 1;
          if (data.started || data.imageSrc) {
            pushToast(TRANSLATIONS[TRANSLATIONS[data.language] ? data.language : "de"].toastRestored);
          }
        }
      }
    } catch {
      /* corrupt storage – start fresh */
    }
    setHydrated(true);
  }, [pushToast]);

  useEffect(() => {
    if (!hydrated) return undefined;
    window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      const payload = { v: 2, language, board, parts, defects, sawKerfMm, showGrid, started, imageSize, imageSrc };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, imageSrc: "" }));
          if (!storageWarnedRef.current) {
            storageWarnedRef.current = true;
            pushToast(latest.current.T.toastStorageFull, "error");
          }
        } catch {
          /* storage unavailable */
        }
      }
    }, 600);
    return () => window.clearTimeout(persistTimerRef.current);
  }, [hydrated, language, board, parts, defects, sawKerfMm, showGrid, started, imageSize, imageSrc, pushToast]);

  /* ---------- layout / responsive ---------- */

  useEffect(() => {
    // matchMedia/resize alone miss some emulated or embedded viewport changes,
    // so a ResizeObserver on the root element acts as the reliable source.
    const update = () => setIsMobile(window.innerWidth <= 860);
    update();
    const query = window.matchMedia("(max-width: 860px)");
    query.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    // Some embedded webviews report a wrong viewport during the first paint
    // and never fire resize afterwards – re-check shortly after mount.
    const timers = [window.setTimeout(update, 300), window.setTimeout(update, 1200)];
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      observer.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  /* ---------- zoom ---------- */

  const zoomAt = useCallback((clientX, clientY, nextZoom) => {
    const ws = workspaceRef.current;
    const prev = latest.current.zoom;
    const z = clamp(Number(nextZoom.toFixed(3)), 0.1, 8);
    if (!ws || z === prev) return;
    const rect = ws.getBoundingClientRect();
    const offX = clientX - rect.left;
    const offY = clientY - rect.top;
    const cx = (ws.scrollLeft + offX) / prev;
    const cy = (ws.scrollTop + offY) / prev;
    setZoom(z);
    requestAnimationFrame(() => {
      ws.scrollLeft = cx * z - offX;
      ws.scrollTop = cy * z - offY;
    });
  }, []);

  const zoomStep = useCallback(
    (factor) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      const rect = ws.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, latest.current.zoom * factor);
    },
    [zoomAt]
  );

  const fitView = useCallback(() => {
    const ws = workspaceRef.current;
    const { imageSize: size } = latest.current;
    if (!ws || size.width <= 0 || size.height <= 0) return;
    const availW = Math.max(120, ws.clientWidth - 48);
    const availH = Math.max(120, ws.clientHeight - 48);
    const z = clamp(Math.min(availW / size.width, availH / size.height), 0.1, 8);
    setZoom(Number(z.toFixed(3)));
    requestAnimationFrame(() => {
      ws.scrollLeft = 0;
      ws.scrollTop = 0;
    });
  }, []);

  useEffect(() => {
    if (!hasCanvas) return;
    const timer = window.setTimeout(fitView, 40);
    return () => window.clearTimeout(timer);
  }, [imageSrc, imageSize.width, imageSize.height, hasCanvas, isMobile, fitView]);

  // Ctrl+wheel zoom and two-finger pinch, attached with capture so they win over element drags.
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return undefined;
    const pointers = new Map();
    let pinch = null;

    const down = (e) => {
      if (e.pointerType !== "touch") return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        e.stopPropagation();
        endDrag();
        const [a, b] = [...pointers.values()];
        pinch = { startDist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), startZoom: latest.current.zoom };
      } else if (pointers.size > 2) {
        e.stopPropagation();
      }
    };
    const move = (e) => {
      if (e.pointerType !== "touch" || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size >= 2) {
        e.stopPropagation();
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.startZoom * (dist / pinch.startDist));
      }
    };
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
    };
    const wheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, latest.current.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    };

    ws.addEventListener("pointerdown", down, true);
    ws.addEventListener("pointermove", move, true);
    ws.addEventListener("pointerup", up, true);
    ws.addEventListener("pointercancel", up, true);
    ws.addEventListener("wheel", wheel, { passive: false });
    return () => {
      ws.removeEventListener("pointerdown", down, true);
      ws.removeEventListener("pointermove", move, true);
      ws.removeEventListener("pointerup", up, true);
      ws.removeEventListener("pointercancel", up, true);
      ws.removeEventListener("wheel", wheel);
    };
  }, [zoomAt]);

  /* ---------- geometry helpers ---------- */

  const getSvgPos = (clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const { imageSize: size } = latest.current;
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * size.width,
      y: ((clientY - rect.top) / rect.height) * size.height,
    };
  };

  const snapPartPosition = (partId, x, y, widthPx, heightPx, allParts, boardBox) => {
    let snappedX = x;
    let snappedY = y;
    let bestX = SNAP_DISTANCE_PX + 1;
    let bestY = SNAP_DISTANCE_PX + 1;
    const tryX = (candidate) => {
      const distance = Math.abs(x - candidate);
      if (distance < bestX && distance <= SNAP_DISTANCE_PX) {
        bestX = distance;
        snappedX = candidate;
      }
    };
    const tryY = (candidate) => {
      const distance = Math.abs(y - candidate);
      if (distance < bestY && distance <= SNAP_DISTANCE_PX) {
        bestY = distance;
        snappedY = candidate;
      }
    };
    tryX(0);
    tryX(boardBox.width - widthPx);
    tryY(0);
    tryY(boardBox.height - heightPx);
    allParts.forEach((other) => {
      if (other.id === partId) return;
      [other.x - widthPx, other.x, other.x + other.widthPx - widthPx, other.x + other.widthPx].forEach(tryX);
      [other.y - heightPx, other.y, other.y + other.heightPx - heightPx, other.y + other.heightPx].forEach(tryY);
    });
    return {
      x: clamp(snappedX, 0, Math.max(0, boardBox.width - widthPx)),
      y: clamp(snappedY, 0, Math.max(0, boardBox.height - heightPx)),
    };
  };

  /* ---------- drag handling ----------
     Listeners are attached imperatively at drag start (not via effect) so no
     pointer event can fall into the gap before React commits. */

  const dragRef = useRef(null);
  const dragCleanupRef = useRef(null);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag?.type === "pan" && !drag.moved) {
      setSelectedPartId(null);
      setSelectedDefectId(null);
    }
    dragRef.current = null;
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
  }, []);

  const beginDrag = useCallback(
    (state) => {
      dragCleanupRef.current?.();
      dragRef.current = state;
      const move = (e) => dragMoveRef.current(e);
      const up = () => endDrag();
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      dragCleanupRef.current = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
    },
    [endDrag]
  );

  useEffect(() => () => dragCleanupRef.current?.(), []);

  const dragMoveRef = useRef(() => {});
  dragMoveRef.current = (e) => {
    const L = latest.current;
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.type === "pan") {
      const ws = workspaceRef.current;
      if (!ws) return;
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
      ws.scrollLeft = drag.startScrollLeft - dx;
      ws.scrollTop = drag.startScrollTop - dy;
      return;
    }

    const pos = getSvgPos(e.clientX, e.clientY);

    if (drag.type === "board-move") {
      const dx = pos.x - drag.startX;
      const dy = pos.y - drag.startY;
      setBoard((prev) => ({
        ...prev,
        x: clamp(drag.startBoard.x + dx, 0, Math.max(0, L.imageSize.width - prev.width)),
        y: clamp(drag.startBoard.y + dy, 0, Math.max(0, L.imageSize.height - prev.height)),
      }));
      return;
    }

    if (drag.type === "board-resize") {
      const dx = pos.x - drag.startX;
      const dy = pos.y - drag.startY;
      const start = drag.startBoard;
      const right = start.x + start.width;
      const bottom = start.y + start.height;
      setBoard((prev) => {
        let { x, y, width, height } = start;
        if (drag.handle.includes("e")) width = clamp(start.width + dx, MIN_BOARD_PX.width, L.imageSize.width - start.x);
        if (drag.handle.includes("s")) height = clamp(start.height + dy, MIN_BOARD_PX.height, L.imageSize.height - start.y);
        if (drag.handle.includes("w")) {
          x = clamp(start.x + dx, 0, right - MIN_BOARD_PX.width);
          width = right - x;
        }
        if (drag.handle.includes("n")) {
          y = clamp(start.y + dy, 0, bottom - MIN_BOARD_PX.height);
          height = bottom - y;
        }
        return { ...prev, x, y, width, height };
      });
      return;
    }

    if (drag.type === "item-move") {
      const mmX = L.board.width > 0 ? L.board.realLengthMm / L.board.width : 1;
      const mmY = L.board.height > 0 ? L.board.realWidthMm / L.board.height : 1;
      const setItems = drag.kind === "part" ? setParts : setDefects;
      const rawX = pos.x - L.board.x - drag.offsetX;
      const rawY = pos.y - L.board.y - drag.offsetY;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== drag.itemId) return item;
          const widthPx = item.lengthMm / (mmX || 1);
          const heightPx = item.widthMm / (mmY || 1);
          if (drag.kind === "part") {
            const allParts = prev.map((p) => ({ ...p, widthPx: p.lengthMm / (mmX || 1), heightPx: p.widthMm / (mmY || 1) }));
            const snapped = snapPartPosition(item.id, rawX, rawY, widthPx, heightPx, allParts, L.board);
            return { ...item, ...snapped };
          }
          return {
            ...item,
            x: clamp(rawX, 0, Math.max(0, L.board.width - widthPx)),
            y: clamp(rawY, 0, Math.max(0, L.board.height - heightPx)),
          };
        })
      );
      return;
    }

    if (drag.type === "item-resize") {
      const mmX = L.board.width > 0 ? L.board.realLengthMm / L.board.width : 1;
      const mmY = L.board.height > 0 ? L.board.realWidthMm / L.board.height : 1;
      const localX = pos.x - L.board.x;
      const localY = pos.y - L.board.y;
      const start = drag.startItem;
      const minPxX = MIN_PART_MM / (mmX || 1);
      const minPxY = MIN_PART_MM / (mmY || 1);
      const right = start.x + start.widthPx;
      const bottom = start.y + start.heightPx;
      let { x, y } = start;
      let widthPx = start.widthPx;
      let heightPx = start.heightPx;
      if (drag.handle.includes("e")) widthPx = clamp(localX - start.x, minPxX, L.board.width - start.x);
      if (drag.handle.includes("s")) heightPx = clamp(localY - start.y, minPxY, L.board.height - start.y);
      if (drag.handle.includes("w")) {
        x = clamp(localX, 0, right - minPxX);
        widthPx = right - x;
      }
      if (drag.handle.includes("n")) {
        y = clamp(localY, 0, bottom - minPxY);
        heightPx = bottom - y;
      }
      const lengthMm = Math.max(MIN_PART_MM, Math.round(widthPx * (mmX || 1)));
      const widthMm = Math.max(MIN_PART_MM, Math.round(heightPx * (mmY || 1)));
      const setItems = drag.kind === "part" ? setParts : setDefects;
      setItems((prev) => prev.map((item) => (item.id === drag.itemId ? { ...item, x, y, lengthMm, widthMm } : item)));
    }
  };

  const startPan = (e) => {
    const ws = workspaceRef.current;
    if (!ws || latest.current.perspectiveMode) return;
    beginDrag({
      type: "pan",
      startClientX: e.clientX,
      startClientY: e.clientY,
      startScrollLeft: ws.scrollLeft,
      startScrollTop: ws.scrollTop,
      moved: false,
    });
  };

  const startBoardMove = (e) => {
    if (latest.current.perspectiveMode) return;
    e.stopPropagation();
    pushHistory();
    const pos = getSvgPos(e.clientX, e.clientY);
    beginDrag({ type: "board-move", startX: pos.x, startY: pos.y, startBoard: { ...latest.current.board } });
  };

  const startBoardResize = (e, handle) => {
    if (latest.current.perspectiveMode) return;
    e.stopPropagation();
    pushHistory();
    const pos = getSvgPos(e.clientX, e.clientY);
    beginDrag({ type: "board-resize", handle, startX: pos.x, startY: pos.y, startBoard: { ...latest.current.board } });
  };

  const startItemMove = (e, kind, item) => {
    if (latest.current.perspectiveMode) return;
    e.stopPropagation();
    pushHistory();
    if (kind === "part") {
      setSelectedPartId(item.id);
      setSelectedDefectId(null);
    } else {
      setSelectedDefectId(item.id);
      setSelectedPartId(null);
    }
    const pos = getSvgPos(e.clientX, e.clientY);
    beginDrag({
      type: "item-move",
      kind,
      itemId: item.id,
      offsetX: pos.x - (latest.current.board.x + item.x),
      offsetY: pos.y - (latest.current.board.y + item.y),
    });
  };

  const startItemResize = (e, kind, item, handle) => {
    if (latest.current.perspectiveMode) return;
    e.stopPropagation();
    pushHistory();
    beginDrag({
      type: "item-resize",
      kind,
      itemId: item.id,
      handle,
      startItem: { x: item.x, y: item.y, widthPx: item.widthPx, heightPx: item.heightPx },
    });
  };

  /* ---------- photo handling ---------- */

  const applyImageSource = (src, width, height) => {
    setImageSrc(src);
    setImageSize({ width, height });
    setBoard((prev) => ({ ...prev, x: width * 0.05, y: height * 0.2, width: width * 0.9, height: height * 0.6 }));
    setParts([]);
    setDefects([]);
    setSelectedPartId(null);
    setSelectedDefectId(null);
    setHistory({ past: [], future: [] });
    setPerspectivePoints([]);
    setPerspectiveMode(false);
    setStarted(true);
  };

  const loadPhotoFile = async (file) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const scaled = await downscaleImage(dataUrl);
      applyImageSource(scaled.src, scaled.width, scaled.height);
      pushToast(latest.current.T.toastPhotoReplaced);
    } catch {
      pushToast(latest.current.T.toastImageError, "error");
    }
  };

  const startBlank = () => {
    const L = latest.current;
    const ratio = L.board.realLengthMm > 0 && L.board.realWidthMm > 0 ? L.board.realWidthMm / L.board.realLengthMm : 0.125;
    const width = 1400;
    const height = Math.round(clamp(width * ratio, 120, 3000));
    setImageSrc("");
    setImageSize({ width, height });
    setBoard((prev) => ({ ...prev, x: width * 0.02, y: height * 0.06, width: width * 0.96, height: height * 0.88 }));
    setParts([]);
    setDefects([]);
    setSelectedPartId(null);
    setSelectedDefectId(null);
    setHistory({ past: [], future: [] });
    setStarted(true);
  };

  const handleRotateImage = async () => {
    const L = latest.current;
    if (!L.imageSrc) return;
    try {
      const rotated = await rotateImage90Clockwise(L.imageSrc);
      applyImageSource(rotated.src, rotated.width, rotated.height);
    } catch {
      pushToast(latest.current.T.toastImageError, "error");
    }
  };

  const addPhotoToLibrary = async (file) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const scaled = await downscaleImage(dataUrl);
      setLibraryPhotos((prev) => [
        {
          id: `user-${Date.now()}`,
          label: file.name.replace(/\.[^.]+$/, "") || `Foto ${prev.length + 1}`,
          quality: "–",
          width: scaled.width,
          height: scaled.height,
          demo: false,
          src: scaled.src,
        },
        ...prev,
      ]);
    } catch {
      pushToast(latest.current.T.toastImageError, "error");
    }
  };

  /* ---------- perspective ---------- */

  const cancelPerspective = useCallback(() => {
    setPerspectiveMode(false);
    setPerspectivePoints([]);
  }, []);

  const handlePerspectivePoint = (event) => {
    const L = latest.current;
    if (!L.perspectiveMode || L.perspectivePoints.length >= 4) return;
    event.preventDefault();
    const pos = getSvgPos(event.clientX, event.clientY);
    setPerspectivePoints((prev) => [
      ...prev,
      { x: clamp01(pos.x / L.imageSize.width) * L.imageSize.width, y: clamp01(pos.y / L.imageSize.height) * L.imageSize.height },
    ]);
  };

  useEffect(() => {
    const run = async () => {
      const L = latest.current;
      if (perspectivePoints.length !== 4 || !L.imageSrc || rectifyingRef.current) return;
      rectifyingRef.current = true;
      try {
        const ratio = L.board.realWidthMm > 0 ? L.board.realLengthMm / L.board.realWidthMm : undefined;
        const rectified = await rectifyImageFromCorners(L.imageSrc, perspectivePoints, ratio);
        if (rectified) {
          setImageSrc(rectified.src);
          setImageSize({ width: rectified.width, height: rectified.height });
          setBoard((prev) => ({ ...prev, x: 0, y: 0, width: rectified.width, height: rectified.height }));
          setParts([]);
          setDefects([]);
          setSelectedPartId(null);
          setSelectedDefectId(null);
          setHistory({ past: [], future: [] });
          pushToast(latest.current.T.perspectiveApplied);
        } else {
          pushToast(latest.current.T.perspectiveFailed, "error");
        }
      } catch {
        pushToast(latest.current.T.perspectiveFailed, "error");
      }
      setPerspectiveMode(false);
      setPerspectivePoints([]);
      rectifyingRef.current = false;
    };
    run();
  }, [perspectivePoints, pushToast]);

  /* ---------- parts & defects ---------- */

  const addPart = () => {
    pushHistory();
    const id = nextPartId.current;
    nextPartId.current += 1;
    const lengthMm = 300;
    const widthMm = 80;
    const widthPx = lengthMm / safeMmPerPxX;
    const heightPx = widthMm / safeMmPerPxY;
    setParts((prev) => [
      ...prev,
      {
        id,
        name: `${T.part} ${id}`,
        lengthMm,
        widthMm,
        x: clamp(board.width / 2 - widthPx / 2, 0, Math.max(0, board.width - widthPx)),
        y: clamp(board.height / 2 - heightPx / 2, 0, Math.max(0, board.height - heightPx)),
      },
    ]);
    setSelectedPartId(id);
    setSelectedDefectId(null);
    if (isMobile) setActiveTab(null);
  };

  const addDefect = () => {
    pushHistory();
    const id = nextDefectId.current;
    nextDefectId.current += 1;
    const lengthMm = 120;
    const widthMm = 80;
    const widthPx = lengthMm / safeMmPerPxX;
    const heightPx = widthMm / safeMmPerPxY;
    setDefects((prev) => [
      ...prev,
      {
        id,
        name: `${T.defect} ${id}`,
        lengthMm,
        widthMm,
        x: clamp(board.width / 2 - widthPx / 2, 0, Math.max(0, board.width - widthPx)),
        y: clamp(board.height / 2 - heightPx / 2, 0, Math.max(0, board.height - heightPx)),
      },
    ]);
    setSelectedDefectId(id);
    setSelectedPartId(null);
    if (isMobile) setActiveTab(null);
  };

  const duplicateSelectedPart = () => {
    if (!selectedPart) return;
    pushHistory();
    const id = nextPartId.current;
    nextPartId.current += 1;
    setParts((prev) => [
      ...prev,
      {
        id,
        name: `${selectedPart.name} (${id})`,
        lengthMm: selectedPart.lengthMm,
        widthMm: selectedPart.widthMm,
        x: clamp(selectedPart.x + 24, 0, Math.max(0, board.width - selectedPart.widthPx)),
        y: clamp(selectedPart.y + 24, 0, Math.max(0, board.height - selectedPart.heightPx)),
      },
    ]);
    setSelectedPartId(id);
  };

  const deleteSelection = useCallback(() => {
    const L = latest.current;
    if (L.selectedPartId !== null) {
      pushHistory();
      setParts((prev) => prev.filter((p) => p.id !== L.selectedPartId));
      setSelectedPartId(null);
    } else if (L.selectedDefectId !== null) {
      pushHistory();
      setDefects((prev) => prev.filter((d) => d.id !== L.selectedDefectId));
      setSelectedDefectId(null);
    }
  }, [pushHistory]);

  const updateSelectedPart = (patch) => setParts((prev) => prev.map((p) => (p.id === latest.current.selectedPartId ? { ...p, ...patch } : p)));
  const updateSelectedDefect = (patch) =>
    setDefects((prev) => prev.map((d) => (d.id === latest.current.selectedDefectId ? { ...d, ...patch } : d)));

  const nudgeSelection = useCallback(
    (key, mm) => {
      const L = latest.current;
      const kind = L.selectedPartId !== null ? "part" : L.selectedDefectId !== null ? "defect" : null;
      if (!kind) return;
      pushHistoryCoalesced("nudge");
      const mmX = L.board.width > 0 ? L.board.realLengthMm / L.board.width : 1;
      const mmY = L.board.height > 0 ? L.board.realWidthMm / L.board.height : 1;
      const dx = key === "ArrowLeft" ? -mm / mmX : key === "ArrowRight" ? mm / mmX : 0;
      const dy = key === "ArrowUp" ? -mm / mmY : key === "ArrowDown" ? mm / mmY : 0;
      const setItems = kind === "part" ? setParts : setDefects;
      const itemId = kind === "part" ? L.selectedPartId : L.selectedDefectId;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const widthPx = item.lengthMm / (mmX || 1);
          const heightPx = item.widthMm / (mmY || 1);
          return {
            ...item,
            x: clamp(item.x + dx, 0, Math.max(0, L.board.width - widthPx)),
            y: clamp(item.y + dy, 0, Math.max(0, L.board.height - heightPx)),
          };
        })
      );
    },
    [pushHistoryCoalesced]
  );

  /* ---------- keyboard shortcuts ---------- */

  const keyHandlerRef = useRef(() => {});
  keyHandlerRef.current = (e) => {
    const tag = e.target?.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tag) || e.target?.isContentEditable) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;
    if (mod && key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((mod && key.toLowerCase() === "y") || (mod && e.shiftKey && key.toLowerCase() === "z")) {
      e.preventDefault();
      redo();
    } else if (key === "Delete" || key === "Backspace") {
      e.preventDefault();
      deleteSelection();
    } else if (key === "Escape") {
      if (latest.current.perspectiveMode) cancelPerspective();
      else {
        setSelectedPartId(null);
        setSelectedDefectId(null);
      }
    } else if (key.startsWith("Arrow")) {
      e.preventDefault();
      nudgeSelection(key, e.shiftKey ? 10 : 1);
    } else if (key === "+" || key === "=") {
      zoomStep(1.2);
    } else if (key === "-") {
      zoomStep(1 / 1.2);
    } else if (key.toLowerCase() === "f") {
      fitView();
    } else if (key === "1") {
      setZoom(1);
    }
  };

  useEffect(() => {
    const handler = (e) => keyHandlerRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------- export & reset ---------- */

  const exportPdf = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const clone = svgElement.cloneNode(true);
    clone.querySelectorAll('[data-export="exclude"]').forEach((node) => node.remove());
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", imageSize.width);
    clone.setAttribute("height", imageSize.height);
    const svgMarkup = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    const ok = openReport({
      T,
      locale: language,
      svgMarkup,
      board,
      parts: enrichedParts,
      defects: enrichedDefects,
      sawKerfMm,
      boardAreaMm2,
      validAreaMm2,
      yieldPercent,
    });
    if (!ok) pushToast(T.toastPdfBlocked, "error");
  };

  const exportCsv = () => {
    downloadCsv({ T, parts: enrichedParts, board, boardAreaMm2, validAreaMm2, yieldPercent, sawKerfMm });
    pushToast(T.toastCsvDone);
  };

  const resetProject = () => {
    if (!window.confirm(T.resetConfirm)) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setImageSrc("");
    setImageSize({ width: 1400, height: 600 });
    setBoard(DEFAULT_BOARD);
    setParts([]);
    setDefects([]);
    setSelectedPartId(null);
    setSelectedDefectId(null);
    setHistory({ past: [], future: [] });
    setPerspectiveMode(false);
    setPerspectivePoints([]);
    setStarted(false);
    setZoom(1);
    nextPartId.current = 1;
    nextDefectId.current = 1;
    pushToast(T.toastReset);
  };

  /* ---------- section renderers (shared between sidebar and mobile tabs) ---------- */

  const renderPhotoSection = () => (
    <div className="stack">
      <div className="btn-grid">
        <FileButton primary onFile={loadPhotoFile} title={imageSrc ? T.changePhoto : T.choosePhoto}>
          <ImagePlus size={16} />
          {imageSrc ? T.changePhoto : T.choosePhoto}
        </FileButton>
        <Button onClick={() => setShowLibrary(true)} title={T.mediaLibrary}>
          <Images size={16} />
          {T.mediaLibrary}
        </Button>
        <Button onClick={handleRotateImage} disabled={!imageSrc} title={T.rotate}>
          <RotateCw size={16} />
          {T.rotate}
        </Button>
        <Button
          active={perspectiveMode}
          disabled={!imageSrc}
          title={T.startPerspective}
          onClick={() => {
            setPerspectiveMode(true);
            setPerspectivePoints([]);
            if (isMobile) setActiveTab(null);
          }}
        >
          <Crop size={16} />
          {T.startPerspective}
        </Button>
      </div>
      <p className="muted">{T.perspectiveHint}</p>
      <p className="muted">{T.dropHint}</p>
    </div>
  );

  const renderBoardSection = () => (
    <div className="stack">
      <div className="grid-2">
        <Field label={T.boardLength} htmlFor="board-length">
          <NumberField
            id="board-length"
            value={board.realLengthMm}
            min={1}
            max={20000}
            onCommit={(v) => {
              pushHistoryCoalesced("board-mm");
              setBoard((prev) => ({ ...prev, realLengthMm: v }));
            }}
          />
        </Field>
        <Field label={T.boardWidth} htmlFor="board-width">
          <NumberField
            id="board-width"
            value={board.realWidthMm}
            min={1}
            max={20000}
            onCommit={(v) => {
              pushHistoryCoalesced("board-mm");
              setBoard((prev) => ({ ...prev, realWidthMm: v }));
            }}
          />
        </Field>
      </div>
      <p className="muted">{T.frameHint}</p>
      <label className="checkbox-row">
        <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
        {T.showGrid}
      </label>
      <div className="grid-2">
        <Field label={T.kerf} htmlFor="kerf">
          <NumberField id="kerf" value={sawKerfMm} min={0} max={50} onCommit={setSawKerfMm} />
        </Field>
        <div className="field">
          <label>{T.scale}</label>
          <div className="scale-info">
            1 px ≙ {safeMmPerPxX.toFixed(2)} / {safeMmPerPxY.toFixed(2)} mm
          </div>
        </div>
      </div>
    </div>
  );

  const renderPartsSection = () => (
    <div className="stack">
      <div className="btn-grid">
        <Button primary onClick={addPart} disabled={!hasCanvas} title={T.addPart}>
          <Plus size={16} />
          {T.addPart}
        </Button>
        <Button onClick={addDefect} disabled={!hasCanvas} title={T.addDefect}>
          <AlertTriangle size={16} />
          {T.addDefect}
        </Button>
        <Button onClick={duplicateSelectedPart} disabled={!selectedPart} title={T.duplicate}>
          <Copy size={16} />
          {T.duplicate}
        </Button>
        <Button danger onClick={deleteSelection} disabled={selectedPartId === null && selectedDefectId === null} title={T.deleteSel}>
          <Trash2 size={16} />
          {T.deleteSel}
        </Button>
      </div>

      {selectedPart && (
        <div className="panel">
          <Field label={T.partName} htmlFor="part-name">
            <input
              id="part-name"
              className="input"
              value={selectedPart.name}
              onChange={(e) => updateSelectedPart({ name: e.target.value })}
            />
          </Field>
          <div className="grid-2">
            <Field label={T.partLength} htmlFor="part-length">
              <NumberField
                id="part-length"
                value={Math.round(selectedPart.lengthMm)}
                min={MIN_PART_MM}
                max={20000}
                onCommit={(v) => {
                  pushHistoryCoalesced("part-dim");
                  updateSelectedPart({ lengthMm: v });
                }}
              />
            </Field>
            <Field label={T.partWidth} htmlFor="part-width">
              <NumberField
                id="part-width"
                value={Math.round(selectedPart.widthMm)}
                min={MIN_PART_MM}
                max={20000}
                onCommit={(v) => {
                  pushHistoryCoalesced("part-dim");
                  updateSelectedPart({ widthMm: v });
                }}
              />
            </Field>
          </div>
        </div>
      )}

      {selectedDefect && (
        <div className="panel">
          <p className="muted">{T.defectHint}</p>
          <div className="grid-2">
            <Field label={T.partLength} htmlFor="defect-length">
              <NumberField
                id="defect-length"
                value={Math.round(selectedDefect.lengthMm)}
                min={MIN_PART_MM}
                max={20000}
                onCommit={(v) => {
                  pushHistoryCoalesced("defect-dim");
                  updateSelectedDefect({ lengthMm: v });
                }}
              />
            </Field>
            <Field label={T.partWidth} htmlFor="defect-width">
              <NumberField
                id="defect-width"
                value={Math.round(selectedDefect.widthMm)}
                min={MIN_PART_MM}
                max={20000}
                onCommit={(v) => {
                  pushHistoryCoalesced("defect-dim");
                  updateSelectedDefect({ widthMm: v });
                }}
              />
            </Field>
          </div>
        </div>
      )}

      <div className="parts-list">
        {enrichedParts.length === 0 && <p className="muted">{T.noPartsYet}</p>}
        {enrichedParts.map((p) => {
          const status = partStatus(p);
          return (
            <button
              key={p.id}
              type="button"
              className={`part-row ${p.id === selectedPartId ? "is-selected" : ""}`}
              onClick={() => {
                setSelectedPartId(p.id);
                setSelectedDefectId(null);
              }}
            >
              <span className={`dot ${status.ok ? "dot-ok" : "dot-bad"}`} />
              <span className="part-row-name">{p.name}</span>
              <span className="part-row-dims">
                {Math.round(p.lengthMm)} × {Math.round(p.widthMm)}
              </span>
              <span className={`part-row-status ${status.ok ? "ok" : "bad"}`}>{status.text}</span>
            </button>
          );
        })}
        {enrichedDefects.map((d) => (
          <button
            key={`d-${d.id}`}
            type="button"
            className={`part-row defect ${d.id === selectedDefectId ? "is-selected" : ""}`}
            onClick={() => {
              setSelectedDefectId(d.id);
              setSelectedPartId(null);
            }}
          >
            <span className="dot dot-defect" />
            <span className="part-row-name">{d.name}</span>
            <span className="part-row-dims">
              {Math.round(d.lengthMm)} × {Math.round(d.widthMm)}
            </span>
            <span className="part-row-status defect-label">{T.defect}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderResultSection = () => (
    <div className="stack">
      <div className="yield-hero">
        <div className="yield-value">{yieldPercent.toFixed(1)} %</div>
        <div className="yield-label">{T.yield}</div>
        <div className="yield-bar">
          <div className="yield-bar-fill" style={{ width: `${clamp(yieldPercent, 0, 100)}%` }} />
        </div>
      </div>
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">{T.boardArea}</span>
          <span className="kpi-value">{(boardAreaMm2 / 1e6).toFixed(3)} m²</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">{T.validArea}</span>
          <span className="kpi-value">{(validAreaMm2 / 1e6).toFixed(3)} m²</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">{T.partsTotal}</span>
          <span className="kpi-value">
            {enrichedParts.length} <small>({validParts.length} {T.partsValid})</small>
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">{T.defectsCount}</span>
          <span className="kpi-value">{enrichedDefects.length}</span>
        </div>
      </div>
      <div className="btn-grid">
        <Button primary onClick={exportPdf} disabled={!hasCanvas} title={T.exportPdf}>
          <FileDown size={16} />
          {T.exportPdf}
        </Button>
        <Button onClick={exportCsv} disabled={enrichedParts.length === 0} title={T.exportCsv}>
          <FileSpreadsheet size={16} />
          {T.exportCsv}
        </Button>
      </div>
      <Button ghost danger onClick={resetProject} title={T.resetProject}>
        <RefreshCcw size={16} />
        {T.resetProject}
      </Button>
    </div>
  );

  const sections = [
    { key: "photo", title: T.photoSection, tab: T.tabPhoto, icon: <ImageIcon size={18} />, render: renderPhotoSection },
    { key: "board", title: T.boardSection, tab: T.tabBoard, icon: <Ruler size={18} />, render: renderBoardSection },
    { key: "parts", title: T.partsSection, tab: T.tabParts, icon: <Layers size={18} />, render: renderPartsSection, badge: enrichedParts.length || null },
    { key: "result", title: T.resultSection, tab: T.tabResult, icon: <PieChart size={18} />, render: renderResultSection },
  ];

  /* ---------- canvas geometry for handles ---------- */

  const hs = 12 / zoom; // visible handle size
  const hitPad = 26 / zoom; // touch-friendly hit target
  const boardHandles = [
    { key: "nw", x: 0, y: 0 },
    { key: "n", x: board.width / 2, y: 0 },
    { key: "ne", x: board.width, y: 0 },
    { key: "e", x: board.width, y: board.height / 2 },
    { key: "se", x: board.width, y: board.height },
    { key: "s", x: board.width / 2, y: board.height },
    { key: "sw", x: 0, y: board.height },
    { key: "w", x: 0, y: board.height / 2 },
  ];

  const itemHandles = (item) => [
    { key: "nw", x: item.x, y: item.y },
    { key: "ne", x: item.x + item.widthPx, y: item.y },
    { key: "se", x: item.x + item.widthPx, y: item.y + item.heightPx },
    { key: "sw", x: item.x, y: item.y + item.heightPx },
  ];

  const labelFont = clamp(13 / zoom, 4, 400);
  const smallFont = clamp(11 / zoom, 3, 340);

  /* ---------- render ---------- */

  return (
    <div className={`app ${isMobile ? "is-mobile" : ""}`}>
      <header className="header">
        <div className="header-brand">
          <Logo height={isMobile ? 20 : 24} />
          <span className="header-divider" />
          <div className="header-title">
            <h1>{T.appTitle}</h1>
            {!isMobile && <p>{T.subtitle}</p>}
          </div>
        </div>
        <div className="header-actions">
          <Button ghost iconOnly title={T.help} onClick={() => setShowHelp(true)}>
            <HelpCircle size={19} />
          </Button>
          <select className="lang-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label={T.language}>
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <Button primary onClick={exportPdf} disabled={!hasCanvas} title={T.exportPdf} iconOnly={isMobile}>
            <FileDown size={16} />
            {!isMobile && T.exportPdf}
          </Button>
        </div>
      </header>

      <div className="body">
        {!isMobile && (
          <aside className="sidebar">
            {sections.map((section) => (
              <Card
                key={section.key}
                title={section.title}
                icon={section.icon}
                badge={section.badge}
                collapsed={collapsed[section.key]}
                onToggle={() => setCollapsed((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
              >
                {section.render()}
              </Card>
            ))}
          </aside>
        )}

        <main className="main">
          <div className="toolbar">
            <div className="toolbar-group">
              <Button ghost iconOnly onClick={undo} disabled={history.past.length === 0} title={`${T.undo} (Ctrl+Z)`}>
                <Undo2 size={17} />
              </Button>
              <Button ghost iconOnly onClick={redo} disabled={history.future.length === 0} title={`${T.redo} (Ctrl+Y)`}>
                <Redo2 size={17} />
              </Button>
            </div>
            <div className="toolbar-group">
              <Button ghost iconOnly onClick={() => zoomStep(1 / 1.2)} title={T.zoomOut}>
                <ZoomOut size={17} />
              </Button>
              <button type="button" className="zoom-value" onClick={() => setZoom(1)} title={T.zoom100}>
                {Math.round(zoom * 100)} %
              </button>
              <Button ghost iconOnly onClick={() => zoomStep(1.2)} title={T.zoomIn}>
                <ZoomIn size={17} />
              </Button>
              <Button ghost iconOnly onClick={fitView} title={`${T.zoomFit} (F)`}>
                <Maximize2 size={17} />
              </Button>
            </div>
          </div>

          <div
            className={`canvas-area ${isDragOver ? "is-dragover" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer?.files?.[0];
              if (file && file.type.startsWith("image/")) loadPhotoFile(file);
            }}
          >
            <div
              ref={workspaceRef}
              className="workspace"
              onPointerDown={(e) => {
                if (e.target === workspaceRef.current || e.target.classList?.contains("canvas-wrap")) startPan(e);
              }}
            >
              {hasCanvas && (
                <div className="canvas-wrap">
                  <div className="surface" style={{ width: imageSize.width * zoom, height: imageSize.height * zoom }}>
                    <svg
                      ref={svgRef}
                      className={`board-svg ${perspectiveMode ? "is-perspective" : ""}`}
                      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                      width={imageSize.width * zoom}
                      height={imageSize.height * zoom}
                      onPointerDown={handlePerspectivePoint}
                    >
                      <defs>
                        <pattern id="defect-hatch" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                          <rect width="10" height="10" fill="rgba(185,28,28,0.10)" />
                          <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(159,14,30,0.5)" strokeWidth="4" />
                        </pattern>
                        <linearGradient id="wood-bg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#e3cba2" />
                          <stop offset="1" stopColor="#cfae7d" />
                        </linearGradient>
                      </defs>

                      {imageSrc ? (
                        <image
                          href={imageSrc}
                          x="0"
                          y="0"
                          width={imageSize.width}
                          height={imageSize.height}
                          preserveAspectRatio="none"
                          onPointerDown={(e) => {
                            if (!latest.current.perspectiveMode) startPan(e);
                          }}
                        />
                      ) : (
                        <rect
                          x="0"
                          y="0"
                          width={imageSize.width}
                          height={imageSize.height}
                          fill="url(#wood-bg)"
                          onPointerDown={(e) => {
                            if (!latest.current.perspectiveMode) startPan(e);
                          }}
                        />
                      )}

                      <g style={{ pointerEvents: perspectiveMode ? "none" : "auto" }}>
                        <g transform={`translate(${board.x}, ${board.y})`}>
                          {/* board interior grid */}
                          {showGrid && gridStepPxX > 0.5 && gridStepPxY > 0.5 && (
                            <g pointerEvents="none">
                              {Array.from({ length: Math.floor(board.width / gridStepPxX) + 1 }, (_, i) => (
                                <line key={`gx-${i}`} x1={i * gridStepPxX} y1="0" x2={i * gridStepPxX} y2={board.height} stroke="rgba(29,29,27,.18)" strokeWidth={1 / zoom} />
                              ))}
                              {Array.from({ length: Math.floor(board.height / gridStepPxY) + 1 }, (_, i) => (
                                <line key={`gy-${i}`} x1="0" y1={i * gridStepPxY} x2={board.width} y2={i * gridStepPxY} stroke="rgba(29,29,27,.18)" strokeWidth={1 / zoom} />
                              ))}
                            </g>
                          )}

                          {/* defects */}
                          {enrichedDefects.map((d) => (
                            <g key={d.id}>
                              <rect
                                x={d.x}
                                y={d.y}
                                width={d.widthPx}
                                height={d.heightPx}
                                fill="url(#defect-hatch)"
                                stroke="#9f0e1e"
                                strokeWidth={d.id === selectedDefectId ? 3 / zoom : 1.8 / zoom}
                                style={{ cursor: "move" }}
                                onPointerDown={(e) => startItemMove(e, "defect", d)}
                              />
                              {d.heightPx * zoom > 16 && (
                                <text x={d.x + 6 / zoom} y={d.y + labelFont + 4 / zoom} fontSize={labelFont} fontWeight="700" fill="#7a0b17" paintOrder="stroke" stroke="rgba(255,255,255,.85)" strokeWidth={3 / zoom} pointerEvents="none">
                                  {d.name}
                                </text>
                              )}
                              {d.id === selectedDefectId && (
                                <g data-export="exclude">
                                  {itemHandles(d).map((h) => (
                                    <g key={h.key}>
                                      <rect x={h.x - hitPad / 2} y={h.y - hitPad / 2} width={hitPad} height={hitPad} fill="transparent" style={{ cursor: RESIZE_CURSORS[h.key] }} onPointerDown={(e) => startItemResize(e, "defect", d, h.key)} />
                                      <rect x={h.x - hs / 2} y={h.y - hs / 2} width={hs} height={hs} rx={2 / zoom} fill="#fff" stroke="#9f0e1e" strokeWidth={2 / zoom} pointerEvents="none" />
                                    </g>
                                  ))}
                                </g>
                              )}
                            </g>
                          ))}

                          {/* parts */}
                          {enrichedParts.map((p) => (
                            <g key={p.id}>
                              <rect
                                x={p.x}
                                y={p.y}
                                width={p.widthPx}
                                height={p.heightPx}
                                fill={p.valid ? "rgba(21,128,61,.18)" : "rgba(180,83,9,.20)"}
                                stroke={p.valid ? "#15803d" : "#b45309"}
                                strokeWidth={Math.max(kerfStrokePx, 1.5 / zoom)}
                                style={{ cursor: "move" }}
                                onPointerDown={(e) => startItemMove(e, "part", p)}
                              />
                              {p.id === selectedPartId && (
                                <rect data-export="exclude" x={p.x} y={p.y} width={p.widthPx} height={p.heightPx} fill="none" stroke="#1d1d1b" strokeWidth={1.6 / zoom} strokeDasharray={`${6 / zoom} ${4 / zoom}`} pointerEvents="none" />
                              )}
                              {p.heightPx * zoom > 16 && (
                                <text x={p.x + 6 / zoom} y={p.y + labelFont + 4 / zoom} fontSize={labelFont} fontWeight="700" fill="#1d1d1b" paintOrder="stroke" stroke="rgba(255,255,255,.85)" strokeWidth={3 / zoom} pointerEvents="none">
                                  {p.name}
                                </text>
                              )}
                              {p.heightPx * zoom > 34 && (
                                <text x={p.x + 6 / zoom} y={p.y + labelFont + smallFont + 8 / zoom} fontSize={smallFont} fill="#3f3f3a" paintOrder="stroke" stroke="rgba(255,255,255,.8)" strokeWidth={2.5 / zoom} pointerEvents="none">
                                  {Math.round(p.lengthMm)} × {Math.round(p.widthMm)} mm
                                </text>
                              )}
                              {p.id === selectedPartId && (
                                <g data-export="exclude">
                                  {itemHandles(p).map((h) => (
                                    <g key={h.key}>
                                      <rect x={h.x - hitPad / 2} y={h.y - hitPad / 2} width={hitPad} height={hitPad} fill="transparent" style={{ cursor: RESIZE_CURSORS[h.key] }} onPointerDown={(e) => startItemResize(e, "part", p, h.key)} />
                                      <rect x={h.x - hs / 2} y={h.y - hs / 2} width={hs} height={hs} rx={2 / zoom} fill="#fff" stroke="#15803d" strokeWidth={2 / zoom} pointerEvents="none" />
                                    </g>
                                  ))}
                                </g>
                              )}
                            </g>
                          ))}

                          {/* board frame on top so calibration stays reachable */}
                          <rect x="0" y="0" width={board.width} height={board.height} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth={4.5 / zoom} pointerEvents="none" />
                          <rect x="0" y="0" width={board.width} height={board.height} fill="none" stroke="#1d1d1b" strokeWidth={2.2 / zoom} pointerEvents="none" />
                          <g data-export="exclude">
                            {[
                              { x1: 0, y1: 0, x2: board.width, y2: 0 },
                              { x1: board.width, y1: 0, x2: board.width, y2: board.height },
                              { x1: board.width, y1: board.height, x2: 0, y2: board.height },
                              { x1: 0, y1: board.height, x2: 0, y2: 0 },
                            ].map((line, i) => (
                              <line key={i} {...line} stroke="transparent" strokeWidth={18 / zoom} style={{ cursor: "move" }} onPointerDown={startBoardMove} />
                            ))}
                            {boardHandles.map((h) => (
                              <g key={h.key}>
                                <rect x={h.x - hitPad / 2} y={h.y - hitPad / 2} width={hitPad} height={hitPad} fill="transparent" style={{ cursor: RESIZE_CURSORS[h.key] }} onPointerDown={(e) => startBoardResize(e, h.key)} />
                                <rect x={h.x - hs / 2} y={h.y - hs / 2} width={hs} height={hs} rx={2 / zoom} fill="#fff" stroke="#1d1d1b" strokeWidth={2 / zoom} pointerEvents="none" />
                              </g>
                            ))}
                          </g>
                        </g>

                        {/* perspective overlay */}
                        {(perspectiveMode || perspectivePoints.length > 0) && (
                          <g data-export="exclude" pointerEvents="none">
                            {perspectivePoints.length > 1 && (
                              <polygon
                                points={perspectivePoints.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                                fill="rgba(226,0,26,.08)"
                                stroke="#e2001a"
                                strokeWidth={2 / zoom}
                                strokeDasharray={`${8 / zoom} ${5 / zoom}`}
                              />
                            )}
                            {perspectivePoints.map((point, index) => (
                              <g key={`pp-${index}`}>
                                <circle cx={point.x} cy={point.y} r={10 / zoom} fill="#e2001a" stroke="#fff" strokeWidth={2.5 / zoom} />
                                <text x={point.x + 14 / zoom} y={point.y - 10 / zoom} fontSize={16 / zoom} fontWeight="800" fill="#e2001a" paintOrder="stroke" stroke="#fff" strokeWidth={3 / zoom}>
                                  {index + 1}
                                </text>
                              </g>
                            ))}
                          </g>
                        )}
                      </g>
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* axis legend */}
            {hasCanvas && (
              <div className="axis-widget" aria-hidden="true">
                <svg viewBox="0 0 92 72" width="92" height="72">
                  <line x1="14" y1="54" x2="74" y2="54" stroke="#1d1d1b" strokeWidth="3" markerEnd="url(#axis-arrow)" />
                  <polygon points="74,49 84,54 74,59" fill="#1d1d1b" />
                  <line x1="14" y1="54" x2="14" y2="16" stroke="#e2001a" strokeWidth="3" />
                  <polygon points="9,16 14,6 19,16" fill="#e2001a" />
                  <circle cx="14" cy="54" r="4" fill="#1d1d1b" />
                  <text x="70" y="45" fontSize="13" fontWeight="800" fill="#1d1d1b">X</text>
                  <text x="22" y="14" fontSize="13" fontWeight="800" fill="#e2001a">Y</text>
                </svg>
                <div className="axis-legend">
                  {T.xLegend}
                  <br />
                  {T.yLegend}
                </div>
              </div>
            )}

            {/* perspective banner */}
            {perspectiveMode && (
              <div className="perspective-banner">
                <Crop size={16} />
                <span>{format(T.pointsRemaining, { n: Math.max(0, 4 - perspectivePoints.length) })}</span>
                <Button ghost disabled={perspectivePoints.length === 0} onClick={() => setPerspectivePoints((prev) => prev.slice(0, -1))}>
                  {T.undoPoint}
                </Button>
                <Button ghost onClick={cancelPerspective}>
                  {T.cancel}
                </Button>
              </div>
            )}

            {/* empty state */}
            {!hasCanvas && (
              <div className="dropzone">
                <div className="dropzone-inner">
                  <ImagePlus size={44} strokeWidth={1.4} />
                  <h2>{T.dropTitle}</h2>
                  <p>{T.dropText}</p>
                  <div className="dropzone-actions">
                    <FileButton primary onFile={loadPhotoFile} title={T.choosePhoto}>
                      <ImagePlus size={16} />
                      {T.choosePhoto}
                    </FileButton>
                    <Button onClick={() => setShowLibrary(true)} title={T.mediaLibrary}>
                      <Images size={16} />
                      {T.mediaLibrary}
                    </Button>
                    <Button ghost onClick={startBlank} title={T.startBlank}>
                      {T.startBlank}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isMobile && hasCanvas && (
            <div className="statusbar">
              <span>
                1 px ≙ {safeMmPerPxX.toFixed(2)} / {safeMmPerPxY.toFixed(2)} mm
              </span>
              <span>
                {T.reportBoard}: {Math.round(board.realLengthMm)} × {Math.round(board.realWidthMm)} mm
              </span>
              <span>
                {T.partsTotal}: {enrichedParts.length}
              </span>
              <span className="statusbar-yield">
                {T.yield}: {yieldPercent.toFixed(1)} %
              </span>
            </div>
          )}
        </main>
      </div>

      {/* mobile tab sheet */}
      {isMobile && (
        <>
          {activeTab && (
            <div className="tab-sheet">
              <div className="tab-sheet-head">
                <strong>{sections.find((s) => s.key === activeTab)?.title}</strong>
                <Button ghost iconOnly title={T.close} onClick={() => setActiveTab(null)}>
                  ✕
                </Button>
              </div>
              <div className="tab-sheet-body">{sections.find((s) => s.key === activeTab)?.render()}</div>
            </div>
          )}
          <nav className="tabbar">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`tabbar-item ${activeTab === section.key ? "is-active" : ""}`}
                onClick={() => setActiveTab((prev) => (prev === section.key ? null : section.key))}
              >
                {section.icon}
                <span>{section.tab}</span>
                {section.badge != null && <span className="tabbar-badge">{section.badge}</span>}
              </button>
            ))}
          </nav>
        </>
      )}

      {/* media library */}
      {showLibrary && (
        <Modal title={T.chooseLibraryPhoto} onClose={() => setShowLibrary(false)} closeLabel={T.close}>
          <div className="library-toolbar">
            <FileButton primary onFile={addPhotoToLibrary} title={T.addToLibrary}>
              <ImagePlus size={16} />
              {T.addToLibrary}
            </FileButton>
          </div>
          <div className="library-grid">
            {libraryPhotos.map((photo) => (
              <div className="library-card" key={photo.id}>
                <img
                  src={photo.src}
                  alt={photo.label}
                  onClick={() => {
                    applyImageSource(photo.src, photo.width, photo.height);
                    setShowLibrary(false);
                    pushToast(T.toastPhotoReplaced);
                  }}
                />
                <div className="library-meta">
                  <strong>{photo.label}</strong>
                  <span>
                    {T.quality} {photo.quality} · {photo.width}×{photo.height}
                  </span>
                </div>
                <div className="library-actions">
                  <Button
                    primary
                    onClick={() => {
                      applyImageSource(photo.src, photo.width, photo.height);
                      setShowLibrary(false);
                      pushToast(T.toastPhotoReplaced);
                    }}
                    title={T.useThisPhoto}
                  >
                    {T.useThisPhoto}
                  </Button>
                  {!photo.demo && (
                    <Button ghost iconOnly title={T.remove} onClick={() => setLibraryPhotos((prev) => prev.filter((p) => p.id !== photo.id))}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* help */}
      {showHelp && (
        <Modal title={T.shortcutsTitle} onClose={() => setShowHelp(false)} closeLabel={T.close}>
          <table className="shortcut-table">
            <tbody>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>Z</kbd></td>
                <td>{T.scUndo}</td>
              </tr>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>Y</kbd></td>
                <td>{T.scRedo}</td>
              </tr>
              <tr>
                <td><kbd>Entf</kbd></td>
                <td>{T.scDelete}</td>
              </tr>
              <tr>
                <td><kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd></td>
                <td>{T.scNudge}</td>
              </tr>
              <tr>
                <td><kbd>Shift</kbd> + <kbd>←→↑↓</kbd></td>
                <td>{T.scNudgeFast}</td>
              </tr>
              <tr>
                <td><kbd>+</kbd> / <kbd>−</kbd></td>
                <td>{T.scZoom}</td>
              </tr>
              <tr>
                <td><kbd>F</kbd></td>
                <td>{T.scFit}</td>
              </tr>
              <tr>
                <td><kbd>Esc</kbd></td>
                <td>{T.scEscape}</td>
              </tr>
            </tbody>
          </table>
          <h3 className="help-subhead">{T.gestures}</h3>
          <p className="muted">{T.gestureDrag}</p>
          <p className="muted">{T.gesturePinch}</p>
        </Modal>
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
