const PIXI = require('pixi.js')
const TinyColor = require('tinycolor2')
const exists = require('exists')

const UI = require('../windows/ui')
const State = require('./state.js')

const MIN_WIDTH = 200
const MIN_HEIGHT = 300
const BORDER = 10
const CONTROL = 5
const WIDTH = 4

module.exports = class Picker extends UI.Window
{
    constructor()
    {
        super({ background: 0xcccccc, clickable: true, draggable: true, resizeable: true })
        this.stateSetup('picker')
        this.graphics = this.addChild(new PIXI.Graphics())
        this.wordsSetup()
        this.resize()
        this.on('resizing', this.resize, this)
    }

    wordsSetup()
    {
        this.colorCurrent = State.isForeground ? State.foreground : State.background
        let color = this.colorCurrent.toString(16)
        while (color.length < 6)
        {
            color = '0' + color
        }
        let test = this.colorCurrent.toString(16)
        while (test.length < 6)
        {
            test = '0' + test
        }
        this.hsl = TinyColor(test).toHsl()
        const rgb = TinyColor({ h: this.hsl.h, s: this.hsl.s, l: this.hsl.l }).toRgb()
        this.hex = this.addChild(new UI.Text('#' + color, { edit: 'hex', maxCount: 7, count: 7 }))
        const style = { edit: 'number', maxCount: 3, count: 3, align: 'right', min: 0, max: 255 }
        this.part = [
            this.addChild(new UI.Text(rgb.r, style)),
            this.addChild(new UI.Text(rgb.g, style)),
            this.addChild(new UI.Text(rgb.b, style))
        ]
        this.part[0].on('changed', this.changeNumbers, this)
        this.part[1].on('changed', this.changeNumbers, this)
        this.part[2].on('changed', this.changeNumbers, this)
    }

    changeNumbers()
    {
        const color = TinyColor({ r: parseInt(this.part[0].text), g: parseInt(this.part[1].text), b: parseInt(this.part[2].text) }).toHex()
        if (State.isForeground)
        {
            State.foreground = color
        }
        else
        {
            State.background = color
        }
    }

    resize()
    {
        this.width = this.width < MIN_WIDTH ? MIN_WIDTH : this.width
        this.height = this.height < MIN_HEIGHT ? MIN_HEIGHT : this.height
        this.size = (this.width / WIDTH) - (WIDTH + 1) * BORDER / WIDTH
        this.boxSize = Math.min(this.size, (this.height / 3))
        this.bottom = this.height - this.hex.height - BORDER * 2 - this.part[0].height
        this.dirty = true
    }

    box(x, percent, reverse)
    {
        const actual = percent * (this.bottom - CONTROL * 2)
        this.graphics.beginFill(reverse ? 0xffffff : 0)
            .drawRect(x, actual, this.size, CONTROL)
            .drawRect(x + this.boxSize - CONTROL, actual, CONTROL, CONTROL * 2)
            .drawRect(x, actual + CONTROL + 1, this.size, CONTROL)
            .drawRect(x, actual, CONTROL, CONTROL * 2)
            .endFill()
    }

    draw()
    {
        this.colorCurrent = State.isForeground ? State.foreground : State.background
        if (this.colorCurrent === null)
        {
            this.colorCurrent = State.transparentColor || 0xdddddd
            this.transparent = true
        }
        else
        {
            this.transparent = false
        }
        this.graphics.clear()
            .beginFill(this.colorCurrent)
            .drawRect(BORDER, BORDER * 2, this.size - BORDER, this.size - BORDER)
            .endFill()

        let y = this.size * 2 + BORDER * 2

        let test = this.colorCurrent.toString(16)
        while (test.length < 6)
        {
            test = '0' + test
        }
        this.hsl = TinyColor(test).toHsl()

        const others = [this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l * 0.9), this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l * 1.1)]
        for (let color of others)
        {
            this.graphics.beginFill(color)
                .drawRect(BORDER, y, this.size - BORDER, this.size - BORDER)
                .endFill()
            y += this.size + BORDER
        }

        for (let y = BORDER; y <= this.bottom - BORDER; y++)
        {
            let percent = (y - BORDER * 2) / this.bottom
            percent = percent > 1 ? 1 : percent

            // h
            this.graphics.beginFill(this.changeColor(percent * 360, this.hsl.s, this.hsl.l))
                .drawRect(BORDER + this.size, y, this.size, 1)
                .endFill()

            // s
            this.graphics.beginFill(this.changeColor(this.hsl.h, percent, this.hsl.l))
                .drawRect(BORDER * 2 + this.size * 2, y, this.size, 1)
                .endFill()

            // l
            this.graphics.beginFill(this.changeColor(this.hsl.h, this.hsl.s, percent))
                .drawRect(BORDER * 3 + this.size * 3, y, this.size, 1)
                .endFill()
        }
        this.box(BORDER + this.size, this.hsl.h / 360, this.hsl.l < 0.5)
        this.box(BORDER * 2 + this.size * 2, this.hsl.s, this.hsl.l < 0.5)
        this.box(BORDER * 3 + this.size * 3, this.hsl.l, this.hsl.l < 0.5)
        let x = this.width / 2 - this.part[0].width / 2
        const spacing = 10
        this.part[0].position.set(x - this.part[0].width - spacing, this.height - BORDER - this.hex.height)
        this.part[1].position.set(x, this.height - BORDER - this.hex.height)
        this.part[2].position.set(x + this.part[1].width + spacing, this.height - BORDER - this.hex.height)
        this.hex.position.set(this.width / 2 - this.hex.width / 2, this.height - BORDER * 2 - this.hex.height - this.part[0].height)
        this.words()
        super.draw()
    }

    words()
    {
        let color = this.colorCurrent.toString(16)
        while (color.length < 6)
        {
            color = '0' + color
        }
        this.hex.text = '#' + color
        const rgb = TinyColor({ h: this.hsl.h, s: this.hsl.s, l: this.hsl.l }).toRgb()
        this.part[0].text = rgb.r
        this.part[1].text = rgb.g
        this.part[2].text = rgb.b
    }

    changeColor(h, s, l)
    {
        return parseInt(TinyColor({ h, s, l }).toHex(), 16)
    }

    down(e, notDown)
    {
        const point = this.toLocal(e.data.global)
        let x = point.x
        let y = point.y

        let percent = y / this.bottom
        percent = percent > 1 ? 1 : percent
        if (x > BORDER && x < BORDER + this.size)
        {
            if (y > this.size * 2 + BORDER * 2 && y < this.size * 3 + BORDER * 2)
            {
                this.hsl.s *= 0.9
            }
            else if (y > this.size * 3 + BORDER * 3 && y < this.size * 4 + BORDER * 3)
            {
                this.hsl.s *= 1.1
            }
            else if (!notDown)
            {
                super.down(e)
                return
            }
        }
        else
        {
            if (y > BORDER - CONTROL && y < this.bottom - CONTROL)
            {
                if (x > BORDER * 2 + this.size && x < BORDER + this.size * 2)
                {
                    this.hsl.h = percent * 360
                }
                else if (x > BORDER * 3 + this.size * 2 && x < BORDER * 3 + this.size * 3)
                {
                    this.hsl.s = percent
                }
                else if (x > BORDER * 4 + this.size * 3 && x < BORDER * 4 + this.size * 4)
                {
                    this.hsl.l = percent
                }
                else if (!notDown)
                {
                    super.down(e)
                    return
                }
            }
            else if (!notDown)
            {
                super.down(e)
                return
            }
        }
        if (this.transparent)
        {
            State.transparentColor = this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l)
        }
        else
        {
            if (State.isForeground)
            {
                State.foreground = this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l)
            }
            else
            {
                State.background = this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l)
            }
        }
        this.dirty = true
        this.isPicker = true
    }

    move(e)
    {
        if (this.isPicker)
        {
            this.down(e, true)
        }
        else
        {
            super.move(e)
        }
    }

    up(e)
    {
        if (this.isPicker)
        {
            this.isPicker = false
        }
        else
        {
            super.up(e)
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
        this.on('drag-end', this.stateSet, this)
        this.on('resize-end', this.stateSet, this)
        State.on('foreground', this.change, this)
        State.on('background', this.change, this)
    }

    change()
    {
        this.draw()
    }

    stateSet()
    {
        State.set(this.name, this.x, this.y, this.width, this.height)
    }
}

// function rgb(value)
// {
//     const rgb = TinyColor({ h: this.hsl.h, s: this.hsl.s, l: this.hsl.l }).toRgb()
//     rgb.r = value.r || rgb.r
//     rgb.g = value.g || rgb.g
//     rgb.b = value.b || rgb.b
//     const color = TinyColor(rgb).toHex()
//     if (State..isForeground)
//     {
//         State..foreground = color
//     }
//     else
//     {
//         State..background = color
//     }
//     this.hsl = null
//     this.dirty = true
// }

// function hex(value)
// {
//     const color = parseInt(value, 16)
//     if (State.isForeground)
//     {
//         State.foreground = color
//     }
//     else
//     {
//         State..background = color
//     }
//     ipcRenderer.send('state')
//     this.hsl = null
//     draw()
//     View.render()
// }