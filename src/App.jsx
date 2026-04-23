import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronDown, Copy, CornerDownRight, Move, Plus, Redo2, RotateCw, Search, Square, Trash2, Undo2, Upload, ZoomIn, ZoomOut } from "lucide-react";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clamp01 = (v) => clamp(v, 0, 1);

const translations = {
  de: {
    appTitle: "Holz-Ausbeute-App",
    language: "Sprache",
    uploadPhoto: "Brettfoto laden",
    hint: "Foto laden, bei Bedarf um 90° drehen und anschließend die vier Brettecken markieren, damit das Bild automatisch entzerrt wird.",
    historyTitle: "Aktionen",
    undo: "Zurück",
    redo: "Vor",
    step1: "1. Brett kalibrieren",
    boardLength: "Brettlänge real [mm]",
    boardWidth: "Brettbreite real [mm]",
    moveFrame: "Rahmen verschieben",
    resizeFrame: "Rahmen skalieren",
    scaling: "Aktuelle Skalierung:",
    pxLength: "mm in Längsrichtung",
    pxWidth: "mm in Breitenrichtung",
    rotateImage: "Foto 90° drehen",
    perspectiveTitle: "Perspektivkorrektur",
    startPerspective: "Brettecken wählen",
    resetPerspective: "Entzerrung zurücksetzen",
    perspectiveHint: "Klicke nacheinander auf: oben links, oben rechts, unten rechts, unten links.",
    perspectiveRemaining: "Verbleibende Punkte:",
    zoomTitle: "Zoom",
    zoomIn: "Reinzoomen",
    zoomOut: "Rauszoomen",
    zoomReset: "Zoom zurücksetzen",
    zoomLevel: "Zoomstufe:",
    step2: "2. Geometrien und Fehlerstellen",
    addRectangle: "Rechteck hinzufügen",
    addDefect: "Fehlerstelle hinzufügen",
    duplicatePart: "Bauteil duplizieren",
    selectedPart: "Ausgewähltes Bauteil:",
    partLength: "Bauteillänge [mm]",
    partWidth: "Bauteilbreite [mm]",
    partName: "Bezeichnung",
    deletePart: "Bauteil löschen",
    selectedDefect: "Ausgewählte Fehlerstelle",
    defectHint: "Fehlerstelle direkt auf dem Bild an Ecken oder Kanten ziehen.",
    deleteDefect: "Fehlerstelle löschen",
    step3: "3. Berechnung",
    boardArea: "Brettfläche:",
    validPartArea: "Gültige Teilefläche:",
    yield: "Ausbeute:",
    noParts: "Noch keine Bauteile angelegt.",
    status: "Status:",
    valid: "gültig",
    overlapsDefect: "überlappt Fehlerstelle",
    outsideBoard: "liegt außerhalb des Bretts",
    workspace: "Arbeitsfläche",
    part: "Teil",
    defect: "Fehler",
    gridTitle: "Raster und Sägefuge",
    showGrid: "10-cm-Raster einblenden",
    kerfWidth: "Sägefuge [mm]",
    kerfPreview: "Linienstärke auf Basis der Sägefuge:",
    kerfUnit: "px",
  },
  en: {
    appTitle: "Wood Yield App",
    language: "Language",
    uploadPhoto: "Upload board photo",
    hint: "Upload the photo, rotate it by 90° if needed, then mark the four board corners so the image can be rectified automatically.",
    historyTitle: "Actions",
    undo: "Undo",
    redo: "Redo",
    step1: "1. Calibrate board",
    boardLength: "Real board length [mm]",
    boardWidth: "Real board width [mm]",
    moveFrame: "Move frame",
    resizeFrame: "Resize frame",
    scaling: "Current scaling:",
    pxLength: "mm in length direction",
    pxWidth: "mm in width direction",
    rotateImage: "Rotate photo 90°",
    perspectiveTitle: "Perspective correction",
    startPerspective: "Pick board corners",
    resetPerspective: "Reset rectification",
    perspectiveHint: "Click in this order: top left, top right, bottom right, bottom left.",
    perspectiveRemaining: "Remaining points:",
    zoomTitle: "Zoom",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    zoomReset: "Reset zoom",
    zoomLevel: "Zoom level:",
    step2: "2. Shapes and defects",
    addRectangle: "Add rectangle",
    addDefect: "Add defect",
    duplicatePart: "Duplicate part",
    selectedPart: "Selected part:",
    partLength: "Part length [mm]",
    partWidth: "Part width [mm]",
    partName: "Label",
    deletePart: "Delete part",
    selectedDefect: "Selected defect",
    defectHint: "Adjust the defect directly on the image by dragging corners or edges.",
    deleteDefect: "Delete defect",
    step3: "3. Calculation",
    boardArea: "Board area:",
    validPartArea: "Valid part area:",
    yield: "Yield:",
    noParts: "No parts created yet.",
    status: "Status:",
    valid: "valid",
    overlapsDefect: "overlaps defect",
    outsideBoard: "outside board",
    workspace: "Workspace",
    part: "Part",
    defect: "Defect",
    gridTitle: "Grid and saw kerf",
    showGrid: "Show 10 cm grid",
    kerfWidth: "Saw kerf [mm]",
    kerfPreview: "Line width based on saw kerf:",
    kerfUnit: "px",
  },
  fr: {
    appTitle: "Application de rendement du bois",
    language: "Langue",
    uploadPhoto: "Télécharger la photo de la planche",
    hint: "Téléchargez la photo, faites-la pivoter de 90° si nécessaire, puis marquez les quatre coins de la planche pour corriger automatiquement la perspective.",
    historyTitle: "Actions",
    undo: "Retour",
    redo: "Avancer",
    step1: "1. Calibrer la planche",
    boardLength: "Longueur réelle de la planche [mm]",
    boardWidth: "Largeur réelle de la planche [mm]",
    moveFrame: "Déplacer le cadre",
    resizeFrame: "Redimensionner le cadre",
    scaling: "Échelle actuelle :",
    pxLength: "mm dans le sens de la longueur",
    pxWidth: "mm dans le sens de la largeur",
    rotateImage: "Pivoter la photo de 90°",
    perspectiveTitle: "Correction de perspective",
    startPerspective: "Choisir les coins",
    resetPerspective: "Réinitialiser la correction",
    perspectiveHint: "Cliquez dans cet ordre : haut gauche, haut droite, bas droite, bas gauche.",
    perspectiveRemaining: "Points restants :",
    zoomTitle: "Zoom",
    zoomIn: "Zoomer",
    zoomOut: "Dézoomer",
    zoomReset: "Réinitialiser le zoom",
    zoomLevel: "Niveau de zoom :",
    step2: "2. Géométries et défauts",
    addRectangle: "Ajouter un rectangle",
    addDefect: "Ajouter un défaut",
    duplicatePart: "Dupliquer la pièce",
    selectedPart: "Pièce sélectionnée :",
    partLength: "Longueur de la pièce [mm]",
    partWidth: "Largeur de la pièce [mm]",
    partName: "Nom",
    deletePart: "Supprimer la pièce",
    selectedDefect: "Défaut sélectionné",
    defectHint: "Ajustez le défaut directement sur l'image en tirant les coins ou les bords.",
    deleteDefect: "Supprimer le défaut",
    step3: "3. Calcul",
    boardArea: "Surface de la planche :",
    validPartArea: "Surface valide des pièces :",
    yield: "Rendement :",
    noParts: "Aucune pièce créée pour le moment.",
    status: "Statut :",
    valid: "valide",
    overlapsDefect: "chevauche un défaut",
    outsideBoard: "hors de la planche",
    workspace: "Zone de travail",
    part: "Pièce",
    defect: "Défaut",
    gridTitle: "Grille et trait de scie",
    showGrid: "Afficher une grille de 10 cm",
    kerfWidth: "Trait de scie [mm]",
    kerfPreview: "Épaisseur de ligne basée sur le trait de scie :",
    kerfUnit: "px",
  },
};

