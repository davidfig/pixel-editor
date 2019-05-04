const PIXI = require('pixi.js')

const libraries = require('../config/libraries')

const Settings = require('../settings')
const sheet = require('../pixel-sheet')
const PixelEditor = require('../pixel-editor')
const State = require('../state')
const locale = require('../locale')

const MIN_WIDTH = 100
const MIN_HEIGHT = 100
const SPACING = 5

const COLOR_SELECTED = 0x888888

module.exports = class Frames extends PIXI.Container
{
    constructor(ui)
    {
        super()
        this.win = ui.createWindow({ title: locale.get('FramesTitle'), minWidth: MIN_WIDTH + 'px', minHeight: MIN_HEIGHT + 'px' })
        this.win.open()
        this.content = this.win.content
        this.renderer = new PIXI.WebGLRenderer({ width: this.win.width, height: this.win.height, resolution: window.devicePixelRatio, transparent: true })
        this.content.appendChild(this.renderer.view)
        this.renderer.view.style.display = 'block'
        this.renderer.view.style.margin = '0 auto'
        this.renderer.view.style.width = '100%'
        this.renderer.view.style.height = '100%'
        this.pixels = this.addChild(new PIXI.Container())
        this.stateSetup()
        this.redraw()
    }

    redraw()
    {
        this.pixels.removeChildren()
        this.selector = this.pixels.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        this.selector.tint = COLOR_SELECTED
        const data = PixelEditor.imageData
        const scale = PixelEditor.zoom
        let x = SPACING, y = SPACING, largest = 0
        for (let i = 0; i < data.length; i++)
        {
            const pixel = this.pixels.addChild(sheet.get(`${PixelEditor.name}-${i}`))
            const width = data[i][0] * scale
            const height = data[i][1] * scale
            pixel.scale.set(scale)
            // pixel.frame(i)
            pixel.current = i
            if (x + width + SPACING > this.win.width)
            {
                x = SPACING
                y += largest + SPACING
                largest = 0
            }
            pixel.position.set(x, y)
            const number = this.pixels.addChild(new PIXI.Text(i, { fill: '#eeeeee', fontSize: '1.5em', fontfamily: 'consolas' }))
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
        this.renderer.view.style.height = this.height + 'px'
        this.renderer.resize(this.win.width, this.height)
        this.renderer.render(this)
        if (this.selector.y < this.content.scrollTop || this.selector.y + this.selector.height > this.content.scrollTop + this.content.offsetHeight)
        {
            this.content.scrollTop = this.selector.y
        }
    }

    down(x, y)
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

    move(x, y)
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

    up()
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

    resize()
    {
        this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)
        this.redraw()
    }

    stateSetup()
    {
        this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)
        this.win.on('resize', () => this.resize())
        PixelEditor.on('changed', () => this.redraw())
        PixelEditor.on('current', () => this.currentChange())
        State.on('last-file', () => this.redraw())
    }
}