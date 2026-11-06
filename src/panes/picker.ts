import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { type HSL, hexToHsl, hexToRgba, hslToHex, rgbaToHex } from '../model/color'
import { CHECKER_CSS, el, field, setField } from '../ui/dom'
import { Pane } from './pane'

const BAR_HEIGHT = 20

/**
 * HSL color picker for the active color: a saturation/lightness square, hue and alpha bars,
 * and RGB, alpha, hex and HSL fields.
 */
export class Picker extends Pane {
    private square: HTMLCanvasElement
    private hue: HTMLCanvasElement
    private alpha: HTMLCanvasElement
    private fields: Record<'r' | 'g' | 'b' | 'a' | 'hex' | 'h' | 's' | 'l', HTMLInputElement>
    /** Kept separately so hue and saturation survive dragging through grey or black. */
    private hsl: HSL = { h: 0, s: 0, l: 0 }
    private lastColor = ''
    private queued = false

    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'picker', { title: 'Picker', width: 200, height: 370 })
        const c = this.content
        this.square = el('canvas', { parent: c, className: 'picker-square' })
        this.hue = el('canvas', { parent: c, className: 'picker-bar' })
        const alphaWrap = el('div', { parent: c, className: 'picker-bar-wrap', style: { background: CHECKER_CSS } })
        this.alpha = el('canvas', { parent: alphaWrap, className: 'picker-bar' })

        const set = (fn: (hsl: HSL, alpha: number) => [HSL, number]) => {
            const [hsl, alpha] = fn({ ...this.hsl }, hexToRgba(this.state.color).a)
            this.hsl = hsl
            this.commit(hslToHex(hsl, alpha))
        }
        drag(this.square, (x, y) => set((hsl, a) => [{ h: hsl.h, s: x, l: 1 - y }, a]))
        drag(this.hue, (x) => set((hsl, a) => [{ h: x * 359, s: Math.max(hsl.s, 0.1), l: Math.min(0.9, Math.max(hsl.l, 0.1)) }, a]))
        drag(this.alpha, (x) => set((hsl) => [hsl, Math.round(x * 255)]))

        const rgb = el('div', { parent: c, className: 'row' })
        const channel = (i: 0 | 1 | 2) => (v: string) => {
            const n = clamp(parseInt(v, 10), 0, 255)
            const { r, g, b, a } = hexToRgba(this.state.color)
            const parts = [r, g, b]
            parts[i] = n
            this.setColor(rgbaToHex(parts[0], parts[1], parts[2], a))
        }
        const middle = el('div', { parent: c, className: 'row' })
        const hslRow = el('div', { parent: c, className: 'row' })
        this.fields = {
            r: field(rgb, 'R ', 'red (0–255)', channel(0), '2.5em'),
            g: field(rgb, 'G ', 'green (0–255)', channel(1), '2.5em'),
            b: field(rgb, 'B ', 'blue (0–255)', channel(2), '2.5em'),
            a: field(middle, 'alpha ', 'alpha (0–1)', (v) => {
                const { r, g, b } = hexToRgba(this.state.color)
                this.setColor(rgbaToHex(r, g, b, Math.round(clamp(parseFloat(v), 0, 1) * 255)))
            }, '2.5em'),
            hex: field(middle, '#', 'hex color (rrggbb or rrggbbaa)', (v) => {
                const hex = v.replace(/^#/, '').toLowerCase()
                if (/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) {
                    this.setColor(hex.length === 6 ? hex + this.state.color.slice(6) : hex)
                }
            }, '5em'),
            h: field(hslRow, 'H ', 'hue (0–359)', (v) => set((hsl, a) => [{ ...hsl, h: clamp(parseFloat(v), 0, 359) }, a]), '2.5em'),
            s: field(hslRow, 'S ', 'saturation (0–1)', (v) => set((hsl, a) => [{ ...hsl, s: clamp(parseFloat(v), 0, 1) }, a]), '2.5em'),
            l: field(hslRow, 'L ', 'lightness (0–1)', (v) => set((hsl, a) => [{ ...hsl, l: clamp(parseFloat(v), 0, 1) }, a]), '2.5em'),
        }

        const redraw = () => this.queue()
        for (const key of ['foreground', 'background', 'isForeground'] as const) {
            this.state.on(key, redraw)
        }
        new ResizeObserver(redraw).observe(this.content)
        this.render()
    }

    /** Set from RGB-based fields: recompute HSL. */
    private setColor(hex: string): void {
        this.hsl = hexToHsl(hex)
        this.commit(hex)
    }

    private commit(hex: string): void {
        this.lastColor = hex
        this.state.color = hex
        this.queue()
    }

    private queue(): void {
        if (!this.queued) {
            this.queued = true
            requestAnimationFrame(() => {
                this.queued = false
                this.render()
            })
        }
    }

    private render(): void {
        const color = this.state.color
        if (color !== this.lastColor) {
            // changed elsewhere (palette, dropper, swap)
            this.hsl = hexToHsl(color)
            this.lastColor = color
        }
        const { r, g, b, a } = hexToRgba(color)
        const width = Math.max(50, this.content.clientWidth - 16)
        const dpr = window.devicePixelRatio || 1

        // saturation (x) / lightness (y) square at the current hue
        const sq = sizeCanvas(this.square, width, width, dpr)
        let grad = sq.createLinearGradient(0, 0, width, 0)
        grad.addColorStop(0, `hsl(${this.hsl.h}, 0%, 50%)`)
        grad.addColorStop(1, `hsl(${this.hsl.h}, 100%, 50%)`)
        sq.fillStyle = grad
        sq.fillRect(0, 0, width, width)
        grad = sq.createLinearGradient(0, 0, 0, width)
        grad.addColorStop(0, 'rgba(255,255,255,1)')
        grad.addColorStop(0.5, 'rgba(255,255,255,0)')
        grad.addColorStop(0.5, 'rgba(0,0,0,0)')
        grad.addColorStop(1, 'rgba(0,0,0,1)')
        sq.fillStyle = grad
        sq.fillRect(0, 0, width, width)
        ring(sq, this.hsl.s * width, (1 - this.hsl.l) * width)

        const hue = sizeCanvas(this.hue, width, BAR_HEIGHT, dpr)
        grad = hue.createLinearGradient(0, 0, width, 0)
        ;['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00'].forEach((stop, i) => grad.addColorStop(i / 6, stop))
        hue.fillStyle = grad
        hue.fillRect(0, 0, width, BAR_HEIGHT)
        marker(hue, (this.hsl.h / 359) * width)

        const alpha = sizeCanvas(this.alpha, width, BAR_HEIGHT, dpr)
        grad = alpha.createLinearGradient(0, 0, width, 0)
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`)
        grad.addColorStop(1, `rgb(${r},${g},${b})`)
        alpha.fillStyle = grad
        alpha.fillRect(0, 0, width, BAR_HEIGHT)
        marker(alpha, (a / 255) * width)

        const f = this.fields
        setField(f.r, r)
        setField(f.g, g)
        setField(f.b, b)
        setField(f.a, round2(a / 255))
        setField(f.hex, color.slice(0, 6))
        setField(f.h, Math.round(this.hsl.h))
        setField(f.s, round2(this.hsl.s))
        setField(f.l, round2(this.hsl.l))
    }
}

/** Calls `onMove` with the pointer position as 0–1 fractions while dragging on `canvas`. */
function drag(canvas: HTMLCanvasElement, onMove: (x: number, y: number) => void): void {
    const move = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect()
        onMove(clamp((e.clientX - rect.left) / rect.width, 0, 1), clamp((e.clientY - rect.top) / rect.height, 0, 1))
    }
    canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture(e.pointerId)
        move(e)
    })
    canvas.addEventListener('pointermove', (e) => {
        if (canvas.hasPointerCapture(e.pointerId)) {
            move(e)
        }
    })
}

function sizeCanvas(canvas: HTMLCanvasElement, width: number, height: number, dpr: number): CanvasRenderingContext2D {
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    const c = canvas.getContext('2d')!
    c.scale(dpr, dpr)
    return c
}

function ring(c: CanvasRenderingContext2D, x: number, y: number): void {
    c.lineWidth = 1.5
    c.strokeStyle = 'black'
    c.beginPath()
    c.arc(x, y, 6, 0, Math.PI * 2)
    c.stroke()
    c.strokeStyle = 'white'
    c.beginPath()
    c.arc(x, y, 4.5, 0, Math.PI * 2)
    c.stroke()
}

function marker(c: CanvasRenderingContext2D, x: number): void {
    c.lineWidth = 2
    c.strokeStyle = '#eeeeee'
    c.strokeRect(Math.max(1, Math.min(c.canvas.clientWidth - 5, x - 2)), 1, 4, BAR_HEIGHT - 2)
}

function clamp(n: number, min: number, max: number): number {
    return Number.isNaN(n) ? min : Math.max(min, Math.min(max, n))
}

function round2(n: number): number {
    return Math.round(n * 100) / 100
}
