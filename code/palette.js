const PIXI = require('pixi.js')
const TinyColor = require('tinycolor2')
const Color = require('yy-color')
const exists = require('exists')
const FontSize = require('calc-fontsize')
const UI = require('../windows/ui')

const State = require('./state')
const Sheet = require('./sheet')

const COLORS_PER_LINE = 10

const MIN_WIDTH = 250
const MIN_HEIGHT = 200
const BORDER = 5
const WIDTH = 10

module.exports = class Palette extends UI.Window
{
    constructor()
    {
        super({ background: 0xcccccc, clickable: true, draggable: true, resizeable: true, width: 100, height: 100 })
        this.stateSetup('palette')
        this.blocks = this.addChild(new PIXI.Container())
        this.palettes()
        this.resize()
        this.on('click', this.click, this)
        this.on('resizing', this.resize, this)
    }

    palettes()
    {
        this.colors = []
        this.colors[1] = []
        for (let i = 0; i < COLORS_PER_LINE; i++)
        {
            const color = Color.blend((i + 1) / (COLORS_PER_LINE + 2), 0xffffff, 0)
            this.colors[1].push(color)
        }
        this.colors[2] = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff, 0xffaa00]
    }

    resize(resize)
    {
        this.updateColors()
        this.drawBlocks(resize)
        this.dirty = true
    }

    drawBlocks()
    {
        const width = (this.width / WIDTH) - (BORDER / WIDTH)
        this.blocks.removeChildren()

        const fontSize = FontSize('8', { width, height: width * 0.75 })

        let yStart = 30

        this.foregroundColor = this.blocks.addChild(new PIXI.Sprite(State.foreground === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE))
        this.foregroundColor.width = this.foregroundColor.height = width * 2 - BORDER
        this.foregroundColor.position.set(BORDER, BORDER + yStart)
        if (State.foreground !== null)
        {
            this.foregroundColor.tint = State.foreground
        }
        this.backgroundColor = this.blocks.addChild(new PIXI.Sprite(State.background === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE))
        this.backgroundColor.width = this.backgroundColor.height = width * 2 - BORDER
        this.backgroundColor.position.set(BORDER + width * 2, BORDER + yStart)
        if (State.background !== null)
        {
            this.backgroundColor.tint = State.background
        }

        const block = this.blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        block.width = block.height = width / 3
        block.position.set((State.isForeground ? width : width * 2) - block.width / 2 + BORDER / 2, width - block.width / 2 + BORDER / 2 + yStart)
        this.activeColor = block
        this.setActiveColor()

        const colors = [0, 0xffffff, null]
        for (let i = 0; i < colors.length; i++)
        {
            const color = colors[i]
            const block = this.blocks.addChild(new PIXI.Sprite(color === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE))
            block.width = block.height = width * 1.25 - BORDER
            block.position.set(width * 5 + i * (width * 1.25) + BORDER, BORDER + width / 3 + yStart)
            if (color !== null)
            {
                block.tint = color
                const fill = color === 0 ? 'white' : 'black'
                const text = this.blocks.addChild(new PIXI.Text(i + 1, { fontFamily: 'bitmap', fontSize, fill }))
                text.anchor.set(0.5)
                text.position.set(width * 5 + i * (width * 1.25) + BORDER + (width * 1.25) / 2 - BORDER / 2, BORDER + width / 3 + yStart + (width * 1.25) / 2) - BORDER / 2
            }
            else
            {
                block.isTransparent = true
            }
        }

        let x = 0, y = 2, first = true
        for (let line of this.colors)
        {
            for (let i = 0; i < line.length; i++)
            {
                const block = this.blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
                block.width = block.height = width - BORDER
                block.position.set(x * width + BORDER, y * width + BORDER + yStart)
                block.tint = line[i]
                if (first)
                {
                    const fill = line[i] === 0 ? 'white' : 'black'
                    const text = this.blocks.addChild(new PIXI.Text(i !== 9 ? i + 3 : 0, { fontFamily: 'bitmap', fontSize, fill }))
                    text.anchor.set(0.5)
                    text.position.set(x * width + BORDER / 2 + width / 2, y * width + BORDER + width / 2 + yStart)
                }
                x++
                if (x === WIDTH && i !== line.length - 1)
                {
                    y++
                    x = 0
                }
            }
            x = 0
            y++
            first = false
        }
    }

    convert(color)
    {
        let test = color.toString(16)
        while (test.length < 6)
        {
            test = '0' + test
        }
        return TinyColor(test).toHsl()
    }

    updateColors()
    {
        function find(color)
        {
            for (let find of this.colors[0])
            {
                if (find === color)
                {
                    return true
                }
            }
        }

        this.colors[0] = []

        // for (let frame of _pixel.frames)
        // {
        //     for (let color of frame.data)
        //     {
        //         if (color !== null && !find(color))
        //         {
        //             this.colors[0].push(color)
        //         }
        //     }
        // }
        // this.colors[0].sort(
        //     function (a, b)
        //     {
        //         const hslA = this.convert(a)
        //         const hslB = this.convert(b)
        //         return hslA.h < hslB.h ? -1 : hslA.h > hslB.h ? 1 : hslA.l < hslB.l ? -1 : hslA.l > hslB.l - 1 ? hslA.s < hslB.s : hslA.s > hslB.s ? -1 : 0
        //     })
    }


    setActiveColor()
    {
        let color
        if (State.isForeground)
        {
            this.activeColor.x = this.foregroundColor.width / 2 - this.activeColor.width / 2 + BORDER
            color = this.foregroundColor.tint
        }
        else
        {
            this.activeColor.x = this.foregroundColor.width * 1.5 - this.activeColor.width / 2 + BORDER * 2
            color = this.backgroundColor.tint
        }
        if (color === 0)
        {
            this.activeColor.tint = 0xffffff
        }
        else
        {
            this.activeColor.tint = 0
        }
    }

    click(e)
    {
        const point = e.data.global
        if (this.foregroundColor.containsPoint(point) && !State.isForeground)
        {
            State.isForeground = true
            this.setActiveColor()
            this.dirty = true
            return
        }
        if (this.backgroundColor.containsPoint(point) && State.isForeground)
        {
            State.isForeground = false
            this.setActiveColor()
            this.dirty = true
            return
        }
        for (let block of this.blocks.children)
        {
            if (block.containsPoint(point))
            {
                if (State.isForeground)
                {
                    if (block.isTransparent)
                    {
                        this.foregroundColor.tint = 0xffffff
                        this.foregroundColor.texture = Sheet.getTexture('transparency')
                        State.foreground = null
                    }
                    else
                    {
                        this.foregroundColor.tint = block.tint
                        this.foregroundColor.texture = PIXI.Texture.WHITE
                        State.foreground = block.tint
                    }
                }
                else
                {
                    if (block.isTransparent)
                    {
                        this.backgroundColor.tint = 0xffffff
                        this.backgroundColor.texture = Sheet.getTexture('transparency')
                        State.background = null
                    }
                    else
                    {
                        this.backgroundColor.tint = block.tint
                        this.backgroundColor.texture = PIXI.Texture.WHITE
                        State.background = block.tint
                    }
                }
                this.setActiveColor()
                this.dirty = true
                return
            }
        }
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
    }

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }
}

/*

function pixelChange()
{
    _pixel.load()
    updateColors()
    draw()
    View.render()
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special)
}

*/