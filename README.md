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

Sprites are saved in the browser (IndexedDB) as you work. Use **File → Open File…** and **File → Save File As…** to move sprite files on and off disk, and **File → Export PNG…** to export frames.

The sprite file format and the 2026 rewrite (TypeScript, no pixi.js, web only) are described in [PLAN.md](PLAN.md).

## License

MIT License
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
