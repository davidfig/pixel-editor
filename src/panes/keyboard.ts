import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { fromEvent, label } from '../keys'
import { confirm, custom } from '../ui/dialog'
import { el } from '../ui/dom'
import { Pane } from './pane'
import TEXT from '../../data/text/en-us.json'

const text = TEXT as Record<string, string>

/** Key bindings: click a row to record a new key; the button resets them all. */
export class Keyboard extends Pane {
    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'keyboard', { title: 'Keyboard', width: 400, height: 400 })
        this.state.on('keys', () => this.render())
        this.render()
    }

    private render(): void {
        this.content.replaceChildren()
        const table = el('table', { parent: this.content, className: 'keys' })
        const head = el('tr', { parent: el('thead', { parent: table }) })
        el('th', { parent: head, text: 'Command' })
        el('th', { parent: head, text: 'Key' })
        const body = el('tbody', { parent: table })
        const keys = this.state.get('keys')
        for (const name of Object.keys(keys).filter((n) => this.app.commands[n])) {
            const row = el('tr', { parent: body })
            el('td', { parent: row, text: text[name] ?? name.replace(/([a-z])([A-Z0-9])/g, '$1 $2') })
            el('td', { parent: row, text: keys[name] ? keys[name].split('|').map(label).join(', ') : '' })
            row.addEventListener('click', () => this.record(name))
        }
        const reset = el('button', { parent: el('div', { parent: this.content, className: 'buttons right' }), text: 'Reset to defaults', className: 'danger' })
        reset.addEventListener('click', async () => {
            if (await confirm('Reset Keys?', 'Reset every key binding to its default?', 'Reset')) {
                this.state.resetKeys()
            }
        })
    }

    private async record(name: string): Promise<void> {
        let recorded: string | null = null
        const result = await custom(
            text[name] ?? name,
            (body) => {
                el('p', { parent: body, text: 'Press the new key combination.' })
                const shown = el('div', { parent: body, className: 'recorded', text: label(this.state.get('keys')[name] ?? '') || '(none)' })
                body.closest('dialog')!.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab') {
                        return
                    }
                    e.preventDefault()
                    const accel = fromEvent(e)
                    if (accel) {
                        recorded = accel
                        shown.textContent = label(accel)
                    }
                })
            },
            [
                { label: 'Set', value: 'set' },
                { label: 'Clear', value: 'clear' },
                { label: 'Cancel', value: 'cancel' },
            ],
        )
        if (result === 'set' && recorded) {
            this.state.set('keys', { ...this.state.get('keys'), [name]: recorded })
        } else if (result === 'clear') {
            this.state.set('keys', { ...this.state.get('keys'), [name]: '' })
        }
    }
}
