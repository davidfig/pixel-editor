const Settings = require('./settings')

const exists = require('exists')
const PIXI = require('pixi.js')
const RenderSheet = require(Settings.YY_RENDERSHEET)
const Pixel = require(Settings.YY_PIXEL).Pixel

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

const SPACING = 5
const SELECT_COLOR = 0x888888
const NORMAL_COLOR = 0xeeeeee

module.exports = class Toolbar extends PIXI.Container
{
    constructor(ui)
    {
        super()
        this.ui = ui
        this.buttons = []
        this.sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        for (let pixel of BUTTONS)
        {
            Pixel.add(pixel, this.sheet)
        }
        this.sheet.render(() => this.afterLoad())
    }

    afterLoad()
    {
        this.win = this.ui.createWindow({ resizable: false, minWidth: 0 })
        this.win.open()

        this.content = this.win.content
        this.content.style.margin = '0 0.25em'
        this.renderer = new PIXI.WebGLRenderer({ resolution: window.devicePixelRatio, transparent: true })
        this.content.appendChild(this.renderer.view)

        this.renderer.view.style.width = '100%'
        this.renderer.view.style.height = '100%'
        this.renderer.view.style.display = 'block'
        this.renderer.view.style.margin = '0 auto'

        let y = SPACING
        for (let pixel of BUTTONS)
        {
            const button = this.button(pixel, y)
            y += button.height + SPACING
        }
        this.children[3].sprite.texture = this.sheet.getTexture('circle-' + (State.openCircle ? 1 : 0))
        this.children[4].sprite.texture = this.sheet.getTexture('ellipse-' + (State.openEllipse ? 1 : 0))

        this.win.width = this.width + 6
        this.win.height = this.win.winTitlebar.offsetHeight + y
        this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)

        this.stateSetup('toolbar')
        this.changed()
    }

    button(pixel, y)
    {
        const button = this.addChild(new PIXI.Container())
        button.y = y
        button.background = button.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        button.sprite = button.addChild(this.sheet.get(pixel.name + '-0'))
        button.sprite.anchor.set(0.5)
        button.sprite.scale.set(2)
        button.background.width = button.sprite.width * 1.5
        button.background.height = button.sprite.height * 1.5
        button.sprite.position.set(button.background.width / 2, button.background.height / 2)
        button.interactive = true
        button.on('pointertap', () => this.pressed(button))
        return button
    }

    pressed(target)
    {
        for (let button of this.children)
        {
            button.select = (button === target)
        }
        switch (target)
        {
            case this.children[0]: State.tool = 'paint' ; break
            case this.children[1]: State.tool = 'select'; break
            case this.children[2]: State.tool = 'fill'; break
            case this.children[3]:
                if (State.tool === 'circle')
                {
                    State.openCircle = !State.openCircle
                }
                else
                {
                    State.tool = 'circle'
                }
                this.children[3].sprite.texture = this.sheet.getTexture('circle-' + (State.openCircle ? 1 : 0))
                break
            case this.children[4]:
                if (State.tool === 'ellipse')
                {
                    State.openEllipse = !State.openEllipse
                }
                else
                {
                    State.tool = 'ellipse'
                }
                this.children[4].sprite.texture = this.sheet.getTexture('ellipse-' + (State.openEllipse ? 1 : 0))
                break
            case this.children[5]: State.tool = 'line'; break
            case this.children[6]: State.tool = 'crop'; break
            case this.children[7]: State.tool = 'sample'; break
        }
        this.renderer.render(this)
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
                case 83:
                    State.tool = 'sample'
                    break
            }
        }
    }

    changed()
    {
        for (let button of this.children)
        {
            button.background.tint = NORMAL_COLOR
        }
        switch (State.tool)
        {
            case 'paint': this.children[0].background.tint = SELECT_COLOR; break
            case 'select': this.children[1].background.tint = SELECT_COLOR; break
            case 'fill': this.children[2].background.tint = SELECT_COLOR; break
            case 'circle': this.children[3].background.tint = SELECT_COLOR; break
            case 'ellipse': this.children[4].background.tint = SELECT_COLOR; break
            case 'line': this.children[5].background.tint = SELECT_COLOR; break
            case 'crop': this.children[6].background.tint = SELECT_COLOR; break
            case 'sample': this.children[7].background.tint = SELECT_COLOR; break
        }
        this.renderer.render(this)
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