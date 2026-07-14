/* ============================================================
   Pollmeier Holzausbeute – Design System
   Brand: Rot #e2001a · Schwarz #1d1d1b · helles Industrie-Theme
   ============================================================ */

:root {
  --pm-red: #e2001a;
  --pm-red-dark: #b30015;
  --pm-red-soft: #fdeaec;
  --pm-black: #1d1d1b;

  --ink: #1d1d1b;
  --ink-soft: #55554f;
  --ink-faint: #8a8a84;

  --bg: #f2f1ee;
  --surface: #ffffff;
  --surface-sunken: #f7f6f4;
  --border: #e2e1db;
  --border-strong: #c9c8c1;

  --green: #15803d;
  --green-soft: #e8f4ec;
  --amber: #b45309;
  --amber-soft: #fbf1e2;

  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 1px 3px rgba(29, 29, 27, 0.07), 0 4px 14px rgba(29, 29, 27, 0.05);
  --shadow-lg: 0 8px 32px rgba(29, 29, 27, 0.18);

  --header-h: 58px;
  --tabbar-h: 60px;

  font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  color: var(--ink);
  line-height: 1.45;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  overscroll-behavior: none;
}

button,
input,
select {
  font: inherit;
}

/* ---------- app frame ---------- */

.app {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---------- header ---------- */

.header {
  height: var(--header-h);
  flex: 0 0 auto;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  border-top: 3px solid var(--pm-red);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.header-divider {
  width: 1px;
  height: 26px;
  background: var(--border-strong);
}

.header-title h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.header-title p {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-faint);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-select {
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  padding: 4px 8px;
  cursor: pointer;
}

.lang-select:hover {
  border-color: var(--border-strong);
}

/* ---------- body layout ---------- */

.body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 372px minmax(0, 1fr);
}

.app.is-mobile .body {
  grid-template-columns: minmax(0, 1fr);
}

.sidebar {
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg);
  border-right: 1px solid var(--border);
}

.main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ---------- cards ---------- */

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  flex: 0 0 auto;
}

.card-header {
  width: 100%;
  border: 0;
  background: var(--surface);
  color: var(--ink);
  padding: 13px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 700;
  font-size: 13.5px;
  text-align: left;
}

.card-header:hover {
  background: var(--surface-sunken);
}

.card-title {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.card-title svg {
  color: var(--pm-red);
  flex: 0 0 auto;
}

.card-badge {
  background: var(--pm-black);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.chevron {
  color: var(--ink-faint);
  transition: transform 0.18s ease;
  transform: rotate(-90deg);
}

.chevron.open {
  transform: rotate(0deg);
}

.card-body {
  padding: 14px;
  border-top: 1px solid var(--border);
}

/* ---------- form primitives ---------- */

.stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.field label,
label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
}

.input {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  padding: 8px 10px;
  font-size: 14px;
}

.input:focus-visible {
  outline: 2px solid var(--pm-red);
  outline-offset: -1px;
  border-color: var(--pm-red);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
}

.checkbox-row input {
  width: 17px;
  height: 17px;
  accent-color: var(--pm-red);
  cursor: pointer;
}

.muted {
  margin: 0;
  color: var(--ink-faint);
  font-size: 12px;
  line-height: 1.5;
}

.scale-info {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
  font-size: 12.5px;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-sunken);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ---------- buttons ---------- */

.btn {
  min-height: 40px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.btn:hover:not(:disabled) {
  background: var(--surface-sunken);
  border-color: var(--border-strong);
}

.btn:focus-visible {
  outline: 2px solid var(--pm-red);
  outline-offset: 1px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.is-active {
  background: var(--pm-black);
  border-color: var(--pm-black);
  color: #fff;
}

.btn-primary {
  background: var(--pm-red);
  border-color: var(--pm-red);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--pm-red-dark);
  border-color: var(--pm-red-dark);
}

.btn-danger {
  color: var(--pm-red);
  border-color: var(--pm-red-soft);
  background: var(--pm-red-soft);
}

.btn-danger:hover:not(:disabled) {
  background: #fbd9dd;
  border-color: #f4b8bf;
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--surface-sunken);
  border-color: transparent;
}

.btn-ghost.btn-danger {
  background: transparent;
}

.btn-icon {
  width: 40px;
  padding: 0;
  flex: 0 0 auto;
}

/* ---------- toolbar ---------- */

.toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-value {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-sm);
  min-height: 34px;
  min-width: 60px;
  padding: 0 8px;
  font-size: 12.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
  cursor: pointer;
}

