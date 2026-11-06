# pixel-editor web rewrite

Moving pixel-editor from Electron + pixi.js 5 to a web-only TypeScript app with no pixi.

## Decisions (2026-11-02)

- **Web only.** Electron, `remote`, IPC and the preload all go away.
- **TypeScript from the start.** New code lives in `src/`. The old `code/` folder stays as a reference until every pane is ported, then it's deleted.
- **No pixi.** Frames are `Uint8ClampedArray` pixels, drawn with Canvas 2D. Panes are DOM and canvas.
- **Floating panes stay** (simple-window-manager).
- **File format v2, with a migration.** Old v1 files (`imageData: [[w, h, base64png]]`) still load and are saved as v2.
- **Build:** Vite, with Vitest for tests.

## File format

v1, the old format, still readable:

```json
{ "name": "sample", "imageData": [[15, 15, "<base64 png>"]], "animations": { "idle": [[0, 0]] } }
```

v2, the format written from now on:

```json
{ "version": 2, "name": "sample", "frames": [{ "width": 15, "height": 15, "png": "<base64 png>" }], "animations": { "idle": [[0, 0]] } }
```

The `.editor.json` sidecar is replaced. Editor state (zoom, current frame, viewport) is stored in IndexedDB next to the sprite. Undo history lives in memory only, capped per frame.

## Storage

- **IndexedDB** (via idb-keyval) holds the app state and the sprite library, and autosaves.
- **Open and Save to disk** use the File System Access API where the browser has it, and file upload/download elsewhere.
- **Export PNG** uses `canvas.toBlob`.

## Status (2026-11-02)

Steps 1–7 are done. The app runs (`npm run dev`), 29 unit tests pass, and the production build is 147 KB of JS (46 KB gzipped). Checked in the browser:
- **Editing:** painting, circle, duplicate, rotate, erase and undo.
- **Persistence:** reloading restores the sprite and layout, and sprites from the old web build's localforage database import automatically.
- **Panes:** the sprite library, the animation editor and the menus all work.
- **Export:** produces correct PNGs.

Not yet done:
- Real-hardware checks: trackpad pinch and pan, touch input, and Safari/Firefox (they have no File System Access API, so they fall back to upload/download).

Behaviour changes from the old app:
- A negative cursor box now includes the cursor's own column/row. Shift+arrow skips sizes 0 and -1.
- Left-drag pans the view, and a click without dragging moves the cursor (the old click-to-cursor code was never wired up).
- Frames can be reordered by dragging in the Frames pane.
- Undo history is kept in memory only.
- Right-click a sprite in the Sprites pane to delete it.

## Steps

1. Scaffold: Vite, TypeScript, Vitest, `src/`.
2. Model: `Frame`, `Sprite`, the format v1/v2 loader, transforms, undo, and the animation interpreter, all with tests.
3. Storage: the IndexedDB library, app state, and open/save/export.
4. Draw pane: Canvas 2D with its own viewport (pan and zoom), a checkerboard pattern, a grid, a tool overlay, and keyboard plus pointer input.
5. Tools: paint, line, circle, ellipse, fill, select, crop.
6. Panes: toolbar, palette, picker, info, frames, animation, position, manager, keyboard, export.
7. Delete `code/`, `html/`, `docs/` and Electron assets; deploy `dist/` to GitHub Pages from a GitHub Action (`.github/workflows/deploy.yml`).

## Bugs fixed along the way

- Setting `height` set `.height` on an array instead of `[1]`, so it never resized.
- Every `create()` stacked another autosave `setInterval`.
- `indexOf('.editor.')` was truthy for -1.
- Every pixel edit re-encoded the whole frame as PNG, so flip and rotate were O(n²) PNG encodes.
- The checkerboard created one sprite per pixel on every redraw.
