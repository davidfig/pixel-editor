import { EventEmitter } from 'eventemitter3'

import { DrawPane } from './draw/draw-pane'
import { matches } from './keys'
import type { Hex } from './model/color'
import { TRANSPARENT } from './model/color'
import { Sprite } from './model/sprite'
import { State, type Tool as ToolName } from './state'
import { openSpriteFile, saveSpriteFile } from './storage/disk'
import * as library from './storage/library'
import { type Tool, type ToolContext, createTools } from './tools/tools'
import { box } from './tools/shapes'

const AUTOSAVE_MS = 500

interface Clipboard {
    width: number
    height: number
    data: Hex[]
}

interface AppEvents {
    /** A different sprite is being edited (new, open, load). */
    sprite: []
    zoom: []
}

export const DEFAULT_ZOOM = 4

/** Owns the state, the sprite being edited, the draw pane and the commands bound to keys and menus. */
export class App extends EventEmitter<AppEvents> {
    readonly state: State
    readonly draw: DrawPane
    sprite: Sprite
    spriteId: string
    private _zoom = DEFAULT_ZOOM
    /** Commands by key-binding name (see data/default-keys.json). Panes add their own. */
    readonly commands: Record<string, () => void> = {}

    private toolContext: ToolContext
    private tools: Record<ToolName, Tool>
    private clipboard: Clipboard | null = null
    private editorDirty = false
    /** The file on disk the current sprite was opened from or saved to, if the browser can write to it. */
    private fileHandle: FileSystemFileHandle | null = null

    private constructor(state: State, sprite: Sprite, spriteId: string, editor: library.EditorState | undefined) {
        super()
        this.state = state
        this.sprite = sprite
        this.spriteId = spriteId
        this.toolContext = { sprite, state }
        this.tools = createTools(this.toolContext)
        this.draw = new DrawPane(document.body, sprite, state, () => this.tool)
        this.draw.setSprite(sprite, editor)
        this.draw.onViewportChange = () => (this.editorDirty = true)
        sprite.current = editor?.current ?? 0
        this._zoom = editor?.zoom ?? DEFAULT_ZOOM
        sprite.on('current', () => (this.editorDirty = true))
        state.on('tool', () => {
            this.tool.activate()
            this.draw.redraw()
        })
        this.registerCommands()
        window.addEventListener('keydown', (e) => this.keydown(e))
        window.addEventListener('keyup', (e) => {
            if (matches(e, this.state.get('keys').Draw ?? 'space')) {
                this.tool.spaceUp()
            }
        })
        setInterval(() => this.autosave(), AUTOSAVE_MS)
        window.addEventListener('pagehide', () => this.autosave())
    }

    static async create(): Promise<App> {
        const imported = await library.importLegacy()
        if (imported) {
            console.info(`Imported ${imported} sprite(s) from the previous version`)
        }
        const state = new State(await library.loadState())
        const id = state.get('spriteId')
        const loaded = id ? await library.loadSprite(id) : null
        if (loaded && id) {
            const app = new App(state, new Sprite(loaded.sprite), id, loaded.editor)
            app.fileHandle = await library.loadHandle(id)
            return app
        }
        const app = new App(state, new Sprite({ name: await uniqueName('pixel'), frames: [], animations: { idle: [[0, 0]] } }), library.newId(), undefined)
        state.open(app.spriteId)
        app.sprite.dirty = true
        return app
    }

    /** Thumbnail scale for the frames, animation and export panes. */
    get zoom(): number {
        return this._zoom
    }
    set zoom(value: number) {
        value = Math.max(1, Math.min(64, Math.round(value)))
        if (value !== this._zoom) {
            this._zoom = value
            this.editorDirty = true
            this.emit('zoom')
        }
    }

    get tool(): Tool {
        return this.tools[this.state.get('tool')]
    }

    /** Replace the sprite being edited. */
    setSprite(sprite: Sprite, id: string, editor?: library.EditorState): void {
        this.autosave()
        this.sprite.removeAllListeners()
        this.sprite = sprite
        this.spriteId = id
        this.toolContext.sprite = sprite
        sprite.current = editor?.current ?? 0
        this._zoom = editor?.zoom ?? DEFAULT_ZOOM
        sprite.on('current', () => (this.editorDirty = true))
        this.draw.setSprite(sprite, editor)
        this.state.open(id)
        const s = this.state
        if (s.get('cursorX') >= sprite.width || s.get('cursorY') >= sprite.height) {
            s.setCursor(0, 0, 1, 1)
        }
        this.tool.activate()
        this.emit('sprite')
    }

    async newFile(): Promise<void> {
        const sprite = new Sprite({ name: await uniqueName('pixel'), frames: [], animations: { idle: [[0, 0]] } })
        sprite.dirty = true
        this.setSprite(sprite, library.newId())
        this.fileHandle = null
        this.state.setCursor(0, 0, 1, 1)
    }

    /** Open a sprite from the library. */
    async load(id: string): Promise<void> {
        if (id === this.spriteId) {
            return
        }
        const loaded = await library.loadSprite(id)
        if (!loaded) {
            this.state.forget(id)
            return
        }
        const handle = await library.loadHandle(id)
        this.setSprite(new Sprite(loaded.sprite), id, loaded.editor)
        this.fileHandle = handle
    }

