# Lanelet2 Map Editor

An interactive web-based editor for creating and editing Lanelet2 maps with 3D visualization.

## Features

- **Interactive 3D Map Canvas** - Visualize and edit maps in 3D space with pan/rotate/zoom
- **Point Cloud Support** - Load and display PCD files as background reference
- **Ground Extraction** - Extract ground plane from point cloud data
- **Lanelet2 Format** - Full support for Lanelet2 primitives (points, linestrings, lanelets)
- **OSM Import/Export** - Import existing OSM maps and export your work

## Tech Stack

- React 18 + TypeScript
- Three.js + React Three Fiber (3D rendering)
- Zustand (state management)
- Tailwind CSS (styling)
- Vite (build tool)
- Playwright (E2E testing)

## Getting Started

```bash
cd lanelet2-map-editor
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| P | Point tool |
| L | Linestring tool |
| A | Lanelet tool |
| H | Pan tool |
| 2 | 2D view |
| 3 | 3D view |
| Escape | Cancel current operation |
| Delete | Delete selected element |

## Development

```bash
# Type check
npx tsc --noEmit

# Run tests
npx playwright test
```