.zoom-value:hover {
  background: var(--surface-sunken);
}

/* ---------- canvas ---------- */

.canvas-area {
  position: relative;
  flex: 1;
  min-height: 0;
  background: repeating-conic-gradient(var(--bg) 0% 25%, #ecebe7 0% 50%) 0 0 / 26px 26px;
}

.canvas-area.is-dragover::after {
  content: "";
  position: absolute;
  inset: 8px;
  border: 3px dashed var(--pm-red);
  border-radius: var(--radius);
  background: rgba(226, 0, 26, 0.05);
  pointer-events: none;
  z-index: 40;
}

.workspace {
  position: absolute;
  inset: 0;
  overflow: auto;
  touch-action: pan-x pan-y;
}

.canvas-wrap {
  min-width: 100%;
  min-height: 100%;
  display: flex;
  padding: 24px;
}

.surface {
  margin: auto;
  background: var(--surface);
  border-radius: 4px;
  box-shadow: var(--shadow-lg);
  flex: 0 0 auto;
}

.board-svg {
  display: block;
  touch-action: none;
  cursor: grab;
}

.board-svg.is-perspective {
  cursor: crosshair;
}

/* ---------- overlays ---------- */

.axis-widget {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 20;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 8px 12px 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.axis-legend {
  font-size: 10.5px;
  color: var(--ink-soft);
  line-height: 1.5;
}

.perspective-banner {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--pm-black);
  color: #fff;
  border-radius: 999px;
  padding: 7px 10px 7px 16px;
  box-shadow: var(--shadow-lg);
  font-size: 13px;
  font-weight: 600;
  max-width: calc(100% - 24px);
  flex-wrap: wrap;
}

.perspective-banner svg {
  color: var(--pm-red);
  flex: 0 0 auto;
}

.perspective-banner .btn {
  color: #fff;
  min-height: 32px;
  font-size: 12.5px;
}

.perspective-banner .btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
}

/* ---------- empty state ---------- */

.dropzone {
  position: absolute;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg);
}

.dropzone-inner {
  max-width: 460px;
  width: 100%;
  text-align: center;
  background: var(--surface);
  border: 2px dashed var(--border-strong);
  border-radius: 18px;
  padding: 40px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dropzone-inner svg {
  color: var(--pm-red);
}

.dropzone-inner h2 {
  margin: 6px 0 0;
  font-size: 19px;
}

.dropzone-inner p {
  margin: 0 0 12px;
  color: var(--ink-soft);
  font-size: 13.5px;
}

.dropzone-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

/* ---------- statusbar ---------- */

.statusbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 6px 14px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
  overflow-x: auto;
  white-space: nowrap;
}

.statusbar-yield {
  margin-left: auto;
  color: var(--pm-red);
  font-weight: 700;
}

/* ---------- parts list ---------- */

.parts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.part-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  cursor: pointer;
  text-align: left;
  font-size: 12.5px;
  color: var(--ink);
}

.part-row:hover {
  border-color: var(--border-strong);
  background: var(--surface-sunken);
}

.part-row.is-selected {
  border-color: var(--pm-black);
  box-shadow: 0 0 0 1px var(--pm-black);
}

.part-row-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.part-row-dims {
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.part-row-status {
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 8px;
}

.part-row-status.ok {
  background: var(--green-soft);
  color: var(--green);
}

.part-row-status.bad {
  background: var(--amber-soft);
  color: var(--amber);
}

.part-row-status.defect-label {
  background: var(--pm-red-soft);
  color: var(--pm-red);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.dot-ok {
  background: var(--green);
}

.dot-bad {
  background: var(--amber);
}

.dot-defect {
  background: var(--pm-red);
}

/* ---------- result ---------- */

.yield-hero {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-sunken);
  padding: 16px;
  text-align: center;
}

.yield-value {
  font-size: 34px;
  font-weight: 800;
  color: var(--pm-red);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.yield-label {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ink-faint);
  margin: 2px 0 10px;
}

.yield-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.yield-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--pm-red-dark), var(--pm-red));
  transition: width 0.25s ease;
}

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.kpi {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 9px 11px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-faint);
}