    /** Import a sprite file from disk into the library and open it, remembering the file so Save writes back to it. */
    async openFile(): Promise<void> {
        try {
            const opened = await openSpriteFile()
            if (opened) {
                const sprite = new Sprite(opened.sprite)
                sprite.dirty = true
                const id = library.newId()
                this.setSprite(sprite, id)
                this.fileHandle = opened.handle ?? null
                if (opened.handle) {
                    await library.saveHandle(id, opened.handle)
                }
            }
        } catch (e) {
            alert(`Couldn't open that file: ${(e as Error).message}`)
        }
    }

    /** Save to the file the sprite came from, or ask where to save it (always, with saveAs). */
    async saveFile(saveAs = false): Promise<void> {
        const id = this.spriteId
        const result = await saveSpriteFile(this.sprite, this.fileHandle, saveAs)
        if (result.handle && id === this.spriteId) {
            this.fileHandle = result.handle
            await library.saveHandle(id, result.handle)
        }
    }

    /**
     * Starts every save before returning, without awaiting between them: setSprite() and pagehide
     * don't wait for this, so an await here would save the next sprite instead of this one.
     */
    private autosave(): Promise<unknown> {
        const saves: Promise<void>[] = []
        if (this.sprite.dirty || this.editorDirty) {
            this.sprite.dirty = false
            this.editorDirty = false
            saves.push(library.saveSprite(this.spriteId, this.sprite, { current: this.sprite.current, zoom: this._zoom, viewport: this.draw.savedViewport }))
        }
        if (this.state.dirty) {
            this.state.dirty = false
            saves.push(library.saveState(this.state.toJSON()))
        }
        return Promise.all(saves)
    }

    // --- editing commands ---

    selectAll(): void {
        this.state.set('tool', 'select')
        this.state.setCursor(0, 0, this.sprite.width, this.sprite.height)
    }

    copy(cut = false): void {
        const s = this.state
        const b = box(s.get('cursorX'), s.get('cursorY'), s.get('cursorSizeX'), s.get('cursorSizeY'))
        const data: Hex[] = []
        if (cut) {
            this.sprite.checkpoint()
        }
        for (let y = b.y; y < b.y + b.height; y++) {
            for (let x = b.x; x < b.x + b.width; x++) {
                data.push(this.sprite.get(x, y))
                if (cut) {
                    this.sprite.frame.set(x, y, TRANSPARENT)
                }
            }
        }
        this.clipboard = { width: b.width, height: b.height, data }
        if (cut) {
            this.sprite.changed()
        }
    }

    paste(): void {
        const clip = this.clipboard
        if (!clip) {
            return
        }
        const x0 = this.state.get('cursorX')
        const y0 = this.state.get('cursorY')
        this.sprite.checkpoint()
        let i = 0
        for (let y = 0; y < clip.height; y++) {
            for (let x = 0; x < clip.width; x++) {
                this.sprite.frame.set(x0 + x, y0 + y, clip.data[i++])
            }
        }
        this.sprite.changed()
    }

    private registerCommands(): void {
        const s = this.state
        const tool = (name: ToolName) => () => s.set('tool', name)
        Object.assign(this.commands, {
            New: () => this.newFile(),
            Open: () => this.openFile(),
            Save: () => this.saveFile(),
            SaveAs: () => this.saveFile(true),
            Undo: () => this.sprite.undo(),
            Redo: () => this.sprite.redo(),
            Copy: () => this.copy(),
            Cut: () => this.copy(true),
            Paste: () => this.paste(),
            SelectAll: () => this.selectAll(),
            Draw: () => this.tool.space(),
            Dropper: () => s.set('foreground', this.sprite.get(s.get('cursorX'), s.get('cursorY'))),
            Clear: () => this.tool.clear(),
            Erase: () => this.tool.erase(),
            SwapForeground: () => s.set('isForeground', !s.get('isForeground')),
            SelectTool: tool('select'),
            PaintTool: tool('paint'),
            FillTool: tool('fill'),
            CircleTool: tool('circle'),
            EllipseTool: tool('ellipse'),
            LineTool: tool('line'),
            CropTool: tool('crop'),
            NewFrame: () => this.sprite.addFrame(),
            AddFrame: () => this.sprite.addFrame(),
            Duplicate: () => this.sprite.duplicateFrame(),
            Delete: () => this.sprite.removeFrame(),
            DeleteFrame: () => this.sprite.removeFrame(),
            NextFrame: () => this.sprite.nextFrame(),
            PreviousFrame: () => this.sprite.previousFrame(),
            Clockwise: () => this.sprite.rotate(),
            CounterClockwise: () => this.sprite.rotate(true),
            FlipHorizontal: () => this.sprite.flipHorizontal(),
            FlipVertical: () => this.sprite.flipVertical(),
        })
    }

    private keydown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement | null
        if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
            return
        }
        const keys = this.state.get('keys')
        for (const name in keys) {
            if (keys[name] && this.commands[name] && matches(e, keys[name])) {
                e.preventDefault()
                if (name === 'Draw' && e.repeat) {
                    return
                }
                this.commands[name]()
                return
            }
        }
        if (e.ctrlKey || e.metaKey || e.altKey) {
            return
        }
        const arrows: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }
        const arrow = arrows[e.key]
        if (arrow) {
            e.preventDefault()
            if (e.shiftKey) {
                this.tool.moveShift(...arrow)
            } else {
                this.tool.move(...arrow)
            }
        }
    }
}

async function uniqueName(base: string): Promise<string> {
    const names = new Set((await library.listSprites()).map((s) => s.name))
    let i = 1
    while (names.has(`${base}-${i}`)) {
        i++
    }
    return `${base}-${i}`
}
