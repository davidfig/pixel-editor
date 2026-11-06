import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { type AnimationEntry, AnimationPlayer, DEFAULT_UNIT_MS } from '../model/animation'
import { CHECKER_CSS, type Icon, el, iconButton, isolateKeys, setIcon } from '../ui/dom'
import { confirm, prompt } from '../ui/dialog'
import { Pane } from './pane'
import ICONS from '../../images/animation.json'

const icon = (i: number) => ICONS.imageData[i] as Icon

/** Preview and edit the sprite's animations. Entries are edited as JSON (see model/animation.ts). */
export class Animation extends Pane {
    private canvas: HTMLCanvasElement
    private play: HTMLButtonElement
    private names: HTMLSelectElement
    private time: HTMLInputElement
    private text: HTMLTextAreaElement
    private error: HTMLElement
    private others: HTMLButtonElement[]
    private player: AnimationPlayer | null = null
    private unitMs = DEFAULT_UNIT_MS
    private last = 0

    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'animation', { title: 'Animation', width: 230, height: 260, minWidth: '230px' })
        const c = this.content
        c.classList.add('animation')
        this.canvas = el('canvas', { parent: el('div', { parent: c, className: 'animation-view' }), style: { background: CHECKER_CSS } })

        const buttons = el('div', { parent: c, className: 'buttons' })
        this.play = iconButton(buttons, icon(0), 'play animation', () => this.toggle())
        this.others = [
            iconButton(buttons, icon(4), 'new animation', () => this.create()),
            iconButton(buttons, icon(5), 'rename animation', () => this.rename()),
            iconButton(buttons, icon(3), 'duplicate animation', () => this.duplicate()),
            iconButton(buttons, icon(2), 'delete animation', () => this.remove()),
        ]

        const row = el('div', { parent: c, className: 'row' })
        this.names = el('select', { parent: row, style: { flex: '1' } })
        this.names.addEventListener('change', () => this.showText())
        this.time = el('input', { parent: row, title: 'length of one time unit', style: { width: '3em', textAlign: 'right' } })
        this.time.value = String(this.unitMs)
        this.time.addEventListener('change', () => {
            const n = parseInt(this.time.value, 10)
            if (n > 0) {
                this.unitMs = n
                this.restart()
            }
        })
        el('span', { parent: row, text: 'ms' })

        this.text = el('textarea', { parent: c, title: 'entries, e.g. [0, 2], 1, "loop"' })
        this.text.addEventListener('change', () => this.changeText())
        this.error = el('div', { parent: c, className: 'error' })
        for (const control of [this.names, this.time, this.text]) {
            isolateKeys(control)
        }

        app.on('sprite', () => {
            this.listen()
            this.showNames()
            this.stop()
            this.drawStill()
        })
        app.on('zoom', () => this.drawStill())
        this.state.on('relative', () => this.drawStill())
        this.listen()
        this.showNames()
        this.drawStill()
        requestAnimationFrame((t) => this.tick(t))
    }

    private listen(): void {
        this.sprite.on('changed', () => {
            if (!this.player?.playing) {
                this.drawStill()
            }
        })
    }

    private get animations() {
        return this.sprite.animations
    }

    private get selected(): string {
        return this.names.value
    }

    private tick(time: number): void {
        const elapsed = this.last ? time - this.last : 0
        this.last = time
        if (this.player?.playing && this.player.update(elapsed)) {
            this.drawFrame(this.player.frame)
        }
        requestAnimationFrame((t) => this.tick(t))
    }

    /** Frames are drawn at `zoom` inside a box the size of the largest frame, positioned by the anchor. */
    private drawFrame(index: number): void {
        const frame = this.sprite.frames[index]
        const zoom = this.app.zoom
        const w = this.sprite.largestWidth
        const h = this.sprite.largestHeight
        this.canvas.width = w
        this.canvas.height = h
        this.canvas.style.width = w * zoom + 'px'
        this.canvas.style.height = h * zoom + 'px'
        if (!frame) {
            return
        }
        const [v, horizontal] = this.state.get('relative').split('-')
        const x = horizontal === 'left' ? 0 : horizontal === 'right' ? w - frame.width : Math.floor((w - frame.width) / 2)
        const y = v === 'top' ? 0 : v === 'bottom' ? h - frame.height : Math.floor((h - frame.height) / 2)
        this.canvas.getContext('2d')!.putImageData(frame.toImageData(), x, y)
    }

    private drawStill(): void {
        this.drawFrame(this.player?.playing ? this.player.frame : 0)
    }

    private toggle(): void {
        if (this.player?.playing) {
            this.stop()
        } else if (this.selected) {
            this.player = new AnimationPlayer(this.animations, this.unitMs, Math.random, (event) => {
                if (event === 'stop') {
                    setIcon(this.play, icon(0))
                }
            })
            this.player.play(this.selected)
            setIcon(this.play, icon(1))
            this.drawFrame(this.player.frame)
        }
    }

    private stop(): void {
        this.player?.stop()
        setIcon(this.play, icon(0))
    }

    private restart(): void {
        if (this.player?.playing) {
            this.stop()
            this.toggle()
        }
    }

    private showNames(select?: string): void {
        const current = select ?? this.selected
        this.names.replaceChildren()
        for (const name of Object.keys(this.animations)) {
            const option = el('option', { parent: this.names, text: name })
            option.value = name
        }
        if (current && this.animations[current]) {
            this.names.value = current
        }
        const any = this.names.options.length > 0
        for (const b of [this.play, ...this.others.slice(1)]) {
            b.disabled = !any
        }
        this.showText()
    }

    private showText(): void {
        const entries = this.animations[this.selected]
        this.text.value = entries ? JSON.stringify(entries).slice(1, -1) : ''
        this.error.textContent = ''
        this.restart()
    }

    private changeText(): void {
        if (!this.selected) {
            return
        }
        try {
            const entries = JSON.parse('[' + this.text.value + ']') as AnimationEntry[]
            const bad = entries.find((e) => typeof e === 'number' && (e < 0 || e >= this.sprite.frames.length))
            if (bad !== undefined) {
                throw new Error(`frame ${bad} doesn't exist`)
            }
            this.animations[this.selected] = entries
            this.sprite.changed()
            this.error.textContent = ''
            this.play.disabled = false
            this.restart()
        } catch (e) {
            this.error.textContent = (e as Error).message
            this.play.disabled = true
        }
    }

    private async create(): Promise<void> {
        const name = await prompt('Create Animation', 'name: ')
        if (name) {
            this.animations[name] ??= []
            this.sprite.changed()
            this.showNames(name)
        }
    }

    private async rename(): Promise<void> {
        const old = this.selected
        const name = await prompt('Rename Animation', 'name: ', old)
        if (name && name !== old && !this.animations[name]) {
            this.animations[name] = this.animations[old]
            delete this.animations[old]
            this.sprite.changed()
            this.showNames(name)
        }
    }

    private async duplicate(): Promise<void> {
        const name = await prompt('Duplicate Animation', 'name: ', this.selected + '-copy')
        if (name && !this.animations[name]) {
            this.animations[name] = structuredClone(this.animations[this.selected])
            this.sprite.changed()
            this.showNames(name)
        }
    }

    private async remove(): Promise<void> {
        const name = this.selected
        if (name && (await confirm('Delete Animation?', `Delete the ${name} animation?`, 'Delete'))) {
            delete this.animations[name]
            this.sprite.changed()
            this.showNames()
        }
    }
}
