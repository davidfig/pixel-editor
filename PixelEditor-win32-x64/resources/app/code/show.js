const Settings = require('./settings')

const PIXI = require('pixi.js')
const Pixel = require(Settings.YY_PIXEL).Pixel
const exists = require('exists')

const sheet = require('./pixel-sheet')
const PixelEditor = require('./pixel-editor')
const State = require('./state')

const MIN_WIDTH = 100
const MIN_HEIGHT = 100
const MAX_SCALE = 10
const SCALE_DECREASE = -0.1
const SPACING = 5

const COLOR_SELECTED = 0x888888

module.exports = class Show extends PIXI.Container
{
    constructor(ui)
    {
        super()
        this.win = ui.createWindow({ height: MIN_HEIGHT, width: MIN_WIDTH })
        this.win.open()

        this.content = this.win.content
        // this.content.style.margin = '0 0.25em'
        this.renderer = new PIXI.WebGLRenderer({ width: this.win.width, height: this.win.height, resolution: window.devicePixelRatio, transparent: true })
        this.content.appendChild(this.renderer.view)
        this.renderer.view.style.display = 'block'
        this.renderer.view.style.margin = '0 auto'
        this.renderer.view.style.width = '100%'
        this.renderer.view.style.height = '100%'

        this.pixels = this.addChild(new PIXI.Container())
        // this.buttons = []
        this.stateSetup('show')
        this.redraw()
    }

    measure()
    {
        let scale = MAX_SCALE, x, y, largest
        const windowWidth = this.win.width
        const windowHeight = this.win.height - this.win.winTitlebar.offsetHeight
        const data = PixelEditor.imageData
        do
        {
            largest = 0, x = SPACING, y = SPACING
            for (let i = 0; i < data.length; i++)
            {
                const width = data[i][0] * scale
                const height = data[i][1] * scale
                if (x + width + SPACING > windowWidth)
                {
                    x = SPACING
                    y += largest + SPACING
                    largest = 0
                }
                x += width + SPACING
                largest = height > largest ? height : largest
            }
            scale += SCALE_DECREASE
        }
        while (scale > 0.1 && y + largest + SPACING > windowHeight)
        this.scaler = scale
    }

    redraw()
    {
        this.measure()
        this.pixels.removeChildren()
        this.selector = this.pixels.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        this.selector.tint = COLOR_SELECTED
        const data = PixelEditor.imageData
        const scale = this.scaler
        let x = SPACING, y = SPACING, largest = 0
        for (let i = 0; i < data.length; i++)
        {
            const pixel = this.pixels.addChild(new Pixel(PixelEditor, sheet))
            const width = data[i][0] * scale
            const height = data[i][1] * scale
            pixel.scale.set(scale)
            pixel.frame(i)
            pixel.current = i
            if (x + width + SPACING > this.win.width)
            {
                x = SPACING
                y += largest + SPACING
                largest = 0
            }
            pixel.position.set(x, y)
            const number = this.pixels.addChild(new PIXI.Text(i, { fontSize: '1.5em', fontfamily: 'consolas' }))
            number.position.set(x + width / 2 - number.width / 2, y + height + SPACING)
            number.position.set(x + width - number.width, y)
            number.alpha = 0.25
            pixel.interactive = true
            pixel.on('pointertap', () =>
            {
                if (PixelEditor.current !== pixel.current)
                {
                    PixelEditor.current = pixel.current
                    this.selector.position.set(pixel.x, pixel.y)
                    this.selector.width = pixel.width
                    this.selector.height = pixel.height
                }
            })
            x += width + SPACING
            largest = height > largest ? pixel.height : largest
        }
        this.currentChange()
    }

    currentChange()
    {
        const target = this.pixels.children[1 + PixelEditor.current * 2]
        this.selector.position.set(target.x - Settings.BORDER / 2, target.y - Settings.BORDER / 2)
        this.selector.width = target.width + Settings.BORDER
        this.selector.height = target.height + Settings.BORDER
        this.renderer.render(this)
    }

    down(x, y, data)
    {
        const point = this.toLocal({ x, y })
        for (let button of this.buttons)
        {
            if (point.x >= button.x1 && point.x <= button.x2 && point.y >= button.y1 && point.y <= button.y2)
            {
                if (PixelEditor.current !== button.current)
                {
                    PixelEditor.current = button.current
                    this.selector.position.set(button.x, button.y)
                    this.selector.width = button.width
                    this.selector.height = button.height
                }
                const pixel = this.buttons[button.current].pixel
                this.dragging = { pixel, current: button.current, x: point.x, y: point.y, originalX: pixel.x, originalY: pixel.y }
                return true
            }
        }
    }

    move(x, y, data)
    {
        if (this.dragging)
        {
            const point = this.toLocal({x, y})
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
            this.renderer.render(this)
        }
    }

    up(x, y, data)
    {
        if (this.dragging)
        {
            // if (this.dragging.drop)
            // {
            //     if (this.dragging.drop !== this.dragging.current)
            //     {
            //         PixelEditor.move(this.dragging.current, this.dragging.drop)
            //     }
            // }
            this.dragging = null
            this.redraw()
        }
    }

    keydown(e)
    {
        const code = e.keyCode
        if (e.ctrlKey)
        {
            if (code === 37)
            {
                if (PixelEditor.current === 0)
                {
                    PixelEditor.current = PixelEditor.imageData.length - 1
                }
                else
                {
                    PixelEditor.current--
                }
            }
            else if (code === 39)
            {
                if (PixelEditor.current === PixelEditor.imageData.length - 1)
                {
                    PixelEditor.current = 0
                }
                else
                {
                    PixelEditor.current++
                }
            }
        }
    }

    stateSetup(name)
    {
        this.name = name
        const place = State.get(this.name)
        if (exists(place))
        {
            this.win.move(place.x, place.y)
            this.win.width = place.width && place.width > MIN_WIDTH ? place.width : MIN_WIDTH
            this.win.height = place.height && place.height > MIN_HEIGHT ? place.height : MIN_HEIGHT
        }
        else
        {
            this.win.width = MIN_WIDTH
            this.win.height = MIN_HEIGHT
        }
        this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)
        if (State.getHidden(this.name))
        {
            this.win.close()
        }
        this.win.on('resize', () =>
        {
            this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)
            this.redraw()
        })
        this.win.on('resize-end', () => State.set(this.name, this.win.x, this.win.y, this.win.width, this.win.height))
        this.win.on('move-end', () => State.set(this.name, this.win.x, this.win.y, this.win.width, this.win.height))
        PixelEditor.on('changed', this.redraw, this)
        PixelEditor.on('current', this.currentChange, this)
        State.on('last-file', this.redraw, this)
    }
}