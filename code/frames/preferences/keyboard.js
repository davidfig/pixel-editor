const clicked = require('clicked')

const Accelerator = require('../../config/localAccelerator')
const locale = require('../../locale')
const html = require('../../html')
const KeyBinding = require('./keybinding')
const State = require('../../state')

module.exports = class Keys
{
    constructor(ui)
    {
        this.win = ui.createWindow({ title: locale.get('TitleKeys') })
        this.content = this.win.content
        this.content.style.padding = '0em 1em 0.5em'
        this.content.style.color = '#eeeeee'
        this.setup()
        this.win.open()
        this.win.center()
    }

    setup()
    {
        this.keys = html({ parent: this.win.content, styles: { margin: '0 0.25em', display: 'flex', flexDirection: 'column' } })
        const table = html({ parent: this.keys, type: 'table', styles: { margin: '0 auto' } })
        html({ parent: table, type: 'thead', html: '<tr><th>' + locale.get('Command') + '</th><th>' + locale.get('Keybinding') + '</th></tr>' })
        const body = html({ parent: table, type: 'tbody' })
        let other = true
        for (let key in State.keys)
        {
            const tr = html({ parent: body, type: 'tr', styles: { cursor: 'pointer', backgroundColor: (other ? 'rgba(255, 255, 255, 0.15)' : '') } })
            html({ parent: tr, type: 'td', html: locale.get(key) })
            const accelerator = html({ parent: tr, type: 'td', html: Accelerator.prettifyKey(State.keys[key]) })
            tr.addEventListener('mouseenter', () => this.mouseenter(tr))
            tr.addEventListener('mouseleave', () => this.mouseleave(tr))
            clicked(tr, () =>
            {
                new KeyBinding(this.win.content.win, key, (change) => this.changeKey(key, change, accelerator))
            })
            other = !other
        }
        const buttons = html({ parent: this.keys, styles: { margin: '1em 0', textAlign: 'right' } })
        clicked(html({ parent: buttons, type: 'button', html: locale.get('DefaultKeys') }), () => State.resetKeys())
    }

    changeKey(key, change, accelerator)
    {
        if (change)
        {
            accelerator.innerHTML = change
            State.keys[key] = change
            State.save()
        }
    }

    mouseenter(tr)
    {
        tr.original = tr.style.backgroundColor
        tr.style.backgroundColor = 'white'
        tr.style.color = 'black'
    }

    mouseleave(tr)
    {
        tr.style.backgroundColor = tr.original
        tr.style.color = ''
    }
}