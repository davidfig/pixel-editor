const clicked = require('clicked')

const State = require('./state')
const button = require('./button')

const ICONS = require('../images/position.json')

const BUTTONS = 5
const TIPS = ['25% of screen size', '50% of screen size', '75% of screen size', 'center in viewport', 'top-left in viewport']

module.exports = class Position
{
    constructor(ui, draw)
    {
        this.ui = ui
        this.draw = draw
        this.buttons = []
        this.win = this.ui.createWindow({ minimizable: false, resizable: false, minHeight: 0 })

        for (let i = 0; i < BUTTONS; i++)
        {
            const one = button(this.win.content, ICONS.imageData[i], null, TIPS[i])
            clicked(one, () => this.pressed(i))
            this.buttons.push(one)
        }
        this.win.open()
        this.stateSetup()
    }

    pressed(index)
    {
        const vp = this.draw.vp
        const landscape = this.draw.width / window.innerWidth > this.draw.height / window.innerHeight
        let center
        switch (index)
        {
            case 0:
                center = vp.center
                if (landscape)
                {
                    vp.fitWidth(window.innerWidth * 3)
                }
                else
                {
                    vp.fitHeight(window.innerHeight * 3)
                }
                vp.center = center
                break
            case 1:
                center = vp.center
                if (landscape)
                {
                    vp.fitWidth(window.innerWidth * 1.5)
                }
                else
                {
                    vp.fitHeight(window.innerHeight * 1.5)
                }
                vp.center = center
                break
            case 2:
                center = vp.center
                if (landscape)
                {
                    vp.fitWidth(window.innerWidth * 1)
                }
                else
                {
                    vp.fitHeight(window.innerHeight * 1)
                }
                vp.center = center
                break
            case 3:
                vp.moveCenter(this.draw.width / 2 / vp.scale.x, this.draw.height / 2 / vp.scale.y)
                break
            case 4:
                vp.moveCorner(0, 0)
                break
        }
        vp.dirty = true
    }

    keydown(e)
    {

    }

    stateSetup()
    {
        this.win.on('move-end', () => State.set())
    }
}