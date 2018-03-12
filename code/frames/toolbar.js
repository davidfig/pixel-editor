const clicked = require('clicked')

const State = require('../state')
const button = require('../button')

const ICONS = require('../../images/editor.json')

const BUTTONS = 7
const TIPS = [['select mode', 'v'], ['draw mode', 'b'], ['fill mode', 'f'], ['circle mode', 'c'], ['ellipse mode', 'e'], ['line mode', 'l'], ['crop mode', 'm']]

const OPACITY_UNSELECTED = 0.6

module.exports = class Toolbar
{
    constructor(ui)
    {
        this.ui = ui
        this.buttons = []

        this.win = this.ui.createWindow({ minimizable: false, resizable: false, minWidth: 0 })
        this.win.winTitlebar.childNodes[0].style.padding = 0

        for (let i = 0; i < BUTTONS; i++)
        {
            const one = button(this.win.content, ICONS.imageData[i], { opacity: OPACITY_UNSELECTED, display: 'block' }, TIPS[i])
            clicked(one, () => this.pressed(i))
            this.buttons.push(one)
        }
        this.changed()
        this.stateSetup()
        this.win.open()
    }

    pressed(index)
    {
        if (this.selected)
        {
            this.selected.style.opacity = OPACITY_UNSELECTED
        }
        this.buttons[index].style.opacity = 1
        this.selected = this.buttons[index]
        switch (index)
        {
            case 0: State.tool = 'select'; break
            case 1: State.tool = 'paint' ; break
            case 2: State.tool = 'fill'; break
            case 3: State.tool = 'circle'; break
            case 4: State.tool = 'ellipse'; break
            case 5: State.tool = 'line'; break
            case 6: State.tool = 'crop'; break
        }
    }

    keydown(e)
    {
        if (!e.ctrlKey && !e.shiftKey && !e.altKey)
        {
            switch (e.keyCode)
            {
                case 66:
                    State.tool = 'paint'
                    break
                case 86:
                    State.tool = 'select'
                    break
                case 67:
                    State.tool = 'circle'
                    break
                case 76:
                    State.tool = 'line'
                    break
                case 70:
                    State.tool = 'fill'
                    break
                case 69:
                    State.tool = 'ellipse'
                    break
                case 82:
                    State.tool = 'crop'
                    break
            }
        }
    }

    changed()
    {
        let index
        switch (State.tool)
        {
            case 'paint': index = 1; break
            case 'fill': index = 2; break
            case 'circle': index = 3; break
            case 'ellipse': index = 4; break
            case 'line': index = 5; break
            case 'crop': index = 6; break
            default:
                index = 0
        }
        if (this.selected)
        {
            this.selected.style.opacity = OPACITY_UNSELECTED
        }
        this.buttons[index].style.opacity = 1
        this.selected = this.buttons[index]
    }

    stateSetup()
    {
        State.on('tool', this.changed, this)
    }
}