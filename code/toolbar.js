const exists = require('exists')
const Input = require('yy-input')
const PIXI = require('pixi.js')
const RenderSheet = require('yy-rendersheet')
const Pixel = require('yy-pixel').Pixel
const Settings = require('./settings')
const UI = require('../windows/UI')
const State = require('./state')
let Main

const SELECT = require('../images/select.json')
const PEN = require('../images/paint.json')
const PAINT = require('../images/fill.json')
const CIRCLE = require('../images/circle.json')
const ELLIPSE = require('../images/ellipse.json')
const LINE = require('../images/line.json')

const BUTTONS = [SELECT, PEN, PAINT, CIRCLE, ELLIPSE, LINE]

module.exports = class Toolbar extends UI.Stack
{
    constructor()
    {
        Main = require('./main')
        super({ draggable: true, transparent: false, theme: { spacing: Settings.BORDER } })
        this.addChild(new UI.Spacer())
        this.buttons = []
        this.sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        for (let pixel of BUTTONS)
        {
            Pixel.add(pixel, this.sheet)
            const button = this.addChild(new UI.Button({ picture: this.sheet.getTexture(pixel.name + '-0'), pictureOptions: { scale: 2 } }))
            button.on('pressed', this.pressed, this)
            this.buttons.push(button)
        }
        this.sheet.render()
        this.buttons[0].select = true
        this.stateSetup('toolbar')
        this.input = new Input({ noPointers: true })
        this.input.on('keydown', this.keydown, this)
    }

    pressed(target)
    {
        for (let button of this.buttons)
        {
            button.select = (button === target)
        }
    }

    keydown(code, special)
    {
        if (Main.isEditing()) return
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
        this.on('drag-end', this.dragged, this)
        State.on('tool', () => this.dirty = true)
    }

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }
}