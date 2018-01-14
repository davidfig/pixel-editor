const exists = require('exists')
const clicked = require('clicked')

const State = require('./state')
const button = require('./button')

const ICONS = require('../images/editor.json')

const BUTTONS = [0, 1, 2, 3, 5, 7, 8, 9]
const TIPS = ['draw', 'select', 'fill', 'circle', 'ellipse', 'line', 'crop', 'dropper']
// PEN, SELECT, PAINT, CIRCLE, ELLIPSE, LINE, CROP, SAMPLE]

const NORMAL_COLOR = '#cfcfcf'
const SELECT_COLOR = '#efefef'

module.exports = class Toolbar
{
    constructor(ui)
    {
        this.ui = ui
        this.buttons = []

        this.win = this.ui.createWindow({ minimizable: false, resizable: false, minWidth: 0 })

        for (let i = 0; i < BUTTONS.length; i++)
        {
            const index = BUTTONS[i]
            const one = button(this.win.content, ICONS.imageData[index], { display: 'block', margin: '0.25em', backgroundColor: NORMAL_COLOR }, TIPS[i])
            clicked(one, () => this.pressed(i))
            this.buttons.push(one)
        }
        this.pressed(0)
        this.buttons[3].image.src = 'data:image/png;base64,' + ICONS.imageData[State.openCircle ? 4 : 3][2]
        this.buttons[4].image.src = 'data:image/png;base64,' + ICONS.imageData[State.openEllipse ? 6 : 5][2]
        this.stateSetup('toolbar')
        this.win.open()
    }

    pressed(index)
    {
        if (this.selected)
        {
            this.selected.style.backgroundColor = NORMAL_COLOR
        }
        this.buttons[index].style.backgroundColor = SELECT_COLOR
        this.selected = this.buttons[index]
        switch (index)
        {
            case 0: State.tool = 'paint' ; break
            case 1: State.tool = 'select'; break
            case 2: State.tool = 'fill'; break
            case 3:
                if (State.tool === 'circle')
                {
                    State.openCircle = !State.openCircle
                }
                else
                {
                    State.tool = 'circle'
                }
                this.buttons[3].image.src = 'data:image/png;base64,' + ICONS.imageData[State.openCircle ? 4 : 3][2]
                break
            case 4:
                if (State.tool === 'ellipse')
                {
                    State.openEllipse = !State.openEllipse
                }
                else
                {
                    State.tool = 'ellipse'
                }
                this.buttons[4].image.src = 'data:image/png;base64,' + ICONS.imageData[State.openEllipse ? 6 : 5][2]
                break
            case 5: State.tool = 'line'; break
            case 6: State.tool = 'crop'; break
            case 7: State.tool = 'sample'; break
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
                    if (State.tool === 'circle')
                    {
                        State.openCircle = !State.openCircle
                    }
                    State.tool = 'circle'
                    break
                case 76:
                    State.tool = 'line'
                    break
                case 70:
                    State.tool = 'fill'
                    break
                case 69:
                    if (State.tool === 'ellipse')
                    {
                        State.openEllipse = !State.openEllipse
                    }
                    State.tool = 'ellipse'
                    break
                case 82:
                    State.tool = 'crop'
                    break
                case 83:
                    State.tool = 'sample'
                    break
            }
        }
    }

    changed()
    {
        let index
        switch (State.tool)
        {
            case 'paint': index = 0; break
            case 'select': index = 1; break
            case 'fill': index = 2; break
            case 'circle': index = 3; break
            case 'ellipse': index = 4; break
            case 'line': index = 5; break
            case 'crop': index = 6; break
            case 'sample': index = 7; break
        }
        if (this.selected)
        {
            this.selected.style.backgroundColor = NORMAL_COLOR
        }
        this.buttons[index].style.backgroundColor = SELECT_COLOR
        this.selected = this.buttons[index]
        this.buttons[3].image.src = 'data:image/png;base64,' + ICONS.imageData[State.openCircle ? 4 : 3][2]
        this.buttons[4].image.src = 'data:image/png;base64,' + ICONS.imageData[State.openEllipse ? 6 : 5][2]
    }

    stateSetup(name)
    {
        this.name = name
        const place = State.get(name)
        if (exists(place))
        {
            this.win.move(place.x, place.y)
        }
        if (State.getHidden(this.name))
        {
            this.win.close()
        }
        this.win.on('move-end', () => State.set(this.name, this.win.x, this.win.y))
        State.on('tool', this.changed, this)
    }
}