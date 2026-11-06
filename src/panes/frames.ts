import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import type { Frame } from '../model/frame'
import { CHECKER_CSS, el } from '../ui/dom'
import { Pane } from './pane'

/** Draw a frame onto a canvas at `zoom`x, crisp. */
export function drawFrame(canvas: HTMLCanvasElement, frame: Frame, zoom: number): void {
    canvas.width = frame.width
    canvas.height = frame.height
    canvas.getContext('2d')!.putImageData(frame.toImageData(), 0, 0)
    canvas.style.width = frame.width * zoom + 'px'
    canvas.style.height = frame.height * zoom + 'px'
    canvas.style.imageRendering = 'pixelated'
}

/** Thumbnails of every frame. Click to select; drag to reorder. */
export class Frames extends Pane {
    private queued = false
    private dragging: number | null = null

    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'frames', { title: 'Frames', width: 200, height: 200, minWidth: '100px', minHeight: '100px' })
        this.content.classList.add('frames')
        const redraw = () => this.queue()
        app.on('sprite', () => {
            this.listen()
            redraw()
        })
        app.on('zoom', redraw)
        this.listen()
        this.render()
    }

    private listen(): void {
        this.sprite.on('changed', this.queue, this)
        this.sprite.on('current', this.select, this)
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
        this.content.replaceChildren()
        this.sprite.frames.forEach((frame, i) => {
            const item = el('div', { parent: this.content, className: 'frame', title: `frame ${i}` })
            item.draggable = true
            const canvas = el('canvas', { parent: item, style: { background: CHECKER_CSS } })
            drawFrame(canvas, frame, this.app.zoom)
            el('span', { parent: item, className: 'frame-number', text: String(i) })
            item.addEventListener('click', () => (this.sprite.current = i))
            item.addEventListener('dragstart', (e) => {
                this.dragging = i
                e.dataTransfer!.effectAllowed = 'move'
            })
            item.addEventListener('dragover', (e) => {
                if (this.dragging !== null) {
                    e.preventDefault()
                    item.classList.add('drop')
                }
            })
            item.addEventListener('dragleave', () => item.classList.remove('drop'))
            item.addEventListener('drop', (e) => {
                e.preventDefault()
                if (this.dragging !== null) {
                    this.sprite.moveFrame(this.dragging, i)
                }
                this.dragging = null
            })
            item.addEventListener('dragend', () => (this.dragging = null))
        })
        this.select()
    }

    private select(): void {
        const items = this.content.querySelectorAll('.frame')
        items.forEach((item, i) => item.classList.toggle('selected', i === this.sprite.current))
        ;(items[this.sprite.current] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' })
    }
}
