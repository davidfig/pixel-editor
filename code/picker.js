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
        this.hex = this.addChild(new UI.Text('#ffffff', { edit: 'hex', maxCount: 7  }))
        this.resize()
        this.on('resizing', this.resize, this)
    }

    resize()
    {
        this.width = this.width < MIN_WIDTH ? MIN_WIDTH : this.width
        this.height = this.height < MIN_HEIGHT ? MIN_HEIGHT : this.height
        this.size = (this.width / WIDTH) - (WIDTH + 1) * BORDER / WIDTH
        this.boxSize = Math.min(this.size, (this.height / 3))
        this.bottom = this.height - BORDER
        this.draw()
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
        super.draw()
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
        this.hsl = this.hsl || TinyColor(test).toHsl()

        const others = [this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l * 0.9), this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l * 1.1)]
        for (let color of others)
        {
            this.graphics.beginFill(color)
                .drawRect(BORDER, y, this.size - BORDER, this.size - BORDER)
                .endFill()
            y += this.size + BORDER
        }

        for (let y = BORDER * 2; y <= this.bottom - BORDER; y++)
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
        this.dirty = true
        // words()
    }


    showColor(color)
    {
        color = color.toString(16)
        while (color.length < 6)
        {
            color = '0' + color
        }
        return color
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
            }
            return
        }
        else if (x > BORDER * 2 + this.size && x < BORDER + this.size * 2)
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
        // if (this.transparent)
        // {
        //     Sheet.transparent = State..transparentColor = this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l)
        //     ipcRenderer.send('state')
        //     draw()
        // }
        // else
        // {
        //     if (State..isForeground)
        //     {
        //         State..foreground = this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l)
        //     }
        //     else
        //     {
        //         State..background = this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l)
        //     }
        // }
        this.draw()
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
    }

    stateSet()
    {
        State.set(this.name, this.x, this.y, this.width, this.height)
    }
}

//     this.canvas = document.getElementById('canvas')
//     this.spacer = document.getElementById('spacer')
//     this.hex = document.getElementById('hex')
//     this.hexDiv = document.getElementById('hex-div')
//     this.rgbDiv = document.getElementById('rgb-div')
//     State. = new State()
//     View.init({ canvas: this.canvas });
//     Input.init(this.canvas, { down, move, up, keyDown })
//     Sheet.init(State..transparentColor)
//     this.graphics = View.add(new PIXI.Graphics())
//     window.addEventListener('resize', resize)
//     remote.getCurrentWindow().show()
//     resize()
//     ipcRenderer.on('state', stateChange)
//     ipcRenderer.on('reset', stateChange)
//     new EasyEdit(document.getElementById('r'),
//         { onedit: () => this.editing = true, onsuccess: (value) => { rgb({ r: value }); this.editing = false; }, oncancel: this.editing = false })
//     new EasyEdit(document.getElementById('g'),
//         { onedit: () => this.editing = true, onsuccess: (value) => { rgb({ g: value }); this.editing = false; }, oncancel: this.editing = false })
//     new EasyEdit(document.getElementById('b'),
//         { onedit: () => this.editing = true, onsuccess: (value) => { rgb({ b: value }); this.editing = false; }, oncancel: this.editing = false })
//     new EasyEdit(this.hex, { onedit: () => this.editing = true, onsuccess: (value) => { hex(value); this.editing = false; }, oncancel: this.editing = false })
//     resize()
// }

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
//     ipcRenderer.send('state')
//     this.hsl = null
//     draw()
//     View.render()
// }

// function hex(value)
// {
//     const color = parseInt(value, 16)
//     if (State..isForeground)
//     {
//         State..foreground = color
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

// function stateChange()
// {
//     State..load()
//     this.hsl = null
//     draw()
// }

// function words()
// {
//     this.hex.innerHTML = showColor(this.colorCurrent)
//     const rgb = TinyColor({ h: this.hsl.h, s: this.hsl.s, l: this.hsl.l }).toRgb()
//     document.getElementById('r').innerHTML = rgb.r
//     document.getElementById('g').innerHTML = rgb.g
//     document.getElementById('b').innerHTML = rgb.b
// }