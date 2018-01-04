const PIXI = require('pixi.js')
const TinyColor = require('tinycolor2')
const exists = require('exists')
const RenderSheet = require('yy-rendersheet')
const EasyEdit = require('easyedit')

const State = require('./state.js')
const sheet = require('./sheet')

const MIN_WIDTH = 200
const MIN_HEIGHT = 300
const CONTROL = 5
const WIDTH = 4

const LINE_WIDTH = 1
const BAR_WIDTH = LINE_WIDTH * 6
const BAR_HEIGHT = 25
const RADIUS = 6
const SPACING = 8
const WORD_SPACING = '0.4em'

module.exports = class Picker
{
    constructor(ui)
    {
        this.win = ui.createWindow({ height: MIN_HEIGHT, width: MIN_WIDTH })
        this.win.el[0].style.opacity = 1
        this.win.el[0].style.minWidth = '200px'
        this.win.open()
        this.ui = ui
        this.content = this.win.$content[0]
        this.content.style.margin = '0.5em'

        this.renderer = new PIXI.WebGLRenderer({ resolution: window.devicePixelRatio, transparent: true, preserveDrawingBuffer: true })

        this.stateSetup('picker')
        this.content.appendChild(this.renderer.view)

        this.wordsSetup()

        this.stage = new PIXI.Container()

        this.sheet = new RenderSheet()
        this.sheet.add('picker', (c) => this.drawPicker(c), () => { return { width: this.size(), height: this.size() } })
        this.sheet.add('pickerCursor', (c) => this.drawPickerCursor(c), () => { return { width: RADIUS * 2 + LINE_WIDTH / 2, height: RADIUS * 2 + LINE_WIDTH / 2 } })
        this.sheet.add('bar', (c) => this.drawBar(c), () => { return { width: BAR_WIDTH, height: BAR_HEIGHT + LINE_WIDTH * 4 }})
        this.sheet.add('hue', (c) => this.drawHue(c), () => { return { width: this.size(), height: 1 } })
        this.sheet.add('alpha', (c) => this.drawAlpha(c), () => { return { width: this.size(), height: BAR_HEIGHT } })

        // this.sheet.show = true

        this.sheet.render(() => this.afterRender())
    }

    afterRender()
    {
        this.setupPicker()
        this.setupHue()
        this.setupAlpha()

        this.rendererResize()
        this.renderer.render(this.stage)

        PIXI.ticker.shared.add(() =>
        {
            if (this.dirty)
            {
                this.renderer.render(this.stage)
                this.dirty = false
            }
        })
    }

    size()
    {
        return this.content.offsetWidth - RADIUS * 2
    }

    setupPicker()
    {
        this.picker = this.stage.addChild(new PIXI.Container())
        this.picker.position.set(RADIUS)
        const gradient = this.picker.addChild(this.sheet.get('picker'))
        gradient.anchor.set(0)
        this.picker.interactive = true
        this.picker.on('pointerdown', (e) => { this.isPickerDown = true; this.pickerMove(e) })
        this.picker.on('pointermove', (e) => this.pickerMove(e))
        this.picker.on('pointerup', () => this.isPickerDown = false)
        this.picker.on('pointerupoutside', () => this.isPickerDown = false)
        this.pickerCursor = this.picker.addChild(this.sheet.get('pickerCursor'))
        const size = this.size()
        const color = new TinyColor('#' + State.color.substr(0, 6)).toHsl()
        this.pickerCursor.position.set(size * color.s, size * (1 - color.l))
    }

    drawPicker(c)
    {
        c.beginPath()
        const color = '#' + State.color.substr(0, 6)
        const translate = new TinyColor(color).toHsl()
        const show = new TinyColor({ h: translate.h, s: 1, l: 0.5 })
        const size = this.size()
        c.fillStyle = show
        c.fillRect(0, 0, size, size)
        let gradient = c.createLinearGradient(0, 0, size, 0)
        gradient.addColorStop(0, 'hsl(0,0%,50%)')
        gradient.addColorStop(1, 'hsla(0,0%,50%,0)')
        c.fillStyle = gradient
        c.fillRect(0, 0, size, size)
        gradient = c.createLinearGradient(0, 0, 0, size)
        gradient.addColorStop(0, 'hsl(0,0%,100%)')
        gradient.addColorStop(0.5, 'hsla(0,0%,100%,0)')
        gradient.addColorStop(0.5, 'hsla(0,0%,0%,0)')
        gradient.addColorStop(1, 'hsl(0,0%,0%)')
        c.fillStyle = gradient
        c.fillRect(0, 0, size, size)
    }

    drawPickerCursor(c)
    {
        c.beginPath()
        c.lineWidth = LINE_WIDTH / 2
        const middle = RADIUS + LINE_WIDTH / 4
        c.strokeStyle = 'black'
        c.arc(middle, middle, RADIUS - LINE_WIDTH / 2, 0, 2 * Math.PI)
        c.stroke()
        c.strokeStyle = 'white'
        c.arc(middle, middle, RADIUS - 1 * LINE_WIDTH, 0, 2 * Math.PI)
        c.stroke()
    }

    hexify(a)
    {
        if (a.length < 2)
        {
            return '0' + a
        }
        else
        {
            return a
        }
    }

    pickerMove(e)
    {
        if (this.isPickerDown)
        {
            const size = this.size()
            const local = this.picker.toLocal(e.data.global)
            let x = local.x
            x = x < 0 ? 0 : x > size ? size : x
            let y = local.y
            y = y < 0 ? 0 : y > size ? size : y
            this.pickerCursor.position.set(x, y)
            this.change()

            const s = x / size
            const l = 1 - y / size
            const hue = new TinyColor('#' + State.color.substr(0, 6)).toHsl()
            let color = new TinyColor({ h: hue.h, s, l }).toHex()
            State.color = this.hexify(color) + State.color.substr(6)
        }
    }

    pickerUp()
    {
        this.isPickerDown = false
    }

    drawBar(c)
    {
        c.beginPath()
        c.lineWidth = LINE_WIDTH * 2
        c.strokeStyle = 'black'
        c.rect(LINE_WIDTH, LINE_WIDTH, BAR_WIDTH - RADIUS / 2, BAR_HEIGHT + LINE_WIDTH * 2)
        c.stroke()
    }

    drawHue(c)
    {
        c.beginPath()
        let gradient = c.createLinearGradient(0, 0, this.size(), 0)
        gradient.addColorStop(0, '#f00')
        gradient.addColorStop(0.1666, '#ff0')
        gradient.addColorStop(0.3333, '#0f0')
        gradient.addColorStop(0.5, '#0ff')
        gradient.addColorStop(0.6666, '#00f')
        gradient.addColorStop(0.8333, '#f0f')
        gradient.addColorStop(1, '#f00')
        c.fillStyle = gradient
        c.fillRect(0, 0, this.size(), 1)
    }

    setupHue()
    {
        this.hue = this.stage.addChild(new PIXI.Container())
        this.hue.position.set(RADIUS, this.picker.y + this.picker.height + SPACING)
        const hue = this.hue.addChild(this.sheet.get('hue'))
        hue.anchor.set(0)
        hue.height = BAR_HEIGHT
        this.hue.interactive = true
        this.hue.on('pointerdown', (e) => { this.isHueDown = true; this.hueMove(e) })
        this.hue.on('pointermove', (e) => this.hueMove(e))
        this.hue.on('pointerup', () => this.isHueDown = false)
        this.hue.on('pointerupoutside', () => this.isHueDown = false)
        this.hueCursor = this.hue.addChild(this.sheet.get('bar'))
        const color = new TinyColor('#' + State.color.substr(0, 6)).toHsl()
        const x = color.h / 360 * this.content.offsetWidth - RADIUS * 2
        this.hueCursor.position.set(x, BAR_HEIGHT / 2)
    }

    hueMove(e)
    {
        if (this.isHueDown)
        {
            const size = this.content.offsetWidth - RADIUS * 2
            const local = this.picker.toLocal(e.data.global)
            let x = local.x
            this.hueCursor.x = x < 0 ? 0 : x > size ? size : x
            const h = (x / size) * 360
            const original = new TinyColor(State.color).toHsl()
            const color = new TinyColor({ h: h, s: original.s, l: original.l }).toHex()
            State.color = color + State.color.substr(6)
            this.change()
        }
    }

    drawAlpha(c)
    {
        c.beginPath()
        c.clearRect(0, 0, this.size(), BAR_HEIGHT)
        const rgb = new TinyColor('#' + State.color.substr(0, 6)).toRgb()
        let gradient = c.createLinearGradient(0, 0, this.size(), 0)
        gradient.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)')
        gradient.addColorStop(1, 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')')
        c.fillStyle = gradient
        c.fillRect(0, 0, this.size(), BAR_HEIGHT)
    }

    setupAlpha()
    {
        const size = this.size()
        this.alpha = this.stage.addChild(new PIXI.Container())
        this.alphaTransparent = this.alpha.addChild(new PIXI.extras.TilingSprite(sheet.getTexture('transparency')))
        this.alphaTransparent.tileScale.set(0.1)
        this.alphaTransparent.width = size
        this.alphaTransparent.height = BAR_HEIGHT
        this.alpha.position.set(RADIUS, this.hue.y + this.hue.height + SPACING)
        const alpha = this.alpha.addChild(this.sheet.get('alpha'))
        alpha.anchor.set(0)
        alpha.height = BAR_HEIGHT
        this.alpha.interactive = true
        this.alpha.on('pointerdown', (e) => { this.isAlphaDown = true; this.alphaMove(e) })
        this.alpha.on('pointermove', (e) => this.alphaMove(e))
        this.alpha.on('pointerup', () => this.isAlphaDown = false)
        this.alpha.on('pointerupoutside', () => this.isAlphaDown = false)
        this.alphaCursor = this.alpha.addChild(this.sheet.get('bar'))
        const x = size * parseInt(State.color.substr(6), 16) / 256
        this.alphaCursor.position.set(x, BAR_HEIGHT / 2)
    }

    alphaMove(e)
    {
        if (this.isAlphaDown)
        {
            const size = this.content.offsetWidth - RADIUS * 2
            const local = this.picker.toLocal(e.data.global)
            let x = local.x
            this.alphaCursor.x = x < 0 ? 0 : x > size ? size : x
            let alpha = Math.floor((x / size) * 256)
            alpha = (alpha > 255 ? 255 : alpha).toString(16)
            alpha = alpha.length === 1 ? '0' + alpha : alpha
            State.color = State.color.substr(0, 6) + alpha
            this.dirty = true
            this.wordsUpdate()
        }
    }

    fixed(a)
    {
        return (('' + a).length < 4) ? a : a.toFixed(2)
    }

    wordsSetup()
    {
        function letter(parent, label, original, special)
        {
            const container = document.createElement('span')
            parent.appendChild(container)
            let span
            if (label)
            {
                span = document.createElement('span')
                container.appendChild(span)
                span.innerText = label + ': '
            }
            if (special)
            {
                span = document.createElement('span')
                container.appendChild(span)
                span.innerText = special
            }
            span = document.createElement('span')
            span.style.borderBottom = '1px dotted black'
            container.appendChild(span)
            span.innerText = original
            return new EasyEdit(span)
        }

        const c = new TinyColor(State.color.substr(0, 6))
        const a = parseInt(State.color.substr(6), 16) / 255

        this.words = {}
        this.container = document.createElement('div')
        this.content.appendChild(this.container)
        const rgb = document.createElement('div')
        rgb.style.display = 'flex'
        rgb.style.justifyContent = 'space-around'
        rgb.style.marginBottom = WORD_SPACING
        this.container.appendChild(rgb)
        let value = c.toRgb()
        this.words.r = letter(rgb, 'R', value.r)
        this.words.g = letter(rgb, 'G', value.g)
        this.words.b = letter(rgb, 'B', value.b)

        const middle = document.createElement('div')
        middle.style.display = 'flex'
        middle.style.justifyContent = 'space-around'
        middle.style.marginBottom = WORD_SPACING
        this.container.appendChild(middle)
        value = this.fixed(a)
        this.words.alpha = letter(middle, 'alpha', value)
        value = c.toHex()
        this.words.hex = letter(middle, '', value, '#')

        const hsl = document.createElement('div')
        hsl.style.display = 'flex'
        hsl.style.justifyContent = 'space-around'
        this.container.appendChild(hsl)
        value = c.toHsl()
        this.words.h = letter(hsl, 'H', Math.floor(value.h))
        this.words.s = letter(hsl, 'S', this.fixed(value.s))
        this.words.l = letter(hsl, 'L', this.fixed(value.l))

        this.wordsEvents()
    }

    wordsEvents()
    {
        const color = new TinyColor('#' + State.color.substr(0, 6))
        const alpha = State.color.substr(6)
        this.words.r.on('success', (value) =>
        {
            const v = parseInt(value)
            if (isNaN(value) || v < 0 || v > 255)
            {
                this.words.r.object.innerText = color.toRgb().r
                return
            }
            State.color = this.hexify(v.toString(16)) + State.color.substr(2)
            this.change()
        })
        this.words.g.on('success', (value) =>
        {
            const v = parseInt(value)
            if (isNaN(value) || v < 0 || v > 255)
            {
                this.words.g.object.innerText = color.toRgb().g
                return
            }
            State.color = State.color.substr(0, 2) + this.hexify(v.toString(16)) + State.color.substr(4)
            this.change()
        })
        this.words.b.on('success', (value) =>
        {
            const v = parseInt(value)
            if (isNaN(value) || v < 0 || v > 255)
            {
                this.words.b.object.innerText = color.toRgb().b
                return
            }
            State.color = State.color.substr(0, 4) + this.hexify(v.toString(16)) + State.color.substr(6)
            this.change()
        })
        this.words.alpha.on('success', (value) =>
        {
            const v = parseFloat(value)
            if (isNaN(value) || v < 0 || v > 1)
            {
                this.words.alpha.object.innerText = parseInt(alpha, 16) / 256
                return
            }
            State.color = State.color.substr(0, 6) + this.hexify(Math.floor(v * 256).toString(16))
            this.change()
        })
        this.words.hex.on('success', (value) =>
        {
            const v = parseInt(value, 16)
            if (isNaN(v) || v < 0 || v > 0xffffff)
            {
                this.words.hex.object.innerText = State.color(0, 6)
                return
            }
            State.color = value + State.color.substr(6)
            this.change()
        })
        this.words.h.on('success', (value) =>
        {
            const v = parseInt(value)
            if (isNaN(value) || v < 0 || v > 360)
            {
                this.words.h.object.innerText = color.toHsl().h
                return
            }
            const hsl = color.toHsl()
            hsl.h = v
            State.color = new TinyColor(hsl).toHex() + State.color.substr(6)
            this.change()
        })
        this.words.s.on('success', (value) =>
        {
            const v = parseFloat(value)
            if (isNaN(value) || v < 0 || v > 1)
            {
                this.words.s.object.innerText = color.toHsl().s
                return
            }
            const hsl = color.toHsl()
            hsl.s = v
            State.color = new TinyColor(hsl).toHex() + State.color.substr(6)
            this.change()
        })
        this.words.l.on('success', (value) =>
        {
            const v = parseFloat(value)
            if (isNaN(value) || v < 0 || v > 1)
            {
                this.words.h.object.innerText = color.toHsl().l
                return
            }
            const hsl = color.toHsl()
            hsl.l = v
            State.color = new TinyColor(hsl).toHex() + State.color.substr(6)
            this.change()
        })
    }

    wordsUpdate()
    {
        const c = new TinyColor(State.color.substr(0, 6))
        const a = parseInt(State.color.substr(6), 16) / 256

        let value = c.toRgb()
        this.words.r.object.innerText = value.r
        this.words.g.object.innerText = value.g
        this.words.b.object.innerText = value.b

        value = this.fixed(a)
        this.words.alpha.object.innerText = value
        value = c.toHex()
        this.words.hex.object.innerText = value

        value = c.toHsl()
        this.words.h.object.innerText = Math.floor(value.h)
        this.words.s.object.innerText = this.fixed(value.s)
        this.words.l.object.innerText = this.fixed(value.l)
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
        if (State.getHidden(this.name))
        {
            this.win.el[0].display = 'none'
        }

        this.content.style.overflow = 'hidden'
        this.win.el[0].addEventListener('mousemove', () => this.resized())
        this.win.el[0].addEventListener('touchmove', () => this.resized())
        this.win.el[0].addEventListener('mouseup', () => this.dragged())
        this.win.el[0].addEventListener('touchend', () => this.dragged())
        // State.on('foreground', this.draw, this)
        // State.on('background', this.draw, this)
        // State.on('isForeground', this.draw, this)
    }

    change()
    {
        this.sheet.changeDraw('picker', (c) => this.drawPicker(c))
        this.sheet.changeDraw('alpha', (c) => this.drawAlpha(c))

        const size = this.size()
        const color = new TinyColor('#' + State.color.substr(0, 6)).toHsl()
        this.pickerCursor.position.set(size * color.s, size * (1 - color.l))

        this.hueCursor.x = color.h / 360 * this.content.offsetWidth - RADIUS * 2

        this.alphaTransparent.width = size
        this.alpha.y = this.hue.y + this.hue.height + SPACING
        this.alphaCursor.x = size * parseInt(State.color.substr(6), 16) / 256

        this.dirty = true
        this.wordsUpdate()
    }

    rendererResize()
    {
        this.renderer.view.width = this.content.offsetWidth
        this.renderer.view.style.width = this.content.offsetWidth + 'px'
        const height = this.alpha.y + this.alpha.height
        this.renderer.view.height = height
        this.renderer.view.style.height = height + 'px'
        this.renderer.resize(this.content.offsetWidth, height)
        this.dirty = true
    }

    resized()
    {
        if (this.win._resizing)
        {
            this.sheet.render(() =>
            {
                const size = this.size()
                const color = new TinyColor('#' + State.color.substr(0, 6)).toHsl()
                this.pickerCursor.position.set(size * color.s, size * (1 - color.l))

                this.hue.y = this.picker.y + this.picker.height + SPACING
                this.hueCursor.x = color.h / 360 * this.content.offsetWidth - RADIUS * 2

                this.alphaTransparent.width = size
                this.alpha.y = this.hue.y + this.hue.height + SPACING
                this.alphaCursor.x = size * parseInt(State.color.substr(6), 16) / 256

                this.rendererResize()

                State.set(this.name, this.win.x, this.win.y, this.win.width, this.win.height)
            })
        }
    }

    dragged()
    {
        if (this.win._moving)
        {
            State.set(this.name, this.win.x, this.win.y, this.win.width, this.win.height)
        }
    }

    keydown() { }
}