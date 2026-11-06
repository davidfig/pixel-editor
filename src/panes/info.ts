import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import type { HAlign, VAlign } from '../model/frame'
import type { Relative } from '../state'
import { el, field, setField } from '../ui/dom'
import { Pane } from './pane'

const RELATIVES: Relative[] = ['top-left', 'top-center', 'top-right', 'center-left', 'center-center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right']

/**
 * Name, frame, frame size, anchor, cursor position and size, and zoom. All fields are editable.
 * The anchor ("relative") sets which side stays put when the frame is resized, and where
 * cursor coordinates are measured from.
 */
export class Info extends Pane {
    private name: HTMLInputElement
    private frame: HTMLInputElement
    private width: HTMLInputElement
    private height: HTMLInputElement
    private x: HTMLInputElement
    private y: HTMLInputElement
    private sizeX: HTMLInputElement
    private sizeY: HTMLInputElement
    private zoom: HTMLInputElement
    private anchors: HTMLButtonElement[] = []

    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'info', { title: 'Info', width: 220, resizable: false })
        const c = this.content
        this.name = field(c, '', 'name of sprite', (v) => {
            if (v.trim()) {
                this.sprite.name = v.trim()
                this.sprite.changed()
            }
        }, '100%')
        this.name.parentElement!.classList.add('center')
        this.frame = field(row(c), 'frame: ', 'current frame', (v) => (this.sprite.current = int(v, this.sprite.current)))

        const size = row(c)
        this.width = field(size, 'w: ', 'frame width', (v) => this.resize(int(v, this.sprite.width), this.sprite.height))
        this.height = field(size, 'h: ', 'frame height', (v) => this.resize(this.sprite.width, int(v, this.sprite.height)))

        const dice = el('div', { parent: c, className: 'anchor', title: 'anchor of sprite' })
        for (const relative of RELATIVES) {
            const b = el('button', { parent: dice, title: relative })
            b.addEventListener('click', () => this.state.set('relative', relative))
            this.anchors.push(b)
        }

        const cursor = row(c)
        this.x = field(cursor, 'x: ', 'x position of cursor (left/right arrow)', (v) => this.state.set('cursorX', this.fromRelative(int(v, 0), 'x')))
        this.y = field(cursor, 'y: ', 'y position of cursor (up/down arrow)', (v) => this.state.set('cursorY', this.fromRelative(int(v, 0), 'y')))
        const cursorSize = row(c)
        this.sizeX = field(cursorSize, 'w: ', 'width of cursor (shift + left/right arrow)', (v) => this.state.set('cursorSizeX', int(v, 1) || 1))
        this.sizeY = field(cursorSize, 'h: ', 'height of cursor (shift + up/down arrow)', (v) => this.state.set('cursorSizeY', int(v, 1) || 1))
        this.zoom = field(row(c), 'zoom: ', 'scale of the frames, animation and export', (v) => (app.zoom = int(v, app.zoom)))

        const update = () => this.update()
        this.state.on('change', update)
        app.on('sprite', update)
        app.on('zoom', update)
        app.on('sprite', () => this.listen())
        this.listen()
        this.update()
    }

    private listen(): void {
        this.sprite.on('changed', this.update, this)
        this.sprite.on('current', this.update, this)
    }

    private get split(): [string, string] {
        const [v, h] = this.state.get('relative').split('-')
        return [v, h]
    }

    private resize(width: number, height: number): void {
        const [v, h] = this.split
        this.sprite.resize(width, height, (h === 'center' ? 'center' : h) as HAlign, (v === 'center' ? 'center' : v) as VAlign)
    }

    /** Cursor coordinates are shown relative to the anchor. */
    private toRelative(value: number, axis: 'x' | 'y'): number {
        const [v, h] = this.split
        const side = axis === 'x' ? h : v
        const size = axis === 'x' ? this.sprite.width : this.sprite.height
        return side === 'right' || side === 'bottom' ? value - size + 1 : side === 'center' ? value - Math.floor(size / 2) : value
    }

    private fromRelative(value: number, axis: 'x' | 'y'): number {
        const [v, h] = this.split
        const side = axis === 'x' ? h : v
        const size = axis === 'x' ? this.sprite.width : this.sprite.height
        const result = side === 'right' || side === 'bottom' ? value + size - 1 : side === 'center' ? value + Math.floor(size / 2) : value
        return Math.max(0, Math.min(size - 1, result))
    }

    private update(): void {
        const s = this.state
        setField(this.name, this.sprite.name)
        setField(this.frame, this.sprite.current)
        setField(this.width, this.sprite.width)
        setField(this.height, this.sprite.height)
        setField(this.x, this.toRelative(s.get('cursorX'), 'x'))
        setField(this.y, this.toRelative(s.get('cursorY'), 'y'))
        setField(this.sizeX, s.get('cursorSizeX'))
        setField(this.sizeY, s.get('cursorSizeY'))
        setField(this.zoom, this.app.zoom)
        RELATIVES.forEach((r, i) => this.anchors[i].classList.toggle('selected', r === s.get('relative')))
    }
}

function row(parent: HTMLElement): HTMLElement {
    return el('div', { parent, className: 'row' })
}

function int(value: string, fallback: number): number {
    const n = parseInt(value, 10)
    return Number.isNaN(n) ? fallback : n
}
