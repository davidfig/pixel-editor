const PIXI = require('pixi.js')
const RenderSheet = require('yy-rendersheet')
const Pixel = require('yy-pixel').Pixel
const exists = require('exists')

const PixelEditor = require('./pixel-editor')
const UI = require('../windows/ui')
const State = require('./state')
const Settings = require('./settings')

const MIN_WIDTH = 100
const MIN_HEIGHT = 100

const COLOR_SELECTED = 0x888888

module.exports = class Show extends UI.Window
{
    constructor()
    {
        super({ clickable: true, draggable: true, resizeable: true })
        this.stateSetup('show')
        this.pixels = this.addChild(new PIXI.Container())
        this.buttons = []
    }

    measure()
    {
        let width = 0, height = 0
        for (let frame of PixelEditor.frames)
        {
            width += frame.width
            height = frame.height > height ? frame.height : height
        }
        const scaleX = (this.width - Settings.BORDER * 2) / width
        const scaleY = (this.height - Settings.BORDER * 2) / height
        return Math.min(scaleX, scaleY)
    }

    draw()
    {
        const sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        this.pixels.removeChildren()
        this.buttons = []
        const data = PixelEditor.getData()
        const scale = this.measure()
        let xStart = Settings.BORDER, yStart = Settings.BORDER, yEnd = 0
        for (let i = 0; i < PixelEditor.frames.length; i++)
        {
            if (i === PixelEditor.current && PixelEditor.frames.length > 1)
            {
                this.selector = this.pixels.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
                this.selector.tint = COLOR_SELECTED
                this.selector.position.set(xStart, yStart)
                this.selector.width = scale * PixelEditor.width
                this.selector.height = scale * PixelEditor.height
                // _name.innerHTML = i
            }
            const pixel = this.pixels.addChild(new Pixel(data, sheet))
            sheet.render()
            pixel.scale.set(scale)
            pixel.frame(i)
            pixel.current = i
            pixel.position.set(xStart, yStart)
            // const n = this.pixels.addChild(new PIXI.Text(i, { fontFamily: 'bitmap', fontSize: '20px', fill: 0 }))
            // n.anchor.set(0, 1)
            // n.position.set(xStart, yStart + State.pixels * PixelEditor.height)
            yEnd = pixel.height > yEnd ? pixel.height : yEnd
            this.buttons.push({ pixel, x1: xStart, y1: yStart - Settings.BORDER, x2: xStart + pixel.width, y2: yStart + pixel.height + Settings.BORDER, current: i })
            xStart += pixel.width
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

    down(e)
    {
        const point = this.toLocal(e.data.global)
        for (let button of this.buttons)
        {
            if (point.x >= button.x1 && point.x <= button.x2 && point.y >= button.y1 && point.y <= button.y2)
            {
                if (PixelEditor.current !== button.current)
                {
                    PixelEditor.current = button.current
                    // _name.innerHTML = button.current
                    this.dirty = true
                }
                const pixel = this.buttons[button.current].pixel
                this.dragging = { pixel, current: button.current, x: point.x, y: point.y, originalX: pixel.x, originalY: pixel.y }
                return
            }
        }
        super.down(e)
    }

    move(e)
    {
        if (this.dragging)
        {
            const point = this.toLocal(e.data.global)
            const width = 10
            this.dragging.pixel.x = this.dragging.originalX + (point.x - this.dragging.x)
            this.dragging.pixel.y = this.dragging.originalY + (point.y - this.dragging.y)
            let found = false
            for (let button of this.buttons)
            {
                if (point.x < (button.x1 + button.x2) / 2)
                {
                    if (button.current === this.dragging.current || button.current - 1 === this.dragging.current)
                    {
                        this.selector.x = this.dragging.originalX
                        this.selector.width = this.dragging.pixel.width
                        this.dragging.drop = this.dragging.current
                    }
                    else
                    {
                        this.selector.x = button.x1 - width / 2
                        this.selector.width = width
                        this.dragging.drop = button.current
                    }
                    found = true
                    break
                }
            }
            if (!found)
            {
                if (this.dragging.current === this.buttons.length - 1)
                {
                    this.selector.x = this.dragging.originalX
                    this.selector.width = this.dragging.pixel.width
                    this.dragging.drop = this.dragging.current
                }
                else
                {
                    this.selector.x = this.buttons[this.buttons.length - 1].x2
                    this.selector.width = width
                    this.dragging.drop = this.buttons.length
                }
            }
            this.dirtyRenderer = true
        }
        else
        {
            super.move(e)
        }
    }

    up(e)
    {
        if (this.dragging)
        {
            if (this.dragging.drop)
            {
                if (this.dragging.drop !== this.dragging.current)
                {
                    PixelEditor.move(this.dragging.current, this.dragging.drop)
                }
            }
            this.dragging = null
            this.dirty = true
        }
        else
        {
            super.move(e)
        }
    }
}