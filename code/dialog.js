import { clicked } from 'clicked'
import { html } from './html'

export class Dialog {
    constructor(win, title, type, label, callback, options) {
        options = options || {}
        options.ok = options.ok || 'OK'
        options.cancel = options.cancel || 'Cancel'
        options.okColor = options.okColor || 'black'

        this.callback = callback
        this.win = win.wm.createWindow({ title, parent: win, modal: true, resizable: false, maximizable: false, minimizable: false, minHeight: 0 })
        this.win.content.style.color = '#eeeeee'
        const div = html({ parent: this.win.content, styles: { display: 'flex', justifyContent: 'center', margin: '1em' } })
        if (type === 'string') {
            html({ parent: div, type: 'label', html: label })
            this.input = html({ parent: div, type: 'input' })
            if (options.original) {
                this.input.value = options.original
            }
            this.captureKey(this.input)
        }
        else if (type === 'confirmation') {
            html({ parent: div, html: label })
        }
        this.type = type

        const buttons = html({ parent: this.win.content, styles: { width: '100%', display: 'flex', justifyContent: 'center', margin: '0.25em' } })
        const OK = html({ parent: buttons, type: 'button', html: options.ok, styles: { width: '6em', display: 'block', margin: '0.25em', color: options.okColor } })
        clicked(OK, () => this.OK())
        const Cancel = html({ parent: buttons, type: 'button', html: options.cancel, styles: { width: '6em', display: 'block', margin: '0.25em' } })
        clicked(Cancel, () => this.cancel())

        this.win.open()
        this.win.center(win)
        if (this.input) {
            this.input.focus()
            if (options.original) {
                this.input.select()
            }
        }
    }

    OK() {
        this.win.close()
        switch (this.type) {
            case 'string':
                this.callback(this.input.value)
                break

            case 'confirmation':
                this.callback(true)
                break
        }
    }

    cancel() {
        this.win.close()
        this.callback()
    }

    captureKey(div) {
        div.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                this.OK()
            }
            e.stopPropagation()
        })
        div.addEventListener('keyup', (e) => e.stopPropagation())
    }
}