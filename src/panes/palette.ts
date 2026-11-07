import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { type Hex, hexToCss, hexToHsl, rgbaToHex } from '../model/color'
import { CHECKER_CSS, el } from '../ui/dom'
import { Pane } from './pane'

const STANDARD: Hex[] = ['000000ff', 'ffffffff', '00000000']
const PRESETS: Hex[] = ['ff0000ff', '00ff00ff', '0000ffff', 'ff00ffff', 'ffff00ff', '00ffffff', 'ffaa00ff']
const GREYS = 10
/** Keys 4–9 and 0 pick the first seven colors used in the sprite. */
const SPRITE_KEYS = ['4', '5', '6', '7', '8', '9', '0']

/** Foreground/background swatches, standard colors, the sprite's own colors, greys and presets. */
export class Palette extends Pane {
    private spriteColors: Hex[] = []
    private greys: Hex[] = []
    private queued = false

    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'palette', { title: 'Palette', width: 250, height: 200 })
        for (let i = 0; i < GREYS; i++) {
            const v = Math.round(255 * (1 - (i + 1) / (GREYS + 2)))
            this.greys.push(rgbaToHex(v, v, v, 255))
        }
        const redraw = () => this.queue()
        this.state.on('foreground', redraw)
        this.state.on('background', redraw)
        this.state.on('isForeground', redraw)
        app.on('sprite', () => {
            this.sprite.on('changed', redraw)
            redraw()
        })
        this.sprite.on('changed', redraw)
        this.registerKeys()
        this.render()
    }

    private registerKeys(): void {
        const s = this.state
        Object.assign(this.app.commands, {
            Color1: () => (s.color = STANDARD[0]),
            Color2: () => (s.color = STANDARD[1]),
            Color3: () => (s.color = STANDARD[2]),
        })
        SPRITE_KEYS.forEach((key, i) => {
            this.app.commands['SpriteColor' + key] = () => {
                if (this.spriteColors[i]) {
                    s.color = this.spriteColors[i]
                }
            }
        })
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
        const s = this.state
        this.spriteColors = usedColors(this.app)
        this.content.replaceChildren()

        const top = el('div', { parent: this.content, className: 'palette-top' })
        const fg = this.swatch(top, s.get('foreground'), 'foreground (x to swap)', () => s.set('isForeground', true), 'large')
        const bg = this.swatch(top, s.get('background'), 'background (x to swap)', () => s.set('isForeground', false), 'large')
        ;(s.get('isForeground') ? fg : bg).classList.add('active')
        STANDARD.forEach((color, i) => this.swatch(top, color, `key: ${i + 1}`, () => (s.color = color), 'medium', String(i + 1)))

        for (const [colors, labels] of [
            [this.spriteColors, SPRITE_KEYS],
            [this.greys, []],
            [PRESETS, []],
        ] as [Hex[], string[]][]) {
            if (!colors.length) {
                continue
            }
            const line = el('div', { parent: this.content, className: 'palette-line' })
            colors.forEach((color, i) => this.swatch(line, color, labels[i] ? `#${color} (key: ${labels[i]})` : '#' + color, () => (s.color = color), 'small', labels[i]))
        }
    }

    private swatch(parent: HTMLElement, color: Hex, title: string, onClick: () => void, size: string, label?: string): HTMLElement {
        const outer = el('button', { parent, className: `swatch ${size}`, title, style: { background: CHECKER_CSS } })
        const inner = el('span', { parent: outer, style: { background: hexToCss(color) } })
        if (label) {
            const { l } = hexToHsl(color)
            el('span', { parent: inner, className: 'swatch-label', text: label, style: { color: l > 0.5 || color.endsWith('00') ? 'black' : 'white' } })
        }
        if (color === this.state.color) {
            outer.classList.add('selected')
        }
        outer.addEventListener('click', onClick)
        return outer
    }
}

/** Colors used in any frame, except black, white and transparent, sorted by hue then lightness. */
function usedColors(app: App): Hex[] {
    const seen = new Set<Hex>()
    for (const frame of app.sprite.frames) {
        const d = frame.data
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] === 0) {
                continue
            }
            seen.add(rgbaToHex(d[i], d[i + 1], d[i + 2], d[i + 3]))
        }
    }
    for (const skip of STANDARD) {
        seen.delete(skip)
    }
    return [...seen]
        .map((hex) => ({ hex, hsl: hexToHsl(hex) }))
        .sort((a, b) => a.hsl.h - b.hsl.h || a.hsl.l - b.hsl.l || a.hsl.s - b.hsl.s)
        .map((c) => c.hex)
}
