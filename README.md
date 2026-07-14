# Pollmeier Holzausbeute

Web-App zum visuellen Planen und Dokumentieren der Holzausbeute: Brettfoto laden,
Brett kalibrieren, Bauteile und Fehlerstellen platzieren, Ausbeute berechnen und
als Bericht exportieren. Gestaltet im Pollmeier-Corporate-Design (Rot `#e2001a`,
Schwarz `#1d1d1b`).

## Start

```bash
npm install
npm run dev        # Entwicklung (http://localhost:5173)
npm run build      # Produktions-Build nach dist/
```

> Hinweis: Liegt das Projekt in einem Pfad mit `&` (z. B. „GmbH & Co. KG“),
> schlägt `npm run dev` unter Windows fehl. Stattdessen:
> `node node_modules/vite/bin/vite.js`

## Funktionen

- **Foto-Workflow**: Upload (Button oder Drag & Drop), Mediathek mit Demo-Brettern,
  90°-Drehung, Perspektivkorrektur über vier Eckpunkte (Homographie).
- **Kalibrierung**: Brettrahmen direkt im Bild ziehen — Kanten verschieben,
  acht Griffe skalieren; reale Maße in mm.
- **Bauteile & Fehler**: direkt ziehen, über Eckgriffe skalieren, Kantenfang
  (Snapping) an Brett und Nachbarteilen, Duplizieren, Liste mit Statusanzeige
  (gültig / außerhalb / überlappt Fehler / überlappt Bauteil).
- **Ergebnis**: Ausbeute in %, Flächen, Teilezähler; PDF-Bericht im
  Pollmeier-Layout und CSV-Export (Excel-kompatibel).
- **Bedienung**: Undo/Redo (`Strg+Z`/`Strg+Y`), Entf löscht, Pfeiltasten
  verschieben mm-genau, `F` passt ein, `Strg+Mausrad` und Pinch zoomen,
  leere Fläche ziehen schwenkt die Ansicht.
- **Robustheit**: Autosave in `localStorage` (inkl. Foto, mit Quota-Fallback),
  Wiederherstellung beim Start, Bild-Downscaling großer Fotos,
  dreisprachig (DE/EN/FR).
- **Responsiv**: Desktop mit Sidebar, unter 860 px Tab-Navigation mit Bottom-Sheet.

## Struktur

| Datei | Inhalt |
| --- | --- |
| `src/App.jsx` | Hauptkomponente: Canvas, Interaktionen, Zustand |
| `src/i18n.js` | Übersetzungen (de/en/fr) |
| `src/geometry.js` | Homographie, Rektifizierung, Bild-Utilities |
| `src/report.js` | PDF-Bericht und CSV-Export |
| `src/components/ui.jsx` | Button, Card, NumberField, Modal, Toasts |
| `src/components/Logo.jsx` | Pollmeier-Logo (SVG) und Markenfarben |
| `src/styles.css` | Designsystem (CSS-Variablen, Layout, Responsive) |
