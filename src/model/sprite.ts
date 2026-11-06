import { EventEmitter } from 'eventemitter3'

import type { Animations } from './animation'
import type { Hex } from './color'
import { Frame, type HAlign, type VAlign } from './frame'
import type { SpriteData } from './format'

export const UNDO_SIZE = 50
export const DEFAULT_SIZE = 15

interface History {
    undo: Frame[]
    redo: Frame[]
}

interface SpriteEvents {
    /** Pixels, frame sizes or the frame list changed. */
    changed: []
    /** The current frame index changed. */
    current: []
}

/**
 * The document being edited: frames, animations, the current frame and per-frame undo.
 * Mutating methods that should be undoable call `checkpoint()` first.
 */
export class Sprite extends EventEmitter<SpriteEvents> implements SpriteData {
    name: string
    frames: Frame[]
    animations: Animations
    /** Set on every change; storage clears it after saving. */
    dirty = false

    private history: History[]
    private _current = 0

    constructor(data?: SpriteData) {
        super()
        this.name = data?.name ?? 'untitled'
        this.frames = data?.frames.length ? data.frames : [new Frame(DEFAULT_SIZE, DEFAULT_SIZE)]
        this.animations = data?.animations ?? { idle: [[0, 0]] }
        this.history = this.frames.map(() => ({ undo: [], redo: [] }))
    }

    get current(): number {
        return this._current
    }
    set current(value: number) {
        const index = Math.max(0, Math.min(this.frames.length - 1, Math.floor(value)))
        if (index !== this._current) {
            this._current = index
            this.emit('current')
        }
    }

    get frame(): Frame {
        return this.frames[this._current]
    }

    get width(): number {
        return this.frame.width
    }

    get height(): number {
        return this.frame.height
    }

    get largestWidth(): number {
        return Math.max(...this.frames.map((f) => f.width))
    }

    get largestHeight(): number {
        return Math.max(...this.frames.map((f) => f.height))
    }

    get(x: number, y: number): Hex {
        return this.frame.get(x, y)
    }

    /** Set one pixel without an undo checkpoint. Call `checkpoint()` once before a batch of sets. */
    set(x: number, y: number, color: Hex): void {
        if (this.frame.set(x, y, color)) {
            this.changed()
        }
    }

    /** Save the current frame to its undo stack. */
    checkpoint(): void {
        const history = this.history[this._current]
        history.undo.push(this.frame.clone())
        if (history.undo.length > UNDO_SIZE) {
            history.undo.shift()
        }
        history.redo = []
    }

    get canUndo(): boolean {
        return this.history[this._current].undo.length > 0
    }

    get canRedo(): boolean {
        return this.history[this._current].redo.length > 0
    }

    undo(): void {
        const history = this.history[this._current]
        const frame = history.undo.pop()
        if (frame) {
            history.redo.push(this.frame)
            this.frames[this._current] = frame
            this.changed()
        }
    }

    redo(): void {
        const history = this.history[this._current]
        const frame = history.redo.pop()
        if (frame) {
            history.undo.push(this.frame)
            this.frames[this._current] = frame
            this.changed()
        }
    }

    /** Replace the current frame (with an undo checkpoint). Used by the transforms below. */
    private replace(frame: Frame): void {
        this.checkpoint()
        this.frames[this._current] = frame
        this.changed()
    }

    rotate(counter = false): void {
        this.replace(this.frame.rotate(counter))
    }

    flipHorizontal(): void {
        this.replace(this.frame.flipHorizontal())
    }

    flipVertical(): void {
        this.replace(this.frame.flipVertical())
    }

    crop(x: number, y: number, width: number, height: number): void {
        this.replace(this.frame.region(x, y, width, height))
    }

    resize(width: number, height: number, hAlign: HAlign = 'left', vAlign: VAlign = 'top'): void {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
            return
        }
        if (width !== this.width || height !== this.height) {
            this.replace(this.frame.resize(width, height, hAlign, vAlign))
        }
    }

    /** Insert a blank frame the size of the current one at `index` (default: the end) and select it. */
    addFrame(index = this.frames.length): void {
        this.frames.splice(index, 0, new Frame(this.width, this.height))
        this.history.splice(index, 0, { undo: [], redo: [] })
        this.changed()
        this.current = index
    }

    duplicateFrame(): void {
        const index = this._current + 1
        this.frames.splice(index, 0, this.frame.clone())
        this.history.splice(index, 0, { undo: [], redo: [] })
        this.changed()
        this.current = index
    }

    removeFrame(index = this._current): void {
        if (this.frames.length <= 1 || index < 0 || index >= this.frames.length) {
            return
        }
        this.frames.splice(index, 1)
        this.history.splice(index, 1)
        if (this._current >= this.frames.length || this._current > index) {
            this._current = Math.max(0, this._current - 1)
        }
        this.changed()
        this.emit('current')
    }

    /** Move a frame so it ends up at index `to`. */
    moveFrame(from: number, to: number): void {
        if (from === to || from < 0 || to < 0 || from >= this.frames.length || to >= this.frames.length) {
            return
        }
        const selected = this.frames[this._current]
        const [frame] = this.frames.splice(from, 1)
        const [history] = this.history.splice(from, 1)
        this.frames.splice(to, 0, frame)
        this.history.splice(to, 0, history)
        this._current = this.frames.indexOf(selected)
        this.changed()
        this.emit('current')
    }

    nextFrame(): void {
        this.current = this._current === this.frames.length - 1 ? 0 : this._current + 1
    }

    previousFrame(): void {
        this.current = this._current === 0 ? this.frames.length - 1 : this._current - 1
    }

    /** Mark the sprite changed and notify listeners. */
    changed(): void {
        this.dirty = true
        this.emit('changed')
    }
}
