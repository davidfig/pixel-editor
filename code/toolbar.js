const Settings = require('./settings')

const exists = require('exists')
const PIXI = require('pixi.js')
const RenderSheet = require(Settings.YY_RENDERSHEET)
const Pixel = require(Settings.YY_PIXEL).Pixel
const UI = require(Settings.UI)

const State = require('./state')

const SELECT = require('../images/select.json')
const PEN = require('../images/paint.json')
const PAINT = require('../images/fill.json')
const CIRCLE = require('../images/circle.json')
const ELLIPSE = require('../images/ellipse.json')
const LINE = require('../images/line.json')
const CROP = require('../images/crop.json')
const SAMPLE = require('../images/sample.json')

const BUTTONS = [PEN, SELECT, PAINT, CIRCLE, ELLIPSE, LINE, CROP, SAMPLE]

module.exports = class Toolbar extends UI.Stack
{
    constructor()
    {
        super({ draggable: true, fit: true, transparent: false, theme: { 'title-bar': 10, spacing: 10, between: 5 } })
        this.buttons = []
        this.sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        for (let pixel of BUTTONS)
        {
            Pixel.add(pixel, this.sheet)
        }
        this.visible = false
        this.sheet.render(() => this.afterLoad())
    }

    afterLoad()
    {
        for (let pixel of BUTTONS)
        {
            const sprite = this.sheet.get(pixel.name + '-0')
            sprite.anchor.set(0)
            sprite.scale.set(2)
            const button = this.add(new UI.Button({ sprite }))
            button.on('pressed', this.pressed, this)
            this.buttons.push(button)
        }
        this.buttons[3].sprite.texture = this.sheet.getTexture('circle-' + (State.openCircle ? 1 : 0))
        this.buttons[4].sprite.texture = this.sheet.getTexture('ellipse-' + (State.openEllipse ? 1 : 0))
        this.changed()
        this.stateSetup('toolbar')
    }

    pressed(target)
    {
        for (let button of this.buttons)
        {
            button.select = (button === target)
        }
        switch (target)
        {
            case this.buttons[0]: State.tool = 'paint' ; break
            case this.buttons[1]: State.tool = 'select'; break
            case this.buttons[2]: State.tool = 'fill'; break
            case this.buttons[3]:
                if (State.tool === 'circle')
                {
                    State.openCircle = !State.openCircle
                }
                else
                {
                    State.tool = 'circle'
                }
                this.buttons[3].sprite.texture = this.sheet.getTexture('circle-' + (State.openCircle ? 1 : 0))
                break
            case this.buttons[4]:
                if (State.tool === 'ellipse')
                {
                    State.openEllipse = !State.openEllipse
                }
                else
                {
                    State.tool = 'ellipse'
                }
                this.buttons[4].sprite.texture = this.sheet.getTexture('ellipse-' + (State.openEllipse ? 1 : 0))
                break
            case this.buttons[5]: State.tool = 'line'; break
            case this.buttons[6]: State.tool = 'crop'; break
            case this.buttons[7]: State.tool = 'sample'; break
        }
    }

    keydown(code, special)
    {
        if (!special.ctrl && !special.shift && !special.alt)
        {
            switch (code)
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
                case 83:
                    State.tool = 'sample'
                    break
            }
        }
    }

    stateSetup(name)
    {
        this.name = name
        const place = State.get(name)
        if (exists(place))
        {
            this.position.set(place.x, place.y)
        }
        this.visible = !State.getHidden(this.name)
        this.on('drag-end', this.dragged, this)
        State.on('tool', this.changed, this)
    }

    changed()
    {
        for (let button of this.buttons)
        {
            button.select = false
        }
        switch (State.tool)
        {
            case 'paint': this.buttons[0].select = true; break
            case 'select': this.buttons[1].select = true; break
            case 'fill': this.buttons[2].select = true; break
            case 'circle': this.buttons[3].select = true; break
            case 'ellipse': this.buttons[4].select = true; break
            case 'line': this.buttons[5].select = true; break
            case 'crop': this.buttons[6].select = true; break
            case 'sample': this.buttons[7].select = true; break
        }
        this.dirty = true
    }

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }
}