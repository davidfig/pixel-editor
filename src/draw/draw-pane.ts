import { type Hex, hexToCss } from '../model/color'
import type { Sprite } from '../model/sprite'
import type { State } from '../state'
import type { EditorState } from '../storage/library'
import type { Overlay, Tool } from '../tools/tools'
import { Viewport } from './viewport'

const CHECKER_LIGHT = '#e6e6e6'
const CHECKER_DARK = '#999999'
const GRID_COLOR = 'rgba(136, 136, 136, 0.8)'
/** Hide the grid when a sprite pixel is smaller than this on screen. */
const GRID_MIN_SCALE = 6
/** Pointer movement (CSS px) before a press becomes a drag. */
const DRAG_THRESHOLD = 5
const WHEEL_ZOOM = 0.0015

/**
 * The full-window editing canvas behind the panes: checkerboard, the current frame,
 * a pixel grid and the tool's cursor. Redraws on the next animation frame after any change.
 */
export class DrawPane {
    readonly canvas: HTMLCanvasElement
    readonly viewport = new Viewport()
    /** Called (throttled to one per frame) whenever the viewport moves or zooms. */
    onViewportChange?: () => void

    private c: CanvasRenderingContext2D
    private frameCanvas = document.createElement('canvas')
    private checker = document.createElement('canvas')
    private frameDirty = true
    private queued = false
    private viewportMoved = false
    private needsFit = true
    private pointers = new Map<number, { x: number; y: number }>()
    private press: { x: number; y: number; dragging: boolean } | null = null
    private pinchDistance = 0

    constructor(
        parent: HTMLElement,
        private sprite: Sprite,
        private state: State,
        private getTool: () => Tool,
    ) {
        this.canvas = document.createElement('canvas')
        Object.assign(this.canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', display: 'block', touchAction: 'none' })
        parent.appendChild(this.canvas)
        this.c = this.canvas.getContext('2d')!

        new ResizeObserver(() => this.resize()).observe(this.canvas)
        this.canvas.addEventListener('pointerdown', (e) => this.pointerDown(e))
        this.canvas.addEventListener('pointermove', (e) => this.pointerMove(e))
        this.canvas.addEventListener('pointerup', (e) => this.pointerUp(e))
        this.canvas.addEventListener('pointercancel', (e) => this.pointerUp(e, true))
        this.canvas.addEventListener('wheel', (e) => this.wheel(e), { passive: false })

        state.on('change', () => this.redraw())
        this.resize()
        this.setSprite(sprite)
    }

    /** Switch to another sprite (after open/new). */
    setSprite(sprite: Sprite, editor?: EditorState): void {
        this.sprite.off('changed', this.frameChanged, this)
        this.sprite.off('current', this.frameChanged, this)
        this.sprite = sprite
        sprite.on('changed', this.frameChanged, this)
        sprite.on('current', this.frameChanged, this)
        if (editor?.viewport) {
            Object.assign(this.viewport, editor.viewport)
            this.needsFit = false
        } else {
            // fitted on the next render, once the window has a size
            this.needsFit = true
        }
        this.frameChanged()
    }

    /** The viewport as stored in EditorState. */
    get savedViewport(): EditorState['viewport'] {
        const { x, y, scale } = this.viewport
        return { x, y, scale }
    }

    /** Position pane buttons. */
    fit(fraction: number): void {
        this.viewport.fit(this.sprite.width, this.sprite.height, fraction)
        this.viewportChanged()
    }

    center(): void {
        this.viewport.centerOn(this.sprite.width / 2, this.sprite.height / 2)
        this.viewportChanged()
    }

    corner(): void {
        this.viewport.corner()
        this.viewportChanged()
    }

    redraw(): void {
        if (!this.queued) {
            this.queued = true
            requestAnimationFrame(() => this.render())
        }
    }

    private frameChanged(): void {
        this.frameDirty = true
        this.redraw()
    }

    private viewportChanged(): void {
        this.viewportMoved = true
        this.redraw()
    }

    private resize(): void {
        const dpr = window.devicePixelRatio || 1
        const { width, height } = this.canvas.getBoundingClientRect()
        this.viewport.screenWidth = width
        this.viewport.screenHeight = height
        this.canvas.width = Math.round(width * dpr)
        this.canvas.height = Math.round(height * dpr)
        this.redraw()
    }

    private render(): void {
        this.queued = false
        const { sprite, viewport: vp, c } = this
        if (this.needsFit && vp.screenWidth > 0 && vp.screenHeight > 0) {
            this.needsFit = false
            vp.fit(sprite.width, sprite.height, 0.5)
            this.viewportMoved = true
        }
        const frame = sprite.frame
        if (this.frameDirty) {
            this.frameDirty = false
            this.frameCanvas.width = frame.width
            this.frameCanvas.height = frame.height
            this.frameCanvas.getContext('2d')!.putImageData(frame.toImageData(), 0, 0)
            this.updateChecker(frame.width, frame.height)
        }

        const dpr = window.devicePixelRatio || 1
        c.setTransform(1, 0, 0, 1, 0, 0)
        c.clearRect(0, 0, this.canvas.width, this.canvas.height)
        // world -> device pixels
        c.setTransform(vp.scale * dpr, 0, 0, vp.scale * dpr, -vp.x * vp.scale * dpr, -vp.y * vp.scale * dpr)
        c.imageSmoothingEnabled = false
        c.drawImage(this.checker, 0, 0, frame.width, frame.height)
        c.drawImage(this.frameCanvas, 0, 0)

        if (vp.scale >= GRID_MIN_SCALE) {
            c.beginPath()
            for (let x = 0; x <= frame.width; x++) {
                c.moveTo(x, 0)
                c.lineTo(x, frame.height)
            }
            for (let y = 0; y <= frame.height; y++) {
                c.moveTo(0, y)
                c.lineTo(frame.width, y)
            }
            c.strokeStyle = GRID_COLOR
            c.lineWidth = 1 / vp.scale
            c.stroke()
        }

        this.getTool().cursor(this.overlay())

        if (this.viewportMoved) {
            this.viewportMoved = false
            this.onViewportChange?.()
        }
    }

    /** A 2x2 checker per sprite pixel, drawn once per frame size and scaled up. */
    private updateChecker(width: number, height: number): void {
        if (this.checker.width === width * 2 && this.checker.height === height * 2) {
            return
        }
        this.checker.width = width * 2
        this.checker.height = height * 2
        const c = this.checker.getContext('2d')!
        c.fillStyle = CHECKER_LIGHT
        c.fillRect(0, 0, width * 2, height * 2)
        c.fillStyle = CHECKER_DARK
        for (let y = 0; y < height * 2; y++) {
            for (let x = (y % 2); x < width * 2; x += 2) {
                c.fillRect(x, y, 1, 1)
            }
        }
    }

    private overlay(): Overlay {
        const c = this.c
        const scale = this.viewport.scale
        return {
            fillPixel(x: number, y: number, color: Hex) {
                c.fillStyle = hexToCss(color)
                c.fillRect(x, y, 1, 1)
            },
            fillPixelOutset(x: number, y: number, color: Hex) {
                const out = 3 / scale
                c.fillStyle = hexToCss(color)
                c.fillRect(x - out, y - out, 1 + out * 2, 1 + out * 2)
            },
            strokeRect(x: number, y: number, width: number, height: number, color: Hex, lineWidth: number, dashed = false) {
                c.save()
                c.strokeStyle = hexToCss(color)
                c.lineWidth = lineWidth / scale
                c.setLineDash(dashed ? [6 / scale, 6 / scale] : [])
                const inset = lineWidth / scale / 2
                c.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2)
                c.restore()
            },
        }
    }

