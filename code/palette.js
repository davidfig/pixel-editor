const Settings = require('./settings')

const PIXI = require('pixi.js')
const TinyColor = require('tinycolor2')
const exists = require('exists')
const FontSize = require('calc-fontsize')
const Color = require('yy-color')

const PixelEditor = require('./pixel-editor')
const State = require('./state')
const Sheet = require('./sheet')
const PixelSheet = require('./pixel-sheet')

const COLORS_PER_LINE = 10

const MIN_WIDTH = 250
const MIN_HEIGHT = 200
const WIDTH = 10
const SPACING = 5
const SELECTED = 3

module.exports = class Palette extends PIXI.Container
{
    constructor(ui)
    {
        super()
        this.win = ui.createWindow({ height: MIN_HEIGHT, width: MIN_WIDTH })
        this.win.open()

        this.content = this.win.content
        this.content.style.margin = '0 0.25em'
        this.renderer = new PIXI.WebGLRenderer({ resolution: window.devicePixelRatio, transparent: true })
        this.content.appendChild(this.renderer.view)

        this.renderer.view.style.display = 'block'
        this.renderer.view.style.margin = '0 auto'
        this.renderer.view.style.width = '100%'
        this.renderer.view.style.height = '100%'

        this.main = this.addChild(new PIXI.Container())
        this.blocks = this.addChild(new PIXI.Container())
        this.selected = this.addChild(new PIXI.Graphics())
        this.palettes()
        this.stateSetup('palette')

        this.draw()
    }

    palettes()
    {
        this.colors = []
        this.colors[1] = []
        for (let i = 0; i < COLORS_PER_LINE; i++)
        {
            const color = Color.blend((i + 1) / (COLORS_PER_LINE + 2), 0xffffff, 0)
            this.colors[1].push(color.toString(16) + 'ff')
        }
        this.colors[2] = ['ff0000ff', '00ff00ff', '0000ffff', 'ff00ffff', 'ffff00ff', '00ffffff', 'ffaa00ff']
    }

    draw()
    {
        this.selected.clear()
        this.updateColors()
        this.drawBlocks()
        this.renderer.render(this)
    }

    drawBlocks()
    {
        this.main.removeChildren()
        this.blocks.removeChildren()

        const width = (this.content.offsetWidth / WIDTH)// - (Settings.BORDER * 2 / WIDTH)

        const fontSize = FontSize('8', { width, height: width * 0.75 })
        let yStart = Settings.BORDER

        const behindForeground = this.main.addChild(Sheet.get('transparency'))
        behindForeground.anchor.set(0)
        this.foregroundColor = this.main.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        this.foregroundColor.interactive = true
        this.foregroundColor.on('pointertap', () => State.isForeground = true)
        behindForeground.width = behindForeground.height = this.foregroundColor.width = this.foregroundColor.height = width * 2 - SPACING
        behindForeground.y = this.foregroundColor.y = yStart
        this.foregroundColor.tint = parseInt(State.foreground.substr(0, 6), 16)
        this.foregroundColor.alpha = parseInt(State.foreground.substr(6), 16) / 255

        const behindBackground = this.main.addChild(Sheet.get('transparency'))
        behindBackground.anchor.set(0)
        this.backgroundColor = this.main.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        this.backgroundColor.interactive = true
        this.backgroundColor.on('pointertap', () => State.isForeground = false)
        behindBackground.width = behindBackground.height = this.backgroundColor.width = this.backgroundColor.height = width * 2 - SPACING
        this.backgroundColor.position.set(width * 2, yStart)
        behindBackground.position = this.backgroundColor.position
        this.backgroundColor.tint = parseInt(State.background.substr(0, 6), 16)
        this.backgroundColor.alpha = parseInt(State.background.substr(6), 16) / 255

        const choose = State.isForeground ? this.foregroundColor : this.backgroundColor
        this.selected.beginFill((State.color === '000000ff' || State.color.substr(6) === '00') ? 0xffffff : 0)
            .drawRect(choose.x + choose.width / 2 - width / 3 / 2, choose.y + choose.height / 2 - width / 3 / 2, width / 3, width / 3)
            .endFill()

        const colors = ['000000ff', 'ffffffff', '00000000']
        for (let i = 0; i < colors.length; i++)
        {
            const color = colors[i]
            const block = this.blocks.addChild(new PIXI.Sprite(color === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE))
            block.width = block.height = width * 1.25 - SPACING
            block.position.set(width * 5 + i * (width * 1.25) + Settings.BORDER, width / 3 + yStart)
            block.color = color
            block.interactive = true
            block.on('pointertap', () => State.color = block.color)
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
                this.selected.lineStyle(SELECTED, color === '000000ff' ? 0xffffff : 0)
                    .drawRect(block.x - SELECTED / 2, block.y - SELECTED / 2, block.width + SELECTED, block.height + SELECTED)
            }
            const fill = color === '000000ff' ? 'white' : 'black'
            const text = this.blocks.addChild(new PIXI.Text(i + 1, { fontSize, fill, fontFamily: 'consolas' }))
            text.anchor.set(0.5)
            text.position.set(block.x + block.width / 2, block.y + block.height / 2)
        }

        yStart += 20
        let x = 0, y = 2, first = true
        for (let line of this.colors)
        {
            for (let i = 0; i < line.length; i++)
            {
                const behind = this.blocks.addChild(Sheet.get('transparency'))
                behind.anchor.set(0)
                behind.color = line[i]
                const block = this.blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
                block.interactive = true
                block.on('pointertap', () => State.color = behind.color)
                behind.width = behind.height = block.width = block.height = width - SPACING
                block.position.set(SPACING / 2 + x * width, y * width + yStart)
                behind.position = block.position
                block.tint = parseInt(line[i].substr(0, 6), 16)
                block.alpha = parseInt(line[i].substr(6), 16) / 0xff
                if (line[i] === State.color)
                {
                    this.selected.lineStyle(SELECTED, 0)
                        .drawRect(block.x - SELECTED / 2, block.y - SELECTED / 2, block.width + SELECTED, block.height + SELECTED)
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
        function hex(n)
        {
            const hex = n.toString(16)
            return hex.length === 2 ? hex : '0' + hex
        }

        this.colors[0] = []
        for (let i = 0; i < PixelEditor.imageData.length; i++)
        {
            const texture = PixelSheet.textures[PixelEditor.name + '-' + i].texture
            if (texture.baseTexture.hasLoaded)
            {
                const canvas = texture.baseTexture.source
                const frame = texture.frame
                const data = canvas.getContext('2d').getImageData(frame.x, frame.y, frame.width, frame.height).data
                for (let i = 0; i < data.length; i += 4)
                {
                    const color = hex(data[i]) + hex(data[i + 1]) + hex(data[i + 2]) + hex(data[i + 3])
                    if (color !== '00000000' && color !== 'ffffffff' && color !== '000000ff' && !this.findColor(color))
                    {
                        this.colors[0].push(color)
                    }
                }
            }
        }
        const convert = this.convert
        this.colors[0].sort(
            function (a, b)
            {
                const colorA = parseInt(a.substr(0, 6), 16)
                const colorB = parseInt(b.substr(0, 6), 16)
                const hslA = convert(colorA)
                const hslB = convert(colorB)
                return hslA.h < hslB.h ? -1 : hslA.h > hslB.h ? 1 : hslA.l < hslB.l ? -1 : hslA.l > hslB.l - 1 ? hslA.s < hslB.s : hslA.s > hslB.s ? -1 : 0
            })
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
        this.resize()
        if (State.getHidden(this.name))
        {
            this.win.close()
        }
        this.win.on('resize', () => this.resize())
        this.win.on('resize-end', () => State.set(this.name, this.win.x, this.win.y, this.win.width, this.win.height))
        this.win.on('move-end', () => State.set(this.name, this.win.x, this.win.y, this.win.width, this.win.height))
        State.on('foreground', this.draw, this)
        State.on('background', this.draw, this)
        State.on('isForeground', this.draw, this)
        PixelEditor.on('changed', this.draw, this)
    }

    resize()
    {
        this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)
        this.draw()
    }

    keydown(e)
    {
        const code = e.keyCode
        if (!e.ctrlKey && !e.altKey && !e.shiftKey)
        {
            switch (code)
            {
                case 88:
                    State.isForeground = !State.isForeground
                    break
                case 49:
                    State.color = '000000ff'
                    break
                case 50:
                    State.color = 'ffffffff'
                    break
                case 51:
                    State.color = '00000000'
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
                    break
            }
        }
    }
}