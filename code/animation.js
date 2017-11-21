const PIXI = require('pixi.js')
const RenderSheet = require('yy-rendersheet')
const Pixel = require('yy-pixel').Pixel
const exists = require('exists')
const Loop = require('yy-loop')

const UI = require('../../components/ui')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Settings = require('./settings')

const MIN_WIDTH = 200
const MIN_HEIGHT = 200

const BUTTONS = require('../images/animation.json')

module.exports = class Animation extends UI.Window
{
    constructor()
    {
        super({ draggable: true, resizeable: true })
        this.buttons = this.addChild(new PIXI.Container())
        this.numbers = [true]
        this.current = 0
        this.time = 0
        this.loop = new Loop({ pauseOnBlur: true })
        this.loop.interval(this.update.bind(this))
        this.sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        Pixel.add(BUTTONS, this.sheet)
        this.play = this.addChild(new UI.Button({ sprite: this.sheet.get('animation-1') }))
        this.play.sprite.anchor.set(0)
        this.play.sprite.scale.set(2)
        this.play.on('pressed', this.change, this)
        this.playing = true
        this.animationName = this.addChild(new UI.EditText('Animation Name'))
        this.animationName.on('editing', this.showNames, this)
        this.animationText = this.addChild(new UI.EditText('enter data here...', { full: true }))
        this.sheet.render()
        this.stateSetup('animation')
        this.layout()
    }

    layout()
    {
        this.drawAnimation()
        this.drawPlay()
        super.layout()
    }

    change()
    {
        if (this.playing)
        {
            this.playing = false
            this.play.sprite.texture = this.sheet.getTexture('animation-0')
        }
        else
        {
            this.playing = true
            this.play.sprite.texture = this.sheet.getTexture('animation-1')
        }
        this.dirty = true
    }

    drawAnimation()
    {
        const sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        if (this.pixel)
        {
            this.pixel.destroy()
        }
        this.pixel = this.addChild(new Pixel(PixelEditor.getData(), sheet))
        sheet.render()
        this.pixel.scale.set(PixelEditor.zoom)
        this.pixel.frame(0)
        this.pixel.position.set(0, 0)
    }

    drawPlay()
    {
        this.play.position.set(this.right - this.play.width, 0)
        this.animationName.y = PixelEditor.maxHeight * PixelEditor.zoom + Settings.BORDER
        this.animationText.y = this.animationName.y + this.animationName.height + Settings.BORDER
        this.animationText.width = this.right
        this.animationText.height = this.animationName.height
    }

    showNames()
    {

    }

    stateSetup(name)
    {
        this.name = name
        const place = State.get(this.name)
        if (exists(place))
        {
            this.position.set(place.x, place.y)
            this.width = place.width && place.width > MIN_WIDTH ? place.width : MIN_WIDTH
            this.height = place.height && place.height > MIN_HEIGHT ? place.height : MIN_HEIGHT
        }
        else
        {
            this.width = MIN_WIDTH
            this.height = MIN_HEIGHT
        }
        this.on('drag-end', this.dragged, this)
        this.on('resize-end', this.dragged, this)
        PixelEditor.on('changed', this.layout, this)
        State.on('last-file', this.layout, this)
    }

    dragged()
    {
        State.set(this.name, this.x, this.y, this.width, this.height)
    }

    update(elapsed)
    {
        if (this.pixel)
        {
            if (!this.pixel.stop)
            {
                this.pixel.update(elapsed)
                this.dirty = true
            }
        }
    }
}