    private pointerDown(e: PointerEvent): void {
        this.canvas.setPointerCapture(e.pointerId)
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (this.pointers.size === 1) {
            this.press = { x: e.clientX, y: e.clientY, dragging: e.button === 1 }
        } else if (this.pointers.size === 2) {
            this.press = null
            this.pinchDistance = this.pinchSpan()
        }
    }

    private pointerMove(e: PointerEvent): void {
        const last = this.pointers.get(e.pointerId)
        if (!last) {
            return
        }
        const dx = e.clientX - last.x
        const dy = e.clientY - last.y
        last.x = e.clientX
        last.y = e.clientY
        if (this.pointers.size === 2) {
            const span = this.pinchSpan()
            const mid = this.pinchMid()
            if (this.pinchDistance > 0) {
                this.viewport.zoomAt(mid.x, mid.y, span / this.pinchDistance)
            }
            this.viewport.pan(dx / 2, dy / 2)
            this.pinchDistance = span
            this.viewportChanged()
        } else if (this.press) {
            if (!this.press.dragging && Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y) > DRAG_THRESHOLD) {
                this.press.dragging = true
            }
            if (this.press.dragging) {
                this.viewport.pan(dx, dy)
                this.viewportChanged()
            }
        }
    }

    private pointerUp(e: PointerEvent, cancelled = false): void {
        this.pointers.delete(e.pointerId)
        if (this.press && !this.press.dragging && !cancelled && e.button === 0) {
            // a click (no drag) moves the cursor to the pixel under the pointer
            const local = this.local(e)
            const p = this.viewport.toWorld(local.x, local.y)
            const x = Math.floor(p.x)
            const y = Math.floor(p.y)
            if (this.sprite.frame.inBounds(x, y)) {
                this.state.set('cursorX', x)
                this.state.set('cursorY', y)
            }
        }
        if (this.pointers.size === 0) {
            this.press = null
        }
    }

    private wheel(e: WheelEvent): void {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey || e.deltaMode !== 0 || Math.abs(e.deltaX) < 1) {
            // mouse wheel, or trackpad pinch (which browsers send as ctrl + wheel): zoom
            const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY
            const local = this.local(e)
            this.viewport.zoomAt(local.x, local.y, Math.exp(-delta * WHEEL_ZOOM * (e.ctrlKey ? 5 : 1)))
        } else {
            // two-finger trackpad scroll: pan
            this.viewport.pan(-e.deltaX, -e.deltaY)
        }
        this.viewportChanged()
    }

    /** Pointer position relative to the canvas. */
    private local(e: { clientX: number; clientY: number }): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    private pinchSpan(): number {
        const [a, b] = [...this.pointers.values()]
        return Math.hypot(a.x - b.x, a.y - b.y)
    }

    private pinchMid(): { x: number; y: number } {
        const [a, b] = [...this.pointers.values()]
        return this.local({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 })
    }
}