.kpi-value {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.kpi-value small {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-faint);
}

/* ---------- mobile tab bar & sheet ---------- */

.tabbar {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 60;
}

.tabbar-item {
  position: relative;
  border: 0;
  background: transparent;
  min-height: var(--tabbar-h);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ink-faint);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tabbar-item svg {
  width: 20px;
  height: 20px;
}

.tabbar-item.is-active {
  color: var(--pm-red);
}

.tabbar-item.is-active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 3px;
  border-radius: 0 0 3px 3px;
  background: var(--pm-red);
}

.tabbar-badge {
  position: absolute;
  top: 7px;
  right: calc(50% - 22px);
  background: var(--pm-black);
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  border-radius: 999px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.tab-sheet {
  flex: 0 0 auto;
  background: var(--surface);
  border-top: 1px solid var(--border);
  box-shadow: 0 -8px 24px rgba(29, 29, 27, 0.1);
  max-height: 46dvh;
  display: flex;
  flex-direction: column;
  z-index: 55;
}

.tab-sheet-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 8px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.tab-sheet-body {
  overflow-y: auto;
  padding: 14px 16px;
  -webkit-overflow-scrolling: touch;
}

/* ---------- modal ---------- */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(29, 29, 27, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  background: var(--surface);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  width: min(860px, 100%);
  max-height: min(84dvh, 720px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 12px 14px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-head h2 {
  margin: 0;
  font-size: 16px;
}

.modal-body {
  overflow-y: auto;
  padding: 16px 20px 20px;
}

/* ---------- media library ---------- */

.library-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.library-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
  display: flex;
  flex-direction: column;
}

.library-card img {
  width: 100%;
  aspect-ratio: 16 / 7;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.library-meta {
  padding: 8px 10px 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 12px;
}

.library-meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-meta span {
  color: var(--ink-faint);
  font-size: 11px;
}

.library-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 10px 10px;
}

.library-actions .btn {
  min-height: 34px;
  font-size: 12px;
}

/* ---------- help ---------- */

.shortcut-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.shortcut-table td {
  padding: 7px 6px;
  border-bottom: 1px solid var(--border);
}

.shortcut-table td:first-child {
  white-space: nowrap;
  width: 45%;
}

kbd {
  display: inline-block;
  border: 1px solid var(--border-strong);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--surface-sunken);
  padding: 1px 7px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
}

.help-subhead {
  margin: 18px 0 6px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
}

/* ---------- toasts ---------- */

.toasts {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  width: max-content;
  max-width: calc(100vw - 32px);
}

.app.is-mobile ~ .toasts,
.is-mobile .toasts {
  bottom: calc(var(--tabbar-h) + 16px + env(safe-area-inset-bottom));
}

.toast {
  background: var(--pm-black);
  color: #fff;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  animation: toast-in 0.22s ease;
  max-width: 100%;
}

.toast-error {
  background: var(--pm-red);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- small screens ---------- */

@media (max-width: 860px) {
  .header {
    padding: 0 10px;
    gap: 8px;
  }

  .header-brand {
    gap: 10px;
  }

  .header-title h1 {
    font-size: 14px;
  }

  .toolbar {
    padding: 6px 8px;
    overflow-x: auto;
  }

  .canvas-wrap {
    padding: 14px;
  }

  .axis-widget {
    left: 10px;
    bottom: 10px;
    padding: 6px 9px 4px;
    gap: 7px;
  }

  .axis-widget svg {
    width: 64px;
    height: 50px;
  }

  .dropzone-inner {
    padding: 28px 18px;
  }

  .modal {
    max-height: 90dvh;
  }

  .modal-body {
    padding: 12px 14px 16px;
  }

  .library-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 380px) {
  .header-title h1 {
    font-size: 13px;
  }

  .btn-grid {
    grid-template-columns: 1fr;
  }
}
