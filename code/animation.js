const PIXI = require('pixi.js')
const RenderSheet = require('yy-rendersheet')
// const Pixel = require('yy-pixel').Pixel
const Pixel = require('../../components/pixel/pixel')
const exists = require('exists')
const Loop = require('yy-loop')

const UI = require('../../components/ui')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Settings = require('./settings')

const MIN_WIDTH = 200
const MIN_HEIGHT = 200

module.exports = class Show extends UI.Window
{
    constructor()
    {
        super({ clickable: true, draggable: true, resizeable: true })
        this.buttons = this.addChild(new PIXI.Container())
        this.pixels = this.addChild(new PIXI.Container())
        this.timeText = this.addChild(new UI.EditText(150, { beforeText: 'time: ', count: 4, edit: 'number' }))
        this.stateSetup('animation')
        this.numbers = [true]
        this.current = 0
        this.time = 0
        this.loop = new Loop({ pauseOnBlur: true })
        this.loop.interval(this.update.bind(this))
    }

    draw()
    {
        this.drawButtons()
        this.drawAnimation()
    }

    measure()
    {
        let width = 0, height = 0
        for (let frame of PixelEditor.frames)
        {
            width = frame.width > width ? frame.width : width
            height = frame.height > height ? frame.height : height
        }
        this.maxHeight = height
        const scaleX = (this.width - Settings.BORDER * 2) / width
        const scaleY = (this.height - Settings.BORDER * 2 - this.maxY - this.timeText.height - Settings.BORDER * 2) / height
        return Math.min(scaleX, scaleY)
    }

    drawAnimation()
    {
        const sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        this.pixels.removeChildren()
        this.pixel = this.pixels.addChild(new Pixel(PixelEditor.getData(), sheet))
        this.pixel.anchor.set(0.5)
        sheet.render()
        const scale = this.measure()
        this.pixel.scale.set(scale * 5)
        this.pixel.frame(0)
        this.pixel.position.set(this.width / 2, this.maxHeight * scale / 2 + Settings.BORDER)
        this.buttons.y = this.pixel.y + this.maxHeight * scale / 2 + Settings.BORDER
        this.timeText.position.set(this.width / 2 - this.timeText.width / 2, this.buttons.y + this.maxY)
    }

    drawButtons()
    {
        this.buttons.removeChildren()
        const pad = 3
        for (let i = 0; i < PixelEditor.frames.length; i++)
        {
            const number = this.buttons.addChild(new UI.Button({ text: i, textOptions: { 'theme': {'font-size': '1.5em' }}, theme: { 'text-padding-left': pad, 'text-padding-right': pad, 'text-padding-top': pad, 'text-padding-bottom': pad } }))
            if (this.numbers[i])
            {
                number.select = true
            }
            number.on('click', () => { number.select = !number.select; this.numbers[i] = number.select })
        }
        const spacing = 5
        this.maxY = 0
        let x = Settings.BORDER, y = Settings.BORDER
        for (let button of this.buttons.children)
        {
            if (x + button.width > this.width - Settings.BORDER)
            {
                x = Settings.BORDER
                y += button.height + Settings.BORDER
            }
            button.position.set(x, y)
            x += button.width + spacing
            button.visible = y + button.height <= this.height - Settings.BORDER
            this.maxY = y + button.height + Settings.BORDER > this.maxY ? y + button.height + Settings.BORDER : this.maxY
        }
        super.draw()
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
        PixelEditor.on('changed', () => this.dirty = true)
        State.on('last-file', () => this.dirty = true)
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
                this.dirtyRenderer = true
            }
        }
    }
}