import { clicked } from 'clicked'

import { state }  from '../state'
import { button } from '../button'

import ICONS from '../../images/editor.json'

const BUTTONS = 7
const TIPS = [['select mode', 'v'], ['draw mode', 'b'], ['fill mode', 'f'], ['circle mode', 'c'], ['ellipse mode', 'e'], ['line mode', 'l'], ['crop mode', 'm']]

const OPACITY_UNSELECTED = 0.6

export class Toolbar
{
    constructor(ui)
    {
        this.buttons = []

        this.win = ui.createWindow({
            id: 'toolbar',
            closeable: false,
            resizable: false,
            minWidth: 0
        })
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
            case 0: state.tool = 'select'; break
            case 1: state.tool = 'paint' ; break
            case 2: state.tool = 'fill'; break
            case 3: state.tool = 'circle'; break
            case 4: state.tool = 'ellipse'; break
            case 5: state.tool = 'line'; break
            case 6: state.tool = 'crop'; break
        }
    }

    keydown(e)
    {
        if (!e.ctrlKey && !e.shiftKey && !e.altKey)
        {
            switch (e.keyCode)
            {
                case 66:
                    state.tool = 'paint'
                    break
                case 86:
                    state.tool = 'select'
                    break
                case 67:
                    state.tool = 'circle'
                    break
                case 76:
                    state.tool = 'line'
                    break
                case 70:
                    state.tool = 'fill'
                    break
                case 69:
                    state.tool = 'ellipse'
                    break
                case 82:
                    state.tool = 'crop'
                    break
            }
        }
    }

    changed()
    {
        let index
        switch (state.tool)
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
        state.on('tool', this.changed, this)
    }
}