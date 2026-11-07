import { type Hex, TRANSPARENT, isTransparent } from '../model/color'
import type { Sprite } from '../model/sprite'
import type { State, Tool as ToolName } from '../state'
import { type Block, box, circle, ellipse, floodFill, line } from './shapes'

/** Cursor color when the foreground is transparent. */
export const CURSOR_COLOR: Hex = 'ff0000ff'
export const CROP_COLOR: Hex = 'd20000ff'

/** What tools draw their cursor with. Coordinates are sprite pixels; line widths are screen pixels. */
export interface Overlay {
    fillPixel(x: number, y: number, color: Hex): void
    /** A pixel drawn slightly larger than its cell, so it stands out against the same color. */
    fillPixelOutset(x: number, y: number, color: Hex): void
    strokeRect(x: number, y: number, width: number, height: number, color: Hex, lineWidth: number, dashed?: boolean): void
}

export interface ToolContext {
    sprite: Sprite
    state: State
}

/** Base tool: keyboard cursor movement, erase and clear. */
export abstract class Tool {
    constructor(protected ctx: ToolContext) {}

    protected get sprite(): Sprite {
        return this.ctx.sprite
    }
    protected get state(): State {
        return this.ctx.state
    }

    /** The cursor box in sprite pixels, normalised so width and height are positive. */
    protected get box() {
        const s = this.state
        return box(s.get('cursorX'), s.get('cursorY'), s.get('cursorSizeX'), s.get('cursorSizeY'))
    }

    /** The cursor box clipped to the sprite, for drawing. */
    protected get visibleBox() {
        const b = this.box
        const x = Math.max(0, b.x)
        const y = Math.max(0, b.y)
        return {
            x,
            y,
            width: Math.max(0, Math.min(this.sprite.width, b.x + b.width) - x),
            height: Math.max(0, Math.min(this.sprite.height, b.y + b.height) - y),
        }
    }

    /** Called when the tool is selected. */
    activate(): void {}

    /** Draw the tool's cursor. */
    abstract cursor(overlay: Overlay): void

    /** The draw key (space by default). */
    abstract space(): void

    /** The draw key was released. */
    spaceUp(): void {}

    /** Arrow keys: move the cursor, wrapping at the edges. */
    move(dx: number, dy: number): void {
        const s = this.state
        const { width, height } = this.sprite
        s.set('cursorX', wrap(s.get('cursorX') + dx, width))
        s.set('cursorY', wrap(s.get('cursorY') + dy, height))
    }

    /** Shift + arrow keys: grow or shrink the cursor box. Sizes skip 0 and -1, which would equal 1. */
    moveShift(dx: number, dy: number): void {
        const s = this.state
        s.set('cursorSizeX', resize(s.get('cursorSizeX'), dx, this.sprite.width))
        s.set('cursorSizeY', resize(s.get('cursorSizeY'), dy, this.sprite.height))
    }

    /** Erase under the cursor (backspace). */
    erase(): void {
        const { x, y, width, height } = this.box
        this.sprite.checkpoint()
        for (let py = y; py < y + height; py++) {
            for (let px = x; px < x + width; px++) {
                this.sprite.frame.set(px, py, TRANSPARENT)
            }
        }
        this.sprite.changed()
    }

    /** Escape: shrink the cursor to one pixel, or if it already is, move it to the corner. */
    clear(): void {
        const s = this.state
        if (s.get('cursorSizeX') === 1 && s.get('cursorSizeY') === 1) {
            s.setCursor(0, 0)
        } else {
            const { x, y } = this.box
            s.setCursor(x, y, 1, 1)
        }
    }

    protected cursorColor(): Hex {
        const fg = this.state.get('foreground')
        return isTransparent(fg) ? CURSOR_COLOR : fg.slice(0, 6) + 'ff'
    }

    protected stampBlocks(blocks: Block[]): void {
        this.sprite.checkpoint()
        for (const b of blocks) {
            this.sprite.frame.set(b.x, b.y, b.color)
        }
        this.sprite.changed()
    }
}

/** Paint: space toggles the pixel between foreground and background, or fills the box. Hold space and move to paint. */
export class PaintTool extends Tool {
    private painting: { x: number; y: number } | null = null

    cursor(overlay: Overlay): void {
        const { x, y, width, height } = this.visibleBox
        overlay.strokeRect(x, y, width, height, this.cursorColor(), 2)
    }

    move(dx: number, dy: number): void {
        super.move(dx, dy)
        if (this.painting) {
            this.space()
        }
    }

    space(): void {
        const s = this.state
        const x = s.get('cursorX')
        const y = s.get('cursorY')
        if (this.painting && this.painting.x === x && this.painting.y === y) {
            return
        }
        this.sprite.checkpoint()
        if (s.get('cursorSizeX') === 1 && s.get('cursorSizeY') === 1) {
            const fg = s.get('foreground')
            this.sprite.frame.set(x, y, this.sprite.get(x, y) !== fg ? fg : s.get('background'))
        } else {
            const b = this.box
            for (let py = b.y; py < b.y + b.height; py++) {
                for (let px = b.x; px < b.x + b.width; px++) {
                    this.sprite.frame.set(px, py, s.get('foreground'))
                }
            }
        }
        this.sprite.changed()
        this.painting = { x, y }
    }

