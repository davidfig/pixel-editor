const PIXI = require('pixi.js')
const TinyColor = require('tinycolor2')
const exists = require('exists')
const FontSize = require('calc-fontsize')
const Color = require('yy-color')

const UI = require('yy-ui')
const PixelEditor = require('./pixel-editor')
const State = require('./state')
const Sheet = require('./sheet')
const Settings = require('./settings')

const COLORS_PER_LINE = 10

const MIN_WIDTH = 250
const MIN_HEIGHT = 200
const WIDTH = 10
const SPACING = 5

module.exports = class Palette extends UI.Window
{
    constructor()
    {
        super({ draggable: true, resizeable: true, width: 100, height: 100 })
        this.main = this.addChild(new PIXI.Container())
        this.blocks = this.addChild(new PIXI.Container())
        this.palettes()
        this.stateSetup('palette')
    }

    palettes()
    {
        this.colors = []
        this.colors[1] = []
        for (let i = 0; i < COLORS_PER_LINE; i++)
        {
            const color = Color.blend((i + 1) / (COLORS_PER_LINE + 2), 0xffffff, 0)
            this.colors[1].push(color.toString(16) + '0xff')
        }
        this.colors[2] = ['ff0000ff', '00ff00ff', '0000ffff', 'ff00ffff', 'ffff00ff', '00ffffff', 'ffaa00ff']
    }

    draw()
    {
        this.updateColors()
        this.drawBlocks()
    }

    layout()
    {
        super.layout()
        this.draw()
    }

    drawBlocks()
    {
        this.main.removeChildren()
        this.blocks.removeChildren()

        const width = ((this.width - this.get('spacing')) / WIDTH) - (Settings.BORDER * 2 / WIDTH)
        const fontSize = FontSize('8', { width, height: width * 0.75 })
        let yStart = Settings.BORDER

        this.foregroundColor = this.main.addChild(new PIXI.Sprite(State.foreground === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE))
        this.foregroundColor.width = this.foregroundColor.height = width * 2 - SPACING
        this.foregroundColor.position.set(0, yStart)
        if (State.foreground !== null)
        {
            this.foregroundColor.tint = parseInt(State.foreground.substr(0, 6), 16)
        }
        this.backgroundColor = this.main.addChild(new PIXI.Sprite(State.background === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE))
        this.backgroundColor.width = this.backgroundColor.height = width * 2 - SPACING
        this.backgroundColor.position.set(width * 2, yStart)
        if (State.background !== null)
        {
            this.backgroundColor.tint = parseInt(State.background.substr(0, 6), 16)
        }
        const block = this.blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        block.anchor.set(0.5)
        block.width = block.height = width / 3
        const choose = State.isForeground ? this.foregroundColor : this.backgroundColor
        block.position.set(choose.x + choose.width / 2, this.foregroundColor.y + this.foregroundColor.height / 2)
        this.activeColor = block
        if (State.color === 0 || State.color === null)
        {
            this.activeColor.tint = 0xffffff
        }
        else
        {
            this.activeColor.tint = 0
        }

        const colors = ['000000ff', 'ffffffff', '00000000']
        for (let i = 0; i < colors.length; i++)
        {
            const color = colors[i]
            const block = this.blocks.addChild(new PIXI.Sprite(color === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE))
            block.width = block.height = width * 1.25 - SPACING
            block.position.set(width * 5 + i * (width * 1.25) + Settings.BORDER, width / 3 + yStart)
            if (color !== '00000000')
            {
                block.texture = PIXI.Texture.WHITE
                block.tint = parseInt(color.substr(0, 6), 16)
            }
            else
            {
                block.texture = Sheet.getTexture('transparency')
                block.isTransparent = true
            }
            if (color === State.color)
            {
                const extra = new PIXI.Sprite(PIXI.Texture.WHITE)
                this.blocks.addChildAt(extra, this.blocks.children.indexOf(block))
                extra.tint = color === 0 ? 0xffffff : 0
                extra.width = extra.height = block.width + SPACING
                extra.position.set(block.x - SPACING * 0.5, block.y - SPACING * 0.5)
            }
            const fill = color === '000000ff' ? 'white' : 'black'
            const text = this.blocks.addChild(new PIXI.Text(i + 1, { fontSize, fill }))
            text.anchor.set(0.5)
            text.position.set(block.x + block.width / 2, block.y + block.height / 2)
        }

        yStart += 20
        let x = 0, y = 2, first = true
        for (let line of this.colors)
        {
            for (let i = 0; i < line.length; i++)
            {
                const block = this.blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
                block.width = block.height = width - SPACING
                block.position.set(SPACING / 2 + x * width, y * width + yStart)
                block.tint = parseInt(line[i].substr(0, 6), 16)
                if (line[i] === State.color)
                {
                    const extra = new PIXI.Sprite(PIXI.Texture.WHITE)
                    this.blocks.addChildAt(extra, this.blocks.children.indexOf(block))
                    extra.tint = 0
                    extra.width = extra.height = block.width + SPACING * 1
                    extra.position.set(block.x - SPACING * 0.5, block.y - SPACING * 0.5)
                }
                if (first && i <= 10 - 4)
                {
                    const fill = line[i] !== 0 ? 'white' : 'black'
                    const text = this.blocks.addChild(new PIXI.Text(i !== 10 - 4? i + 4 : 0, { fontSize, fill }))
                    text.anchor.set(0.5)
                    text.position.set(block.x + block.width / 2, block.y + block.height / 2)
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

    findColor(color)
    {
        for (let find of this.colors[0])
        {
            if (find === color)
            {
                return true
            }
        }
    }

    updateColors()
    {
        this.colors[0] = []
console.log('...not working'); return
        for (let frame of PixelEditor.imageData)
        {
            for (let color of frame.data)
            {
                if (color !== null && color !== 0xffffff && color !== 0 && !this.findColor(color))
                {
                    this.colors[0].push(color)
                }
            }
        }
        const convert = this.convert
        this.colors[0].sort(
            function (a, b)
            {
                const hslA = convert(a)
                const hslB = convert(b)
                return hslA.h < hslB.h ? -1 : hslA.h > hslB.h ? 1 : hslA.l < hslB.l ? -1 : hslA.l > hslB.l - 1 ? hslA.s < hslB.s : hslA.s > hslB.s ? -1 : 0
            })
    }


    down(x, y, data)
    {
        const point = {x, y}
        if (this.foregroundColor.containsPoint(point) && !State.isForeground)
        {
            State.isForeground = true
            this.layout()
            return true
        }
        if (this.backgroundColor.containsPoint(point) && State.isForeground)
        {
            State.isForeground = false
            this.layout()
            return true
        }
        for (let block of this.blocks.children)
        {
            if (block.containsPoint(point))
            {
                State.color = (block.isTransparent) ? null : block.tint
                this.layout()
                return true
            }
        }
        super.down(x, y, data)
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
        State.on('foreground', this.draw, this)
        State.on('background', this.draw, this)
        State.on('isForeground', this.draw, this)
        PixelEditor.on('changed', this.draw, this)
    }

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }

    keydown(code, special)
    {
        if (!special.ctrl && !special.alt && !special.shift)
        {
            switch (code)
            {
                case 88:
                    State.isForeground = !State.isForeground
                    this.dirty = true
                    break
                case 49:
                    State.color = 0
                    this.dirty = true
                    break
                case 50:
                    State.color = 0xffffff
                    break
                case 51:
                    State.color = null
                    break
                case 52: case 53: case 54: case 55: case 56: case 57: case 58:
                    if (exists(this.colors[0][code - 52]))
                    {
                        State.color = this.colors[0][code - 52]
                    }
                    break
                case 48:
                    if (exists(this.colors[0][10 - 4]))
                    {
                        State.color = this.colors[0][10 - 4]
                    }
            }
        }
    }
}