const solveLinearSystem = (matrix, vector) => {
  const n = matrix.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
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
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      resolve({ src: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height });
    };
    img.src = src;
  });

const rectifyImageFromCorners = (src, points) =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const topWidth = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const bottomWidth = Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y);
      const leftHeight = Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y);
      const rightHeight = Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y);
      const targetWidth = Math.max(1, Math.round(Math.max(topWidth, bottomWidth)));
      const targetHeight = Math.max(1, Math.round(Math.max(leftHeight, rightHeight)));
      const dst = [
        { x: 0, y: 0 },
        { x: targetWidth - 1, y: 0 },
        { x: targetWidth - 1, y: targetHeight - 1 },
        { x: 0, y: targetHeight - 1 },
      ];
      const homography = computeHomography(points, dst);
      if (!homography) {
        resolve(null);
        return;
      }
      const inverse = invert3x3(homography);
      if (!inverse) {
        resolve(null);
        return;
      }
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      const srcCtx = srcCanvas.getContext("2d");
      srcCtx.drawImage(img, 0, 0);
      const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
      const outCanvas = document.createElement("canvas");
      outCanvas.width = targetWidth;
      outCanvas.height = targetHeight;
      const outCtx = outCanvas.getContext("2d");
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
    img.src = src;
  });

const createPart = (id, boardPxWidth, boardPxHeight, mmPerPxX, mmPerPxY, t) => {
  const safeMmPerPxX = Number.isFinite(mmPerPxX) && mmPerPxX > 0 ? mmPerPxX : 1;
  const safeMmPerPxY = Number.isFinite(mmPerPxY) && mmPerPxY > 0 ? mmPerPxY : 1;
  const defaultLengthMm = 300;
  const defaultWidthMm = 80;
  const pxLength = defaultLengthMm / safeMmPerPxX;
  const pxWidth = defaultWidthMm / safeMmPerPxY;
  return {
    id,
    name: `${t.part} ${id}`,
    lengthMm: defaultLengthMm,
    widthMm: defaultWidthMm,
    x: Math.max(10, boardPxWidth / 2 - pxLength / 2),
    y: Math.max(10, boardPxHeight / 2 - pxWidth / 2),
  };
};

const createDefect = (id, boardPxWidth, boardPxHeight, mmPerPxX, mmPerPxY, t) => {
  const safeMmPerPxX = Number.isFinite(mmPerPxX) && mmPerPxX > 0 ? mmPerPxX : 1;
  const safeMmPerPxY = Number.isFinite(mmPerPxY) && mmPerPxY > 0 ? mmPerPxY : 1;
  const defaultLengthMm = 120;
  const defaultWidthMm = 80;
  const pxLength = defaultLengthMm / safeMmPerPxX;
  const pxWidth = defaultWidthMm / safeMmPerPxY;
  return {
    id,
    name: `${t.defect} ${id}`,
    lengthMm: defaultLengthMm,
    widthMm: defaultWidthMm,
    x: Math.max(10, boardPxWidth / 2 - pxLength / 2),
    y: Math.max(10, boardPxHeight / 2 - pxWidth / 2),
  };
};

const snapshotState = (parts, defects, selectedPartId, selectedDefectId) => ({
  parts: JSON.parse(JSON.stringify(parts)),
  defects: JSON.parse(JSON.stringify(defects)),
  selectedPartId,
  selectedDefectId,
});

const CollapsibleCard = ({ title, isCollapsed, onToggle, children, sticky = false }) => (
  <Card className={sticky ? "rounded-2xl shadow-sm" : "rounded-2xl shadow-sm"}>
    <CardHeader onClick={onToggle} className="cursor-pointer select-none">
      <div className="flex items-center justify-between gap-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
      </div>
    </CardHeader>
    {!isCollapsed && <CardContent>{children}</CardContent>}
  </Card>
);

export default function App() {
  const [language, setLanguage] = useState("de");
  const t = translations[language];
  const [imageSrc, setImageSrc] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1000, height: 600 });
  const [board, setBoard] = useState({ x: 80, y: 60, width: 700, height: 240, realLengthMm: 4000, realWidthMm: 500 });
  const [parts, setParts] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [boardMode, setBoardMode] = useState("move");
  const [defects, setDefects] = useState([]);
  const [selectedDefectId, setSelectedDefectId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [sawKerfMm, setSawKerfMm] = useState(4);
  const [perspectiveMode, setPerspectiveMode] = useState(false);
  const [perspectivePoints, setPerspectivePoints] = useState([]);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState({
    upload: false,
    perspective: true,
    step1: true,
    step2: false,
    grid: true,
    step3: true,
  });

  const svgRef = useRef(null);
  const nextPartId = useRef(1);
  const nextDefectId = useRef(1);

  const mmPerPxX = board.width > 0 ? board.realLengthMm / board.width : 0;
  const mmPerPxY = board.height > 0 ? board.realWidthMm / board.height : 0;
  const safeMmPerPxX = Number.isFinite(mmPerPxX) && mmPerPxX > 0 ? mmPerPxX : 1;
  const safeMmPerPxY = Number.isFinite(mmPerPxY) && mmPerPxY > 0 ? mmPerPxY : 1;
  const boardAreaMm2 = Math.max(0, board.realLengthMm) * Math.max(0, board.realWidthMm);
  const gridStepPxX = 100 / safeMmPerPxX;
  const gridStepPxY = 100 / safeMmPerPxY;
  const sawKerfStrokePx = Math.max(1, ((Math.max(0, sawKerfMm) / safeMmPerPxX) + (Math.max(0, sawKerfMm) / safeMmPerPxY)) / 2);

  const enrichedDefects = useMemo(() => defects.map((d) => {
    const lengthMm = Math.max(0, d.lengthMm);
    const widthMm = Math.max(0, d.widthMm);
    return { ...d, lengthMm, widthMm, widthPx: lengthMm / safeMmPerPxX, heightPx: widthMm / safeMmPerPxY };
  }), [defects, safeMmPerPxX, safeMmPerPxY]);

  const enrichedParts = useMemo(() => parts.map((p) => {
    const lengthMm = Math.max(0, p.lengthMm);
    const widthMm = Math.max(0, p.widthMm);
    const widthPx = lengthMm / safeMmPerPxX;
    const heightPx = widthMm / safeMmPerPxY;
    const insideBoard = p.x >= 0 && p.y >= 0 && p.x + widthPx <= board.width && p.y + heightPx <= board.height;
    const overlapsDefect = enrichedDefects.some((d) => !(p.x + widthPx <= d.x || p.x >= d.x + d.widthPx || p.y + heightPx <= d.y || p.y >= d.y + d.heightPx));
    return { ...p, lengthMm, widthMm, widthPx, heightPx, areaMm2: lengthMm * widthMm, insideBoard, overlapsDefect, valid: insideBoard && !overlapsDefect };
  }), [parts, enrichedDefects, board.width, board.height, safeMmPerPxX, safeMmPerPxY]);

  const validAreaMm2 = enrichedParts.filter((p) => p.valid).reduce((sum, p) => sum + p.areaMm2, 0);
  const yieldPercent = boardAreaMm2 > 0 ? (validAreaMm2 / boardAreaMm2) * 100 : 0;
  const selectedPart = enrichedParts.find((p) => p.id === selectedPartId) || null;
  const selectedDefect = enrichedDefects.find((d) => d.id === selectedDefectId) || null;

  const toggleSection = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const pushHistory = () => {
    setHistory((prev) => ({
      past: [...prev.past, snapshotState(parts, defects, selectedPartId, selectedDefectId)],
      future: [],
    }));
  };

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

  const resetBoardToImage = (width, height) => {
    setBoard((prev) => ({ ...prev, x: width * 0.1, y: height * 0.3, width: width * 0.8, height: height * 0.35 }));
  };

  const getMousePos = (event) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * imageSize.width,
      y: ((event.clientY - rect.top) / rect.height) * imageSize.height,
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) return;
      const img = new window.Image();
      img.onload = () => {
        setImageSrc(src);
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        resetBoardToImage(img.naturalWidth, img.naturalHeight);
        resetGeometry();
        setPerspectivePoints([]);
        setPerspectiveMode(false);
        setZoom(1);
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
    setZoom(1);
  };

  const handleResetPerspective = () => {
    setPerspectivePoints([]);
    setPerspectiveMode(false);
  };

  useEffect(() => {
    const runRectification = async () => {
      if (perspectivePoints.length !== 4 || !imageSrc) return;
      const rectified = await rectifyImageFromCorners(imageSrc, perspectivePoints);
      if (!rectified) {
        setPerspectiveMode(false);
        setPerspectivePoints([]);
        return;
      }
      setImageSrc(rectified.src);
      setImageSize({ width: rectified.width, height: rectified.height });
      resetBoardToImage(rectified.width, rectified.height);
      resetGeometry();
      setPerspectiveMode(false);
      setPerspectivePoints([]);
      setZoom(1);
    };
    runRectification();
  }, [perspectivePoints, imageSrc]);

  const addPart = () => {
    pushHistory();
    const part = createPart(nextPartId.current, board.width, board.height, safeMmPerPxX, safeMmPerPxY, t);
    nextPartId.current += 1;
    setParts((prev) => [...prev, part]);
    setSelectedPartId(part.id);
    setSelectedDefectId(null);
  };

  const duplicateSelectedPart = () => {
    if (!selectedPart) return;
    pushHistory();
    const duplicated = {
      ...selectedPart,
      id: nextPartId.current,
      name: `${selectedPart.name} ${nextPartId.current}`,
      x: clamp(selectedPart.x + 20, 0, Math.max(0, board.width - selectedPart.widthPx)),
      y: clamp(selectedPart.y + 20, 0, Math.max(0, board.height - selectedPart.heightPx)),
    };
    nextPartId.current += 1;
    setParts((prev) => [...prev, { id: duplicated.id, name: duplicated.name, lengthMm: duplicated.lengthMm, widthMm: duplicated.widthMm, x: duplicated.x, y: duplicated.y }]);
    setSelectedPartId(duplicated.id);
    setSelectedDefectId(null);
  };

  const addDefect = () => {
    pushHistory();
    const defect = createDefect(nextDefectId.current, board.width, board.height, safeMmPerPxX, safeMmPerPxY, t);
    nextDefectId.current += 1;
    setDefects((prev) => [...prev, defect]);
    setSelectedDefectId(defect.id);
    setSelectedPartId(null);
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

  const updateSelectedPart = (patch) => {
    if (selectedPartId === null) return;
    pushHistory();
    setParts((prev) => prev.map((p) => (p.id === selectedPartId ? { ...p, ...patch } : p)));
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

  const handleWorkspacePointerDown = (event) => {
    if (!perspectiveMode) return;
    const pos = getMousePos(event);
    setPerspectivePoints((prev) => [...prev, { x: clamp01(pos.x / imageSize.width) * imageSize.width, y: clamp01(pos.y / imageSize.height) * imageSize.height }]);
  };

  const onPointerDownBoard = (event) => {
    if (perspectiveMode) return;
    const pos = getMousePos(event);
    if (boardMode === "move") {
      setDragState({ type: "board-move", startX: pos.x, startY: pos.y, startBoard: { ...board } });
    } else {
      setDragState({ type: "board-resize", startX: pos.x, startY: pos.y, startBoard: { ...board } });
    }
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
      const draggedPart = enrichedParts.find((p) => p.id === dragState.partId);
      const partWidthPx = draggedPart?.widthPx ?? 0;
      const partHeightPx = draggedPart?.heightPx ?? 0;
      setParts((prev) => prev.map((p) => p.id === dragState.partId ? { ...p, x: clamp(pos.x - board.x - dragState.offsetX, 0, Math.max(0, board.width - partWidthPx)), y: clamp(pos.y - board.y - dragState.offsetY, 0, Math.max(0, board.height - partHeightPx)) } : p));
      return;
    }
    if (dragState.type === "defect-move") {
      const draggedDefect = enrichedDefects.find((d) => d.id === dragState.defectId);
      const defectWidthPx = draggedDefect?.widthPx ?? 0;
      const defectHeightPx = draggedDefect?.heightPx ?? 0;
      setDefects((prev) => prev.map((d) => d.id === dragState.defectId ? { ...d, x: clamp(pos.x - board.x - dragState.offsetX, 0, Math.max(0, board.width - defectWidthPx)), y: clamp(pos.y - board.y - dragState.offsetY, 0, Math.max(0, board.height - defectHeightPx)) } : d));
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
      const newLengthMm = widthPx * safeMmPerPxX;
      const newWidthMm = heightPx * safeMmPerPxY;
      setDefects((prev) => prev.map((d) => d.id === dragState.defectId ? { ...d, x, y, lengthMm: newLengthMm, widthMm: newWidthMm } : d));
    }
  };

  const onPointerUp = () => setDragState(null);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <CollapsibleCard title={t.appTitle} isCollapsed={collapsed.upload} onToggle={() => toggleSection("upload")}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.language}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUpload">{t.uploadPhoto}</Label>
                <div className="flex items-center gap-2">
                  <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} />
                  <Upload className="h-4 w-4 text-slate-500" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleRotateImage} disabled={!imageSrc}>
                  <RotateCw className="mr-2 h-4 w-4" /> {t.rotateImage}
                </Button>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t.hint}</div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title={t.perspectiveTitle} isCollapsed={collapsed.perspective} onToggle={() => toggleSection("perspective")}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant={perspectiveMode ? "default" : "outline"} onClick={() => { setPerspectiveMode(true); setPerspectivePoints([]); }} disabled={!imageSrc}><CornerDownRight className="mr-2 h-4 w-4" /> {t.startPerspective}</Button>
                <Button variant="outline" onClick={handleResetPerspective} disabled={!perspectiveMode && perspectivePoints.length === 0}>{t.resetPerspective}</Button>
              </div>
              <div className="text-sm text-slate-600">{t.perspectiveHint}</div>
              <div className="text-sm text-slate-600">{t.perspectiveRemaining} {Math.max(0, 4 - perspectivePoints.length)}</div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title={t.step1} isCollapsed={collapsed.step1} onToggle={() => toggleSection("step1")}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>{t.boardLength}</Label><Input type="number" value={board.realLengthMm} onChange={(e) => setBoard((prev) => ({ ...prev, realLengthMm: Number(e.target.value) || 0 }))} /></div>
                <div className="space-y-2"><Label>{t.boardWidth}</Label><Input type="number" value={board.realWidthMm} onChange={(e) => setBoard((prev) => ({ ...prev, realWidthMm: Number(e.target.value) || 0 }))} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={boardMode === "move" ? "default" : "outline"} onClick={() => setBoardMode("move")}><Move className="mr-2 h-4 w-4" /> {t.moveFrame}</Button>
                <Button variant={boardMode === "resize" ? "default" : "outline"} onClick={() => setBoardMode("resize")}><Square className="mr-2 h-4 w-4" /> {t.resizeFrame}</Button>
              </div>
              <div className="text-sm text-slate-600">{t.scaling} 1 px = {safeMmPerPxX.toFixed(2)} {t.pxLength}, {safeMmPerPxY.toFixed(2)} {t.pxWidth}.</div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title={t.step2} isCollapsed={collapsed.step2} onToggle={() => toggleSection("step2")}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={addPart}><Plus className="mr-2 h-4 w-4" /> {t.addRectangle}</Button>
                <Button variant="outline" onClick={addDefect}><AlertCircle className="mr-2 h-4 w-4" /> {t.addDefect}</Button>
                <Button variant="outline" onClick={duplicateSelectedPart} disabled={!selectedPart}><Copy className="mr-2 h-4 w-4" /> {t.duplicatePart}</Button>
              </div>
              {selectedPart && (
                <div className="space-y-3 rounded-xl border p-3">
                  <div className="font-medium">{t.selectedPart} {selectedPart.name}</div>
                  <div className="space-y-2">
                    <Label>{t.partName}</Label>
                    <Input value={selectedPart.name} onChange={(e) => updateSelectedPart({ name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>{t.partLength}</Label><Input type="number" value={selectedPart.lengthMm} onChange={(e) => updateSelectedPart({ lengthMm: Number(e.target.value) || 0 })} /></div>
                    <div className="space-y-2"><Label>{t.partWidth}</Label><Input type="number" value={selectedPart.widthMm} onChange={(e) => updateSelectedPart({ widthMm: Number(e.target.value) || 0 })} /></div>
                  </div>
                  <Button variant="destructive" onClick={removeSelectedPart}><Trash2 className="mr-2 h-4 w-4" /> {t.deletePart}</Button>
                </div>
              )}
              {selectedDefect && (
                <div className="space-y-3 rounded-xl border p-3">
                  <div className="font-medium">{t.selectedDefect}</div>
                  <div className="text-sm text-slate-600">{t.defectHint}</div>
                  <Button variant="destructive" onClick={removeSelectedDefect}><Trash2 className="mr-2 h-4 w-4" /> {t.deleteDefect}</Button>
                </div>
              )}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title={t.gridTitle} isCollapsed={collapsed.grid} onToggle={() => toggleSection("grid")}>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                <span>{t.showGrid}</span>
              </label>
              <div className="space-y-2"><Label>{t.kerfWidth}</Label><Input type="number" min="0" value={sawKerfMm} onChange={(e) => setSawKerfMm(Number(e.target.value) || 0)} /></div>
              <div className="text-sm text-slate-600">{t.kerfPreview} {sawKerfStrokePx.toFixed(2)} {t.kerfUnit}</div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title={t.step3} isCollapsed={collapsed.step3} onToggle={() => toggleSection("step3")}>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <div>{t.boardArea} {(boardAreaMm2 / 1000000).toFixed(3)} m²</div>
                <div>{t.validPartArea} {(validAreaMm2 / 1000000).toFixed(3)} m²</div>
                <div className="mt-2 text-lg font-semibold">{t.yield} {yieldPercent.toFixed(1)} %</div>
              </div>
              <div className="space-y-2 text-sm">
                {enrichedParts.length === 0 && <div className="text-slate-500">{t.noParts}</div>}
                {enrichedParts.map((p) => (
                  <div key={p.id} className={`rounded-lg border p-2 ${p.valid ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                    <div className="font-medium">{p.name}</div>
                    <div>{p.lengthMm} × {p.widthMm} mm</div>
                    <div>{t.status} {p.valid ? t.valid : p.overlapsDefect ? t.overlapsDefect : t.outsideBoard}</div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleCard>
        </div>

        <div className="space-y-4">
          <div className="sticky top-4 z-20 space-y-3 bg-slate-100/95 pb-2 backdrop-blur">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={undo} disabled={history.past.length === 0}><Undo2 className="mr-2 h-4 w-4" /> {t.undo}</Button>
                  <Button variant="outline" onClick={redo} disabled={history.future.length === 0}><Redo2 className="mr-2 h-4 w-4" /> {t.redo}</Button>
                  <Button variant="outline" onClick={() => setZoom((z) => clamp(Number((z - 0.25).toFixed(2)), 0.5, 4))}><ZoomOut className="mr-2 h-4 w-4" /> {t.zoomOut}</Button>
                  <Button variant="outline" onClick={() => setZoom((z) => clamp(Number((z + 0.25).toFixed(2)), 0.5, 4))}><ZoomIn className="mr-2 h-4 w-4" /> {t.zoomIn}</Button>
                  <Button variant="outline" onClick={() => setZoom(1)}><Search className="mr-2 h-4 w-4" /> {t.zoomReset}</Button>
                </div>
                <div className="mt-3 text-sm text-slate-600">{t.zoomLevel} {zoom.toFixed(2)}x</div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-lg">{t.workspace}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-2xl border bg-white" style={{ height: "78vh" }}>
                <div style={{ width: `${imageSize.width * zoom}px`, height: `${imageSize.height * zoom}px` }}>
                  <svg ref={svgRef} viewBox={`0 0 ${imageSize.width} ${imageSize.height}`} className="touch-none" style={{ width: `${imageSize.width * zoom}px`, height: `${imageSize.height * zoom}px`, display: "block" }} onPointerDown={handleWorkspacePointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onPointerCancel={onPointerUp}>
                    {imageSrc ? <image href={imageSrc} x="0" y="0" width={imageSize.width} height={imageSize.height} preserveAspectRatio="none" /> : <rect x="0" y="0" width={imageSize.width} height={imageSize.height} fill="#e2e8f0" />}
                    {perspectivePoints.map((point, index) => (
                      <g key={`perspective-${index}`} pointerEvents="none">
                        <circle cx={point.x} cy={point.y} r="8" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
                        <text x={point.x + 10} y={point.y - 10} fontSize="18" fill="#92400e">{index + 1}</text>
                      </g>
                    ))}
                    <g transform={`translate(${board.x}, ${board.y})`}>
                      <rect x="0" y="0" width={board.width} height={board.height} fill="rgba(34,197,94,0.08)" stroke="#16a34a" strokeWidth="4" onPointerDown={onPointerDownBoard} />
                      {showGrid && gridStepPxX > 0 && gridStepPxY > 0 && (
                        <g pointerEvents="none">
                          {Array.from({ length: Math.floor(board.width / gridStepPxX) + 1 }, (_, i) => <line key={`grid-x-${i}`} x1={i * gridStepPxX} y1={0} x2={i * gridStepPxX} y2={board.height} stroke="rgba(15,23,42,0.18)" strokeWidth="0.8" />)}
                          {Array.from({ length: Math.floor(board.height / gridStepPxY) + 1 }, (_, i) => <line key={`grid-y-${i}`} x1={0} y1={i * gridStepPxY} x2={board.width} y2={i * gridStepPxY} stroke="rgba(15,23,42,0.18)" strokeWidth="0.8" />)}
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
                            <rect x={d.x} y={d.y} width={d.widthPx} height={d.heightPx} fill={d.id === selectedDefectId ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.2)"} stroke="#dc2626" strokeWidth={sawKerfStrokePx} onPointerDown={(e) => onPointerDownDefect(e, d.id)} />
                            <text x={d.x + 8} y={d.y + 18} fontSize="16" fill="#7f1d1d">{d.name}</text>
                            {d.id === selectedDefectId && handles.map((h) => (
                              <rect key={h.key} x={h.x - 6} y={h.y - 6} width={12} height={12} fill="#fff" stroke="#dc2626" strokeWidth="2" onPointerDown={(e) => onPointerDownResizeDefect(e, d.id, h.key)} />
                            ))}
                          </g>
                        );
                      })}
                      {enrichedParts.map((p) => (
                        <g key={p.id} onPointerDown={(e) => onPointerDownPart(e, p.id)}>
                          <rect x={p.x} y={p.y} width={p.widthPx} height={p.heightPx} fill={p.valid ? "rgba(59,130,246,0.20)" : "rgba(244,63,94,0.20)"} stroke={p.id === selectedPartId ? "#1d4ed8" : p.valid ? "#2563eb" : "#e11d48"} strokeWidth={sawKerfStrokePx} />
                          <text x={p.x + 8} y={p.y + 18} fontSize="16" fill="#0f172a">{p.name}</text>
                        </g>
                      ))}
                    </g>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