    spaceUp(): void {
        this.painting = null
    }
}

export class FillTool extends Tool {
    cursor(overlay: Overlay): void {
        overlay.strokeRect(this.state.get('cursorX'), this.state.get('cursorY'), 1, 1, this.cursorColor(), 4)
    }

    space(): void {
        this.sprite.checkpoint()
        if (floodFill(this.sprite.frame, this.state.get('cursorX'), this.state.get('cursorY'), this.state.color)) {
            this.sprite.changed()
        }
    }
}

export class SelectTool extends Tool {
    cursor(overlay: Overlay): void {
        const { x, y, width, height } = this.visibleBox
        overlay.strokeRect(x, y, width, height, this.cursorColor(), 2, true)
    }

    space(): void {}
}

export class CropTool extends Tool {
    cursor(overlay: Overlay): void {
        const { x, y, width, height } = this.visibleBox
        overlay.strokeRect(x, y, width, height, CROP_COLOR, 2, true)
    }

    space(): void {
        const { x, y, width, height } = this.box
        this.sprite.crop(x, y, Math.min(width, this.sprite.width - x), Math.min(height, this.sprite.height - y))
        this.state.setCursor(0, 0)
    }
}

/** Shape tools draw a preview stamp and apply it with space. */
abstract class StampTool extends Tool {
    protected abstract blocks(): Block[]

    cursor(overlay: Overlay): void {
        for (const b of this.blocks()) {
            overlay.fillPixel(b.x, b.y, b.color)
        }
    }

    space(): void {
        this.stampBlocks(this.blocks())
    }
}

export class CircleTool extends StampTool {
    activate(): void {
        if (this.state.get('cursorSizeX') === 1) {
            this.state.set('cursorSizeX', 3)
        }
    }

    moveShift(dx: number, dy: number): void {
        super.moveShift(dx, dy)
        if (this.state.get('cursorSizeX') < 1) {
            this.state.set('cursorSizeX', 1)
        }
    }

    protected blocks(): Block[] {
        const s = this.state
        return circle(s.get('cursorX'), s.get('cursorY'), s.get('cursorSizeX'), s.get('foreground'), s.get('background'), this.sprite.width, this.sprite.height)
    }
}

export class EllipseTool extends StampTool {
    activate(): void {
        if (this.state.get('cursorSizeX') === 1 && this.state.get('cursorSizeY') === 1) {
            this.state.set('cursorSizeX', 3)
            this.state.set('cursorSizeY', 3)
        }
    }

    moveShift(dx: number, dy: number): void {
        super.moveShift(dx, dy)
        if (this.state.get('cursorSizeX') < 1) {
            this.state.set('cursorSizeX', 1)
        }
        if (this.state.get('cursorSizeY') < 1) {
            this.state.set('cursorSizeY', 1)
        }
    }

    protected blocks(): Block[] {
        const s = this.state
        return ellipse(s.get('cursorX'), s.get('cursorY'), s.get('cursorSizeX'), s.get('cursorSizeY'), s.get('foreground'), s.get('background'), this.sprite.width, this.sprite.height)
    }
}

/** Line: shift + arrows move the far end; space draws from the cursor to it. */
export class LineTool extends Tool {
    private end: { x: number; y: number } | null = null

    activate(): void {
        this.end = null
    }

    cursor(overlay: Overlay): void {
        const color = this.state.color
        for (const p of this.points()) {
            overlay.fillPixelOutset(p.x, p.y, isTransparent(color) ? CURSOR_COLOR : color)
        }
    }

    moveShift(dx: number, dy: number): void {
        const s = this.state
        this.end ??= { x: s.get('cursorX'), y: s.get('cursorY') }
        this.end.x = wrap(this.end.x + dx, this.sprite.width)
        this.end.y = wrap(this.end.y + dy, this.sprite.height)
        // nudge listeners so the cursor redraws
        s.touch('cursorSizeX')
    }

    clear(): void {
        if (this.end) {
            this.end = null
            this.state.touch('cursorSizeX')
        } else {
            super.clear()
        }
    }

    space(): void {
        const color = this.state.color
        this.stampBlocks(this.points().map((p) => ({ ...p, color })))
    }

    private points(): { x: number; y: number }[] {
        const x = this.state.get('cursorX')
        const y = this.state.get('cursorY')
        return this.end ? line(x, y, this.end.x, this.end.y) : [{ x, y }]
    }
}

export function createTools(ctx: ToolContext): Record<ToolName, Tool> {
    return {
        paint: new PaintTool(ctx),
        fill: new FillTool(ctx),
        select: new SelectTool(ctx),
        crop: new CropTool(ctx),
        circle: new CircleTool(ctx),
        ellipse: new EllipseTool(ctx),
        line: new LineTool(ctx),
    }
}

function wrap(n: number, size: number): number {
    return ((n % size) + size) % size
}

function resize(size: number, delta: number, max: number): number {
    if (!delta) {
        return size
    }
    let next = size + delta
    if (next === 0 || next === -1) {
        next = delta < 0 ? -2 : 1
    }
    return Math.max(-max, Math.min(max, next))
}
