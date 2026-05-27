
 import React, { useEffect, useMemo, useRef, useState } from "react";
 
 const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
 const clamp01 = (value) => clamp(value, 0, 1);
 const SNAP_DISTANCE_PX = 14;
+const PHOTO_QUALITIES = ["A", "B", "C"];
 
 const TRANSLATIONS = {
   de: {
     appTitle: "Holz-Ausbeute-App",
     subtitle: "Ausbeute visuell planen und dokumentieren",
     language: "Sprache",
     uploadPhoto: "Brettfoto laden",
+    mediaLibrary: "Mediathek",
+    uploadToLibrary: "Zur Mediathek hinzufügen",
+    chooseLibraryPhoto: "Foto aus Mediathek wählen",
     rotateImage: "Foto 90° drehen",
     perspectiveTitle: "Perspektivkorrektur",
     startPerspective: "Brettecken wählen",
     resetPerspective: "Zurücksetzen",
     perspectiveHint: "Reihenfolge: oben links, oben rechts, unten rechts, unten links.",
     perspectiveRemaining: "Punkte offen:",
     boardTitle: "Brett kalibrieren",
     boardLength: "X [mm]",
     boardWidth: "Y [mm]",
     xAxis: "X-Achse",
     yAxis: "Y-Achse",
     moveFrame: "Rahmen bewegen",
     resizeFrame: "Rahmen skalieren",
     partsTitle: "Bauteile & Fehler",
     addPart: "Bauteil",
     addDefect: "Fehler",
     duplicatePart: "Duplizieren",
     partName: "Bezeichnung",
     partLength: "X [mm]",
     partWidth: "Y [mm]",
     deletePart: "Bauteil löschen",
     deleteDefect: "Fehler löschen",
     defectMoveHint: "Fehler mit Ziehpunkten an den Ecken skalieren.",
     gridTitle: "Raster & Sägefuge",
     showGrid: "10-cm-Raster anzeigen",
@@ -46,50 +50,53 @@ const TRANSLATIONS = {
     overlapsPart: "überlappt Bauteil",
     undo: "Zurück",
     redo: "Vor",
     zoomIn: "Zoom +",
     zoomOut: "Zoom −",
     zoomFit: "Einpassen",
     zoomReset: "100 %",
     exportPdf: "PDF",
     printPdf: "PDF drucken",
     reportTitle: "Ausbeutebericht",
     partsTableTitle: "Bauteile",
     imageTitle: "Bild",
     name: "Name",
     status: "Status",
     part: "Teil",
     defect: "Fehler",
     xLegend: "X = Brettlänge",
     yLegend: "Y = Brettbreite",
     photo: "Foto",
   },
   en: {
     appTitle: "Wood Yield App",
     subtitle: "Visually plan and document yield",
     language: "Language",
     uploadPhoto: "Upload board photo",
+    mediaLibrary: "Media library",
+    uploadToLibrary: "Add to library",
+    chooseLibraryPhoto: "Choose from media library",
     rotateImage: "Rotate photo 90°",
     perspectiveTitle: "Perspective correction",
     startPerspective: "Select board corners",
     resetPerspective: "Reset",
     perspectiveHint: "Order: top left, top right, bottom right, bottom left.",
     perspectiveRemaining: "Open points:",
     boardTitle: "Calibrate board",
     boardLength: "X [mm]",
     boardWidth: "Y [mm]",
     xAxis: "X axis",
     yAxis: "Y axis",
     moveFrame: "Move frame",
     resizeFrame: "Resize frame",
     partsTitle: "Parts & defects",
     addPart: "Part",
     addDefect: "Defect",
     duplicatePart: "Duplicate",
     partName: "Label",
     partLength: "X [mm]",
     partWidth: "Y [mm]",
     deletePart: "Delete part",
     deleteDefect: "Delete defect",
     defectMoveHint: "Resize defects using the corner handles.",
     gridTitle: "Grid & saw kerf",
     showGrid: "Show 10 cm grid",
@@ -104,50 +111,53 @@ const TRANSLATIONS = {
     overlapsPart: "overlaps part",
     undo: "Undo",
     redo: "Redo",
     zoomIn: "Zoom +",
     zoomOut: "Zoom −",
     zoomFit: "Fit",
     zoomReset: "100 %",
     exportPdf: "PDF",
     printPdf: "Print PDF",
     reportTitle: "Yield report",
     partsTableTitle: "Parts",
     imageTitle: "Image",
     name: "Name",
     status: "Status",
     part: "Part",
     defect: "Defect",
     xLegend: "X = board length",
     yLegend: "Y = board width",
     photo: "Photo",
   },
   fr: {
     appTitle: "Application de rendement bois",
     subtitle: "Planifier et documenter le rendement visuellement",
     language: "Langue",
     uploadPhoto: "Charger la photo de la planche",
+    mediaLibrary: "Médiathèque",
+    uploadToLibrary: "Ajouter à la médiathèque",
+    chooseLibraryPhoto: "Choisir depuis la médiathèque",
     rotateImage: "Pivoter la photo de 90°",
     perspectiveTitle: "Correction de perspective",
     startPerspective: "Choisir les coins",
     resetPerspective: "Réinitialiser",
     perspectiveHint: "Ordre : haut gauche, haut droite, bas droite, bas gauche.",
     perspectiveRemaining: "Points restants :",
     boardTitle: "Calibrer la planche",
     boardLength: "X [mm]",
     boardWidth: "Y [mm]",
     xAxis: "Axe X",
     yAxis: "Axe Y",
     moveFrame: "Déplacer le cadre",
     resizeFrame: "Redimensionner le cadre",
     partsTitle: "Pièces & défauts",
     addPart: "Pièce",
     addDefect: "Défaut",
     duplicatePart: "Dupliquer",
     partName: "Nom",
     partLength: "X [mm]",
     partWidth: "Y [mm]",
     deletePart: "Supprimer la pièce",
     deleteDefect: "Supprimer le défaut",
     defectMoveHint: "Redimensionner les défauts avec les poignées d’angle.",
     gridTitle: "Grille & trait de scie",
     showGrid: "Afficher la grille de 10 cm",
@@ -297,97 +307,131 @@ const rectifyImageFromCorners = (src, points, targetAspectRatio) =>
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
 
+const createLibraryPreview = (label, width, height, baseColor) => {
+  const canvas = document.createElement("canvas");
+  canvas.width = width;
+  canvas.height = height;
+  const ctx = canvas.getContext("2d");
+  if (!ctx) return "";
+  const grad = ctx.createLinearGradient(0, 0, width, height);
+  grad.addColorStop(0, baseColor);
+  grad.addColorStop(1, "#1e293b");
+  ctx.fillStyle = grad;
+  ctx.fillRect(0, 0, width, height);
+  ctx.fillStyle = "rgba(255,255,255,.9)";
+  ctx.font = `700 ${Math.round(width * 0.06)}px Inter, sans-serif`;
+  ctx.fillText(label, Math.round(width * 0.06), Math.round(height * 0.14));
+  return canvas.toDataURL("image/jpeg", 0.88);
+};
+
+const buildInitialLibrary = () =>
+  Array.from({ length: 10 }, (_, index) => {
+    const quality = PHOTO_QUALITIES[index % PHOTO_QUALITIES.length];
+    const width = 1280 - index * 40;
+    const height = 720 - index * 24;
+    return {
+      id: `demo-${index + 1}`,
+      label: `Demo ${index + 1}`,
+      quality,
+      width,
+      height,
+      src: createLibraryPreview(`Demo ${index + 1} · Qualität ${quality}`, width, height, `hsl(${(index * 31) % 360} 55% 42%)`),
+    };
+  });
+
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
         <span className={collapsed ? "chevron rotated" : "chevron"}>⌄</span>
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
   const [language, setLanguage] = useState("de");
   const T = TRANSLATIONS[language];
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
   const [isMobile, setIsMobile] = useState(false);
+  const [libraryPhotos, setLibraryPhotos] = useState(() => buildInitialLibrary());
+  const [showLibrary, setShowLibrary] = useState(false);
 
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
 
   const enrichedParts = useMemo(() => {
     const baseParts = parts.map((p) => {
       const widthPx = p.lengthMm / safeMmPerPxX;
       const heightPx = p.widthMm / safeMmPerPxY;
       const insideBoard = p.x >= 0 && p.y >= 0 && p.x + widthPx <= board.width && p.y + heightPx <= board.height;
       const overlapsDefect = enrichedDefects.some((d) => !(p.x + widthPx <= d.x || p.x >= d.x + d.widthPx || p.y + heightPx <= d.y || p.y >= d.y + d.heightPx));
       return { ...p, widthPx, heightPx, areaMm2: p.lengthMm * p.widthMm, insideBoard, overlapsDefect };
@@ -455,50 +499,58 @@ export default function App() {
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
+  const applyImageSource = (src, width, height) => {
+    setImageSrc(src);
+    setImageSize({ width, height });
+    resetBoardToImage(width, height);
+    resetGeometry();
+    setPerspectivePoints([]);
+    setPerspectiveMode(false);
+  };
 
   const getMousePos = (event) => {
     const rect = svgRef.current?.getBoundingClientRect();
     if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
     return { x: ((event.clientX - rect.left) / rect.width) * imageSize.width, y: ((event.clientY - rect.top) / rect.height) * imageSize.height };
   };
 
   const snapPartPosition = (partId, x, y, widthPx, heightPx) => {
     let snappedX = x;
     let snappedY = y;
     let bestX = SNAP_DISTANCE_PX + 1;
     let bestY = SNAP_DISTANCE_PX + 1;
 
     enrichedParts.forEach((other) => {
       if (other.id === partId) return;
 
       const xCandidates = [
         other.x - widthPx,
         other.x,
         other.x + other.widthPx - widthPx,
         other.x + other.widthPx,
       ];
       const yCandidates = [
         other.y - heightPx,
         other.y,
@@ -515,62 +567,81 @@ export default function App() {
       });
 
       yCandidates.forEach((candidate) => {
         const distance = Math.abs(y - candidate);
         if (distance < bestY && distance <= SNAP_DISTANCE_PX) {
           bestY = distance;
           snappedY = candidate;
         }
       });
     });
 
     return {
       x: clamp(snappedX, 0, Math.max(0, board.width - widthPx)),
       y: clamp(snappedY, 0, Math.max(0, board.height - heightPx)),
     };
   };
 
   const handleImageUpload = (event) => {
     const file = event.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = () => {
       const src = typeof reader.result === "string" ? reader.result : "";
       const img = new Image();
       img.onload = () => {
-        setImageSrc(src);
-        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
-        resetBoardToImage(img.naturalWidth, img.naturalHeight);
-        resetGeometry();
-        setPerspectivePoints([]);
-        setPerspectiveMode(false);
+        applyImageSource(src, img.naturalWidth, img.naturalHeight);
       };
       img.src = src;
     };
     reader.readAsDataURL(file);
   };
 
+  const loadLibraryPhoto = (photo) => {
+    if (!photo?.src) return;
+    applyImageSource(photo.src, photo.width, photo.height);
+    setShowLibrary(false);
+  };
+
+  const addUploadToLibrary = (event) => {
+    const file = event.target.files?.[0];
+    if (!file) return;
+    const reader = new FileReader();
+    reader.onload = () => {
+      const src = typeof reader.result === "string" ? reader.result : "";
+      const img = new Image();
+      img.onload = () => {
+        const quality = PHOTO_QUALITIES[libraryPhotos.length % PHOTO_QUALITIES.length];
+        const id = `user-${Date.now()}`;
+        setLibraryPhotos((prev) => [{ id, label: file.name.replace(/\.[^.]+$/, "") || `User ${prev.length + 1}`, quality, width: img.naturalWidth, height: img.naturalHeight, src }, ...prev]);
+      };
+      img.src = src;
+    };
+    reader.readAsDataURL(file);
+    event.target.value = "";
+  };
+
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
@@ -749,150 +820,182 @@ export default function App() {
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
-        .shell { height: 100dvh; display: grid; grid-template-columns: 340px 1fr; background: #0f172a; color: #e5e7eb; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; overflow: hidden; }
+        .shell { min-height: 100dvh; height: 100dvh; display: grid; grid-template-columns: clamp(280px, 28vw, 360px) 1fr; background: #0f172a; color: #e5e7eb; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; overflow: hidden; }
         .sidebar { background: #172033; border-right: 1px solid #263449; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
         .brand { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
         .brand h1 { font-size: 20px; line-height: 1.1; margin: 0; }
         .brand p { margin: 0; color: #94a3b8; font-size: 13px; }
         .card { border: 1px solid #2d3a50; background: #111827; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.15); }
         .cardHeader { width: 100%; border: 0; background: #111827; color: #f8fafc; padding: 14px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 700; font-size: 14px; }
         .cardBody { padding: 14px; border-top: 1px solid #253145; display: flex; flex-direction: column; gap: 12px; }
         .chevron { transition: transform .2s ease; }
         .rotated { transform: rotate(180deg); }
-        .toolbar { position: sticky; top: 0; z-index: 10; background: rgba(15,23,42,.94); backdrop-filter: blur(8px); border-bottom: 1px solid #263449; padding: 12px; display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
+        .toolbar { position: sticky; top: 0; z-index: 10; background: rgba(15,23,42,.94); backdrop-filter: blur(8px); border-bottom: 1px solid #263449; padding: 12px; display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; }
         .toolbarLeft, .toolbarRight, .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
-        .workspaceColumn { min-width: 0; display: flex; flex-direction: column; height: 100vh; }
+        .toolbarLeft { min-width: 0; }
+        .workspaceColumn { min-width: 0; display: flex; flex-direction: column; height: 100dvh; }
         .workspace { flex: 1; overflow: auto; padding: 24px; background: radial-gradient(circle at center, #182235 0%, #0f172a 70%); position: relative; }
         .canvasWrap { min-width: 100%; min-height: 100%; display: flex; align-items: center; justify-content: center; }
         .surface { background: #dbe4ee; border-radius: 12px; box-shadow: 0 18px 50px rgba(0,0,0,.35); overflow: hidden; }
-        .btn { min-height: 42px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; border-radius: 10px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; cursor: pointer; font-weight: 650; font-size: 13px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
+        .btn { min-height: 42px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; border-radius: 10px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; cursor: pointer; font-weight: 650; font-size: 13px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; white-space: nowrap; }
         .btn:hover:not(:disabled) { background: #273449; }
         .btn:disabled { opacity: .42; cursor: not-allowed; }
         .btn.active { background: #2563eb; border-color: #2563eb; }
         .btn.danger { background: #991b1b; border-color: #991b1b; }
         .input, select { width: 100%; min-height: 42px; border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; padding: 8px 10px; font-size: 16px; }
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
         .axisWidget { position: sticky; left: 24px; bottom: 24px; width: 170px; height: 170px; z-index: 30; pointer-events: none; margin-top: -170px; }
         .axisPanel { position: absolute; left: 0; bottom: 0; width: 165px; height: 150px; border: 1px solid rgba(148,163,184,.35); border-radius: 16px; background: rgba(15,23,42,.82); backdrop-filter: blur(10px); box-shadow: 0 12px 32px rgba(0,0,0,.28); }
         .axisOrigin { position: absolute; left: 34px; bottom: 34px; width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; }
         .axisXLine { position: absolute; left: 38px; bottom: 37px; width: 92px; height: 4px; border-radius: 999px; background: #2563eb; }
         .axisXLine::after { content: ''; position: absolute; right: -9px; top: -6px; border-left: 12px solid #2563eb; border-top: 8px solid transparent; border-bottom: 8px solid transparent; }
         .axisYLine { position: absolute; left: 36px; bottom: 38px; width: 4px; height: 82px; border-radius: 999px; background: #dc2626; }
         .axisYLine::after { content: ''; position: absolute; left: -6px; top: -9px; border-bottom: 12px solid #dc2626; border-left: 8px solid transparent; border-right: 8px solid transparent; }
         .axisXLabel { position: absolute; left: 114px; bottom: 48px; color: #60a5fa; font-weight: 900; font-size: 14px; }
         .axisYLabel { position: absolute; left: 50px; top: 24px; color: #f87171; font-weight: 900; font-size: 14px; }
         .axisLegend { position: absolute; left: 16px; bottom: 8px; color: #cbd5e1; font-size: 11px; line-height: 1.35; }
+        @media (max-width: 1100px) {
+          .shell { grid-template-columns: minmax(290px, 36vw) 1fr; }
+          .toolbar { grid-template-columns: 1fr 1fr; }
+          .toolbarRight { justify-content: flex-end; }
+        }
+        @media (max-width: 900px) {
+          .shell { grid-template-columns: 1fr; grid-template-rows: minmax(220px, 36dvh) 1fr; }
+          .sidebar { border-right: 0; border-bottom: 1px solid #263449; padding: 12px; gap: 10px; }
+          .workspaceColumn { height: auto; min-height: 0; }
+          .toolbar { grid-template-columns: 1fr 1fr; }
+          .workspace { padding: 16px; }
+          .axisWidget { transform: scale(.84); transform-origin: left bottom; }
+        }
         @media (max-width: 760px) {
           .shell { grid-template-columns: 1fr; grid-template-rows: minmax(210px, 34dvh) 1fr; height: 100dvh; overflow: hidden; }
           .sidebar { height: auto; min-height: 0; border-right: 0; border-bottom: 1px solid #263449; padding: 10px; gap: 8px; overflow: auto; -webkit-overflow-scrolling: touch; }
           .brand { margin-bottom: 2px; }
           .brand h1 { font-size: 22px; }
           .brand p { font-size: 12px; }
           .card { border-radius: 14px; }
           .cardHeader { min-height: 48px; padding: 12px 14px; font-size: 15px; }
           .cardBody { padding: 12px; gap: 10px; }
           .row, .toolbarLeft, .toolbarRight { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; gap: 8px; }
           .grid2 { grid-template-columns: 1fr 1fr; }
           .btn { min-height: 46px; width: 100%; padding: 0 10px; font-size: 13px; border-radius: 12px; }
-          .btn { white-space: nowrap; }
           .workspaceColumn { height: auto; min-height: 0; position: relative; }
           .toolbar { position: fixed; left: 0; right: 0; bottom: 0; top: auto; z-index: 80; padding: 8px 10px calc(8px + env(safe-area-inset-bottom)); background: rgba(15,23,42,.98); border-top: 1px solid #334155; border-bottom: 0; display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 40dvh; overflow: auto; -webkit-overflow-scrolling: touch; }
           .toolbar .muted { align-self: center; justify-self: center; font-size: 13px; }
           .workspace { height: 100%; padding: 10px 10px 176px; overflow: auto; -webkit-overflow-scrolling: touch; }
           .canvasWrap { align-items: flex-start; justify-content: flex-start; min-width: max-content; min-height: max-content; }
           .surface { border-radius: 14px; }
           .axisWidget { width: 118px; height: 118px; margin-top: -118px; left: 10px; bottom: 176px; transform: scale(.72); transform-origin: left bottom; }
           .axisPanel { width: 165px; height: 150px; }
           .hint, .muted { font-size: 12px; }
         }
         @media (max-width: 420px) {
           .shell { grid-template-rows: minmax(190px, 31dvh) 1fr; }
           .brand h1 { font-size: 20px; }
           .brand p { display: none; }
+          .grid2 { grid-template-columns: 1fr; }
+          .row, .toolbarLeft, .toolbarRight { grid-template-columns: 1fr; }
           .toolbar { max-height: 38dvh; }
           .workspace { padding-bottom: 164px; }
           .axisWidget { bottom: 164px; }
         }
       `}</style>
 
       <aside className="sidebar">
         <div className="brand">
           <h1>{T.appTitle}</h1>
           <p>{T.subtitle}</p>
         </div>
 
         <CardBox title={T.photo} collapsed={collapsed.setup} onToggle={() => toggle("setup")}>
           <div className="field">
             <label>{T.language}</label>
             <select value={language} onChange={(e) => setLanguage(e.target.value)}>
               <option value="de">Deutsch</option>
               <option value="en">English</option>
               <option value="fr">Français</option>
             </select>
           </div>
           <div className="field">
             <label>{T.uploadPhoto}</label>
             <input className="inputFile" type="file" accept="image/*" onChange={handleImageUpload} />
           </div>
           <div className="row">
             <IconButton onClick={handleRotateImage} disabled={!imageSrc}>↻ {T.rotateImage}</IconButton>
+            <IconButton active={showLibrary} onClick={() => setShowLibrary((prev) => !prev)}>{T.mediaLibrary}</IconButton>
+          </div>
+          <div className="field">
+            <label>{T.uploadToLibrary}</label>
+            <input className="inputFile" type="file" accept="image/*" onChange={addUploadToLibrary} />
           </div>
+          {showLibrary && (
+            <div className="panel">
+              <div className="muted">{T.chooseLibraryPhoto}</div>
+              <div className="summary">
+                {libraryPhotos.map((photo) => (
+                  <button type="button" className="btn" key={photo.id} onClick={() => loadLibraryPhoto(photo)}>
+                    {photo.label} · {photo.quality} · {photo.width}×{photo.height}
+                  </button>
+                ))}
+              </div>
+            </div>
+          )}
         </CardBox>
 
         <CardBox title={T.perspectiveTitle} collapsed={collapsed.perspective} onToggle={() => toggle("perspective")}>
           <div className="row">
             <IconButton active={perspectiveMode} onClick={() => { setPerspectiveMode(true); setPerspectivePoints([]); }} disabled={!imageSrc}>⌞ {T.startPerspective}</IconButton>
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
             <IconButton active={boardMode === "move"} onClick={() => setBoardMode("move")}>↔ {T.moveFrame}</IconButton>
             <IconButton active={boardMode === "resize"} onClick={() => setBoardMode("resize")}>□ {T.resizeFrame}</IconButton>
           </div>
           <div className="muted">1 px = {safeMmPerPxX.toFixed(2)} mm X / {safeMmPerPxY.toFixed(2)} mm Y</div>
         </CardBox>
 
         <CardBox title={T.partsTitle} collapsed={collapsed.parts} onToggle={() => toggle("parts")}>
           <div className="row">
