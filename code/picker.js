const Settings = require('./settings')

const PIXI = require('pixi.js')
const TinyColor = require('tinycolor2')
const exists = require('exists')

const UI = require(Settings.UI)
const State = require('./state.js')
const sheet = require('./sheet')

const MIN_WIDTH = 200
const MIN_HEIGHT = 300
const CONTROL = 5
const WIDTH = 4

module.exports = class Picker extends UI.Window
{
    constructor()
    {
        super({ draggable: true, resizeable: true, theme: { 'minimum-width': MIN_WIDTH, 'minimum-height': MIN_HEIGHT } })
        this.transparentBlocks = [this.addChild(sheet.get('transparency')), this.addChild(sheet.get('transparency')), this.addChild(sheet.get('transparency'))]
        this.graphics = this.addChild(new PIXI.Graphics())
        this.alphaCurrent = 'ff'
        this.wordsSetup()
        this.stateSetup('picker')
    }

    wordsSetup()
    {
        this.hsl = TinyColor(State.color.substr(0, 6)).toHsl()
        const rgb = TinyColor({ h: this.hsl.h, s: this.hsl.s, l: this.hsl.l }).toRgb()
        this.stack = this.addChild(new UI.Stack())
        this.hex = this.stack.add(new UI.EditText(State.color.substr(0, 6), { beforeText: 'hex: #', edit: 'hex', maxCount: 6, count: 6 }))
        this.hex.on('changed', this.changeHex, this)
        this.part = this.stack.add(new UI.Stack([
            new UI.EditText(rgb.r, { edit: 'number', maxCount: 3, count: 3, min: 0, max: 255, align: 'right', beforeText: 'r:' }),
            new UI.EditText(rgb.g, { edit: 'number', maxCount: 3, count: 3, min: 0, max: 255, align: 'right', beforeText: 'g:' }),
            new UI.EditText(rgb.b, { edit: 'number', maxCount: 3, count: 3, min: 0, max: 255, align: 'right', beforeText: 'b:' })
        ], { horizontal: true}))
        this.part.items[0].on('changed', this.changeNumbers, this)
        this.part.items[1].on('changed', this.changeNumbers, this)
        this.part.items[2].on('changed', this.changeNumbers, this)
        const spacing = 3
        this.alphas = this.stack.add(new UI.Stack([
            new UI.Button({ text: '.1', theme: { spacing } }),
            new UI.Button({ text: '.2', theme: { spacing } }),
            new UI.EditText(parseFloat((parseInt(State.color.substr(6), 16) / 0xff).toFixed(2)), { edit: 'number', count: 2, beforeText: 'alpha: ' }),
            new UI.Button({ text: '.75', theme: { spacing } }),
            new UI.Button({ text: '1', theme: { spacing } }),
        ], { horizontal: true }))
        this.alphaText = this.alphas.items[2]
        this.alphaText.on('changed', this.changeAlpha, this)
        this.alphas.items[0].on('clicked', () => this.changeAlphaButton(0.1))
        this.alphas.items[1].on('clicked', () => this.changeAlphaButton(0.2))
        this.alphas.items[3].on('clicked', () => this.changeAlphaButton(0.75))
        this.alphas.items[4].on('clicked', () => this.changeAlphaButton(1))
    }

    changeHex()
    {
        let test = this.hex.text
        while (test.length < 6)
        {
            test = '0' + test
        }
        let color = TinyColor(test).toHex()
        while (color.length < 6)
        {
            color = '0' + color
        }
        color += this.alphaCurrent
        State.color = color
    }

    changeAlphaButton(alpha)
    {
        this.alphaText.text = alpha
        this.changeAlpha()
    }

    changeAlpha()
    {
        let alpha = parseFloat(this.alphaText.text)
        alpha = alpha > 1 ? 1 : alpha
        alpha = alpha < 0 ? 0 : alpha
        this.alphaText.text = alpha
        const text = Math.round((alpha * 0xff)).toString(16)
        this.alphaCurrent = text.length < 2 ? '0' + text : text
        State.color = State.color.substr(0, 6) + this.alphaCurrent
        this.layout()
    }

    changeNumbers()
    {
        let color = TinyColor({ r: parseInt(this.part.items[0].text), g: parseInt(this.part.items[1].text), b: parseInt(this.part.items[2].text) }).toHex()
        while (color.length < 6)
        {
            color = '0' + color
        }
        color += this.alphaCurrent
        State.color = color
    }

    box(x, percent, reverse)
    {
        const actual = percent * (this.bottomY - Settings.BORDER)
        this.graphics.beginFill(reverse ? 0xffffff : 0)
            .drawRect(x, actual, this.size, CONTROL)
            .drawRect(x + this.boxSize - CONTROL, actual, CONTROL, CONTROL * 2)
            .drawRect(x, actual + CONTROL + 1, this.size, CONTROL)
            .drawRect(x, actual, CONTROL, CONTROL * 2)
            .endFill()
    }

    draw()
    {
        this.size = this.right / WIDTH
        this.boxSize = Math.min(this.size, (this.height / 3))
        this.bottomY = this.bottom - this.stack.height - Settings.BORDER * 2
        let boxHeight = this.size
        boxHeight = boxHeight * 4 > (this.bottomY - Settings.BORDER) ? (this.bottomY - Settings.BORDER) / 4 : boxHeight
        const alpha = parseInt(State.color.substr(6), 16) / 255

        for (let transparent of this.transparentBlocks)
        {
            transparent.anchor.set(0)
            transparent.width = transparent.height = this.size - Settings.BORDER
        }
        this.graphics.clear()
            .beginFill(parseInt(State.color.substr(0, 6), 16), alpha)
            .drawRect(0, 0, this.size - Settings.BORDER, boxHeight - Settings.BORDER)
            .endFill()

        let y = boxHeight * 2
        this.hsl = TinyColor(State.color.substr(0, 6)).toHsl()
        this.alphaCurrent = State.color.substr(6)

        const others = [this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l * 0.9), this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l * 1.1)]
        for (let i = 0; i < others.length; i++)
        {
            const color = others[i]
            this.transparentBlocks[i + 1].y = y
            this.graphics.beginFill(color, alpha)
                .drawRect(0, y, this.size - Settings.BORDER, boxHeight - Settings.BORDER)
                .endFill()
            y += boxHeight
        }

        for (let y = 0; y <= this.bottomY; y++)
        {
            let percent = y / this.bottomY
            percent = percent > 1 ? 1 : percent

            // h
            this.graphics.beginFill(this.changeColor(percent * 360, this.hsl.s, this.hsl.l))
                .drawRect(this.size, y, this.size, 1)
                .endFill()

            // s
            this.graphics.beginFill(this.changeColor(this.hsl.h, percent, this.hsl.l))
                .drawRect(Settings.BORDER + this.size * 2, y, this.size, 1)
                .endFill()

            // l
            this.graphics.beginFill(this.changeColor(this.hsl.h, this.hsl.s, percent))
                .drawRect(Settings.BORDER * 2 + this.size * 3, y, this.size, 1)
                .endFill()
        }
        this.box(this.size, this.hsl.h / 360, this.hsl.l < 0.5)
        this.box(Settings.BORDER + this.size * 2, this.hsl.s, this.hsl.l < 0.5)
        this.box(Settings.BORDER * 2 + this.size * 3, this.hsl.l, this.hsl.l < 0.5)
        this.stack.position.set(this.right / 2 - this.stack.width / 2, this.bottom - this.stack.height)
        this.words()
    }

    layout()
    {
        super.layout()
        this.draw()
    }

    words()
    {
        this.hex.text = State.color.substr(0, 6)
        const rgb = TinyColor({ h: this.hsl.h, s: this.hsl.s, l: this.hsl.l }).toRgb()
        this.part.items[0].text = rgb.r
        this.part.items[1].text = rgb.g
        this.part.items[2].text = rgb.b
        this.alphaText.text = parseFloat((parseInt(State.color.substr(6), 16) / 0xff).toFixed(2))
    }

    changeColor(h, s, l, toString)
    {
        let color = parseInt(TinyColor({ h, s, l }).toHex(), 16)
        if (toString)
        {
            color = color.toString(16)
            while (color.length < 6)
            {
                color = ' ' + color
            }
            color += this.alphaCurrent
        }
        return color
    }

    down(x, y, data, notDown)
    {
        const point = this.toLocal({ x, y })
        if (point.y < 0)
        {
            return super.down(x, y, data)
        }
        let percent = point.y / (this.bottomY - Settings.BORDER)
        percent = percent < 0 ? 0 : percent
        percent = percent > 1 ? 1 : percent
        if (point.x > Settings.BORDER && point.x < Settings.BORDER + this.size)
        {
            if (point.y > this.size * 2 + Settings.BORDER * 2 && point.y < this.size * 3 + Settings.BORDER * 2)
            {
                this.hsl.s *= 0.9
            }
            else if (y > this.size * 3 + Settings.BORDER * 3 && point.y < this.size * 4 + Settings.BORDER * 3)
            {
                this.hsl.s *= 1.1
            }
            else if (!notDown)
            {
                return super.down(x, y, data)
            }
        }
        else
        {
            if (point.y < this.bottomY)
            {
                if (point.x > Settings.BORDER * 2 + this.size && point.x < Settings.BORDER + this.size * 2)
                {
                    this.hsl.h = percent * 360
                }
                else if (point.x > Settings.BORDER * 3 + this.size * 2 && point.x < Settings.BORDER * 3 + this.size * 3)
                {
                    this.hsl.s = percent
                }
                else if (point.x > Settings.BORDER * 4 + this.size * 3 && point.x < Settings.BORDER * 4 + this.size * 4)
                {
                    this.hsl.l = percent
                }
                else if (!notDown)
                {
                    return super.down(x, y, data)
                }
            }
            else if (!notDown)
            {
                return super.down(x, y, data)
            }
        }
        State.color = this.changeColor(this.hsl.h, this.hsl.s, this.hsl.l, true)
        this.draw()
        this.isPicker = true
        return true
    }

    move(x, y, data)
    {
        if (this.isPicker)
        {
            this.down(x, y, data, true)
        }
        else
        {
            super.move(x, y, data)
        }
    }

    up(x, y, data)
    {
        if (this.isPicker)
        {
            this.isPicker = false
        }
        else
        {
            super.up(x, y, data)
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
        if (State.getHidden(this.name))
        {
            this.visible = false
        }
        this.on('drag-end', this.stateSet, this)
        this.on('resize-end', this.stateSet, this)
        State.on('foreground', this.draw, this)
        State.on('background', this.draw, this)
        State.on('isForeground', this.draw, this)
    }

    stateSet()
    {
        State.set(this.name, this.x, this.y, this.width, this.height)
    }
}