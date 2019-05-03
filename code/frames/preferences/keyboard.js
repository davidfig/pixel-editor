const clicked = require('clicked')

const Accelerator = require('../../config/localAccelerator')
const locale = require('../../locale')
const html = require('../../html')
const KeyBinding = require('./keybinding')
const State = require('../../state')
const Menu = require('../../menu')
const Dialog = require('../../dialog')

module.exports = class Keys
{
    constructor(ui)
    {
        this.win = ui.createWindow({ title: locale.get('KeyboardTitle') })
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
        this.keysList = []
        for (let key in State.keys)
        {
            const tr = html({ parent: body, type: 'tr', styles: { cursor: 'pointer', backgroundColor: (other ? 'rgba(255, 255, 255, 0.15)' : '') } })
            html({ parent: tr, type: 'td', html: locale.get(key) })
            const accelerator = html({ parent: tr, type: 'td', html: Accelerator.prettifyKey(State.keys[key]) })
            tr.addEventListener('mouseenter', () => this.mouseenter(tr))
            tr.addEventListener('mouseleave', () => this.mouseleave(tr))
            clicked(tr, () =>
            {
                new KeyBinding(this.win, key, (change) => this.changeKey(key, change, accelerator))
            })
            this.keysList.push({ accelerator, key })
            other = !other
        }
        const buttons = html({ parent: this.keys, styles: { margin: '1em 0', textAlign: 'right' } })
        clicked(html({ parent: buttons, type: 'button', html: locale.get('DefaultKeys'), styles: { color: 'red' } }), () => this.resetDialog())
    }

    resetDialog()
    {
        new Dialog(this.win, locale.get('DefaultKeys'), 'confirmation', locale.get('DefaultKeysPrompt'), (result) => this.reset(result))
    }

    reset(result)
    {
        if (result)
        {
            State.resetKeys()
            for (let key of this.keysList)
            {
                key.accelerator.innerHTML = Accelerator.prettifyKey(State.keys[key.key])
            }
        }
    }

    changeKey(key, change, accelerator)
    {
        if (change)
        {
            accelerator.innerHTML = change
            State.keys[key] = change
            State.save()
            Menu.create()
        }
        else if (change === false)
        {
            accelerator.innerHTML = ''
            State.keys[key] = ''
            State.save()
            Menu.create()
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