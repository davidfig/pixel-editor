# Pixel Editor

A pixel-art editor and animator that runs in the browser.

## Live Demo

[Web demo](https://davidfig.github.io/pixel-editor/)

## Development

```bash
npm install
npm run dev        # dev server
npm test           # unit tests
npm run build      # type-check and build to dist/
```

## Using it on your computer

- **Install it:** in Chrome or Edge, use the install button in the address bar (or **⋮ → Cast, save and share → Install page as app**). It gets its own window and Dock icon, and works offline.
- **Edit files in place:** **File → Open File…** (⌘O) opens a sprite from disk, and **File → Save File** (⌘S) writes it back to the same file. **File → Save File As…** (⇧⌘S) saves a copy somewhere else. The editor remembers each sprite's file, even after a restart; the browser may ask once per session for permission to write to it. The Sprites pane can open a whole folder the same way.
- **Safari and Firefox** can't write to files on disk, so Save downloads the file instead.

Sprites are also saved in the browser (IndexedDB) as you work, and **File → Export PNG…** (⌘E) exports frames.

The sprite file format and the 2026 rewrite (TypeScript, no pixi.js, web only) are described in [PLAN.md](PLAN.md).

## License

MIT License
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
