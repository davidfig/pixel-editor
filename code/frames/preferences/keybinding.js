const clicked = require('clicked').clicked

const Accelerator = require('../../config/localAccelerator')
const locale = require('../../locale')
const html = require('../../html')
const State = require('../../state')

module.exports = class KeyBinding
{
    constructor(win, key, callback)
    {
        this.callback = callback
        this.win = win.wm.createWindow({ noSnap: true, title: locale.get(key), modal: true, resizable: false, closable: false, minimizable: false })
        this.win.win.tabIndex = -1
        this.win.win.style.outline = 'none'
        const content = this.win.content
        content.style.margin = '1em'
        content.style.display = 'flex'
        content.style.flexDirection = 'column'
        content.style.color = 'white'

        html({ parent: content, html: locale.get('DialogKeyBinding'), styles: { marginBottom: '1em', textAlign: 'center' } })
        this.current = html({ parent: content, html: Accelerator.prettifyKey(State.keys[key]), styles: { background: 'rgba(255,255,255,0.15', textAlign: 'center', border: '1px solid white', marginBottom: '1em'} })
        const buttons = html({ parent: content, styles: { display: 'flex', justifyContent: 'space-between' } })
        const setKey = html({ parent: buttons, type: 'button', html: locale.get('SetKey'), styles: { margin: '0 0.5em' } })
        clicked(setKey, () => this.set())
        const clearKey = html({ parent: buttons, type: 'button', html: locale.get('ClearKey'), styles: { color: 'red', margin: '0 0.5em' } })
        clicked(clearKey, () => this.clear())
        this.win.open()
        this.win.center(win)
        this.win.win.focus()
        this.win.win.addEventListener('keydown', (e) => this.keydown(e))
        this.win.win.addEventListener('blur', () => this.win.win.focus())
    }

    keydown(e)
    {
        e.preventDefault()
        e.stopPropagation()
        const disallowed = ['Alt', 'Shift', 'Ctrl', 'Meta', 'Control', 'Cmd', 'Command']
        for (let check of disallowed)
        {
            if (e.code.indexOf(check) !== -1)
            {
                return
            }
        }
        const modifiers = []
        if (e.altKey)
        {
            modifiers.push('alt')
        }
        if (e.ctrlKey)
        {
            modifiers.push('ctrl')
        }
        if (e.metaKey)
        {
            modifiers.push('meta')
        }
        if (e.shiftKey)
        {
            modifiers.push('shift')
        }
        let keyCode = ''
        for (let modifier of modifiers)
        {
            keyCode += modifier + '+'
        }
        let translate = e.code.toLowerCase()
        translate = translate.replace('digit', '')
        translate = translate.replace('key', '')
        keyCode += translate
        this.current.innerHTML = Accelerator.prettifyKey(keyCode)
    }

    set()
    {
        this.win.close()
        this.callback(this.current.innerHTML)
    }

    clear()
    {
        this.win.close()
        this.callback(false)
    }
}