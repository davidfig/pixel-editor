const clicked = require('clicked')

const Settings = require('../settings')
const State = require('../state')
const button = require('../button')
const PixelEditor = require('../pixel-editor')

const ICONS = require('../../images/position.json')

const BUTTONS = 5
const TIPS = ['25% of screen size', '50% of screen size', '75% of screen size', 'center in viewport', 'top-left in viewport']

module.exports = class Position
{
    constructor(ui, draw)
    {
        this.ui = ui
        this.draw = draw
        this.buttons = []
        this.win = this.ui.createWindow({ minimizable: false, resizable: false, minHeight: 0, minWidth: 0 })
        this.win.content.style.display = 'flex'
        for (let i = 0; i < BUTTONS; i++)
        {
            const one = button(this.win.content, ICONS.imageData[i], null, TIPS[i])
            one.style.opacity = 0.6
            clicked(one, () => this.pressed(i))
            this.buttons.push(one)
        }
        this.win.open()
    }

    pressed(index)
    {
        switch (index)
        {
            case 0:
                Position.quarterSize(this.draw)
                break
            case 1:
                Position.halfSize(this.draw)
                break
            case 2:
                Position.threeQuarterSize(this.draw)
                break
            case 3:
                Position.center(this.draw)
                break
            case 4:
                Position.corner(this.draw)
                break
        }
    }

    static quarterSize(draw)
    {
        const vp = draw.vp
        const landscape = draw.width / window.innerWidth > draw.height / window.innerHeight
        let center
        const width = PixelEditor.width * Settings.ZOOM
        const height = PixelEditor.height * Settings.ZOOM
        center = vp.center
        if (landscape)
        {
            vp.fitWidth(width * 4)
        }
        else
        {
            vp.fitHeight(height * 4)
        }
        vp.center = center
        vp.dirty = true
    }

    static halfSize(draw)
    {
        const vp = draw.vp
        const landscape = draw.width / window.innerWidth > draw.height / window.innerHeight
        let center
        const width = PixelEditor.width * Settings.ZOOM
        const height = PixelEditor.height * Settings.ZOOM
        center = vp.center
        if (landscape)
        {
            vp.fitWidth(width * 2)
        }
        else
        {
            vp.fitHeight(height * 2)
        }
        vp.center = center
        vp.dirty = true
    }

    static threeQuarterSize(draw)
    {
        const vp = draw.vp
        const landscape = draw.width / window.innerWidth > draw.height / window.innerHeight
        let center
        const width = PixelEditor.width * Settings.ZOOM
        const height = PixelEditor.height * Settings.ZOOM
        center = vp.center
        if (landscape)
        {
            vp.fitWidth(width * 1.25)
        }
        else
        {
            vp.fitHeight(height * 1.25)
        }
        vp.center = center
        vp.dirty = true
    }

    static center(draw)
    {
        const vp = draw.vp
        vp.moveCenter(draw.width / 2 / vp.scale.x, draw.height / 2 / vp.scale.y)
        vp.dirty = true
    }

    static corner(draw)
    {
        const vp = draw.vp
        vp.moveCorner(0, 0)
        vp.dirty = true
    }
}