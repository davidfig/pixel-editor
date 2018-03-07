const PIXI = require('pixi.js')
const clicked = require('clicked')

const libraries = require('./config/libraries')
const Pixel = libraries.Pixel

const html = require('./html')
const button = require('./button')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const sheet = require('./pixel-sheet')
const Dialog = require('./dialog')

const MIN_WIDTH = 230
const MIN_HEIGHT = 200

const BUTTONS = require('../images/animation.json')

module.exports = class Animation extends PIXI.Container
{
    constructor(wm)
    {
        super()
        this.current = 0
        this.time = 150
        this.win = wm.createWindow({ height: MIN_HEIGHT, width: MIN_WIDTH, minWidth: '230px' })
        this.content = this.win.content
        this.content.style.color = '#eeeeee'
        this.content.style.margin = '0.25em'
        this.content.style.height = '100%'
        this.content.style.display = 'flex'
        this.content.style.flexDirection = 'column'
        this.renderer = new PIXI.WebGLRenderer({ resolution: window.devicePixelRatio, transparent: true })
        this.renderer.view.style.display = 'block'
        this.renderer.view.style.margin = '0 auto'
        const canvas = html({ parent: this.content, styles: { width: '100%' } })
        canvas.appendChild(this.renderer.view)
        this.createButtons()
        this.stateSetup('animation')
        this.draw()
        PIXI.ticker.shared.add(() => this.update(PIXI.ticker.shared.elapsedMS))
        this.win.open()
    }

    createButtons()
    {
        const div = html({ parent: this.content, styles: { width: '100%' } })
        const buttons = html({ parent: div, styles: { margin: '1em auto 0.25em', textAlign: 'center' } })
        const style = { opacity: 0.6 }
        this.play = button(buttons, BUTTONS.imageData[0], style, 'play animation')
        clicked(this.play, () => this.change())

        const newButton = button(buttons, BUTTONS.imageData[4], style, 'new animation')
        clicked(newButton, () => this.createAnimation())
        this.renameButton = button(buttons, BUTTONS.imageData[5], style, 'rename animation')
        clicked(this.renameButton, () => this.renameAnimation())
        this.copyButton = button(buttons, BUTTONS.imageData[3], style, 'duplicate animation')
        clicked(this.copyButton, () => this.duplicateAnimation())
        this.deleteButton = button(buttons, BUTTONS.imageData[2], style, 'delete animation')
        clicked(this.deleteButton, () => this.removeAnimation())

        const stack = html({parent: div, styles: { display: 'flex', alignItems: 'flex-end' }})
        this.animationName = html({ parent: stack, type: 'select', styles: { margin: '0.25em', flex: '1', background: '#eeeeee' } })
        this.animationTime = html({ parent: stack, type: 'input', value: this.time, styles: { margin: '0.25em', width: '2em', textAlign: 'right', background: '#eeeeee' } })
        this.animationTime.addEventListener('change', () => this.changeTime())
        this.captureKey(this.animationTime)
        html({parent: stack, html: 'ms', styles: { paddingBottom: '0.25em'}})
        this.showNames()
        this.animationName.addEventListener('change', () => this.showText())

        this.animationText = html({ parent: this.content, type: 'textarea', styles: { flex: 2, margin: '0.25em', resize: 'none', background: '#eeeeee' } })
        this.animationText.addEventListener('change', () => this.changeText())
        this.animationError = html({ parent: this.content, styles: { width: 'calc(100% - 1em)', margin: '0.25em', color: 'rgb(255,50,50)' }})
        this.captureKey(this.animationText)
        this.showText()
    }

    captureKey(div)
    {
        div.addEventListener('keydown', (e) =>
        {
            if (e.code === 'Enter')
            {
                e.target.blur()
            }
            e.stopPropagation()
        })
        div.addEventListener('keyup', (e) => e.stopPropagation())
    }

    change(force)
    {
        if (force || this.playing)
        {
            this.playing = false
            this.play.image.src = 'data:image/png;base64,' + BUTTONS.imageData[0][2]
            this.pixel.stop()
        }
        else
        {
            this.playing = true
            this.play.image.src = 'data:image/png;base64,' + BUTTONS.imageData[1][2]
            this.pixel.animate(this.animationName.value)
        }
    }

    changeTime()
    {
        this.time = parseInt(this.animationTime.value)
        this.draw()
    }

    changeText()
    {
        const animations = PixelEditor.animations
        const name = this.animationName.value
        try
        {
            const data = JSON.parse('[' + this.animationText.value + ']')
            animations[name] = data
            this.animationError.innerHTML = ''
            PixelEditor.save()
            this.disable(this.play, false)
        }
        catch (e)
        {
            this.animationError.innerHTML = e.message
            this.disable(this.play, true)
        }
    }

    disable(button, disable)
    {
        button.disabled = disable
        button.style.opacity = disable ? 0.25 : 0.6
    }

    draw()
    {
        if (this.pixel)
        {
            this.pixel.destroy()
        }
        this.pixel = this.addChild(new Pixel(PixelEditor.getData(), sheet, this.time))
        this.pixel.on('stop', this.stopped, this)
        this.pixel.scale.set(PixelEditor.zoom)
        this.pixel.frame(0)
        const split = State.relative.split('-')
        this.pixel.anchor.x = split[1] === 'left' ? 0 : split[1] === 'right' ? 1 : 0.5
        this.pixel.anchor.y = split[0] === 'top' ? 0 : split[0] === 'bottom' ? 1 : 0.5
        this.pixel.position.set(PixelEditor.largestWidth * PixelEditor.zoom * this.pixel.anchor.x, PixelEditor.largestHeight * PixelEditor.zoom * this.pixel.anchor.y)

        const width = PixelEditor.largestWidth * PixelEditor.zoom
        const height = PixelEditor.largestHeight * PixelEditor.zoom
        this.renderer.resize(width, height)
        this.renderer.view.style.width = width + 'px'
        this.renderer.view.style.height = height + 'px'
        this.renderer.render(this)

        this.change(true)
    }

    showNames()
    {
        while (this.animationName.firstChild)
        {
            this.animationName.removeChild(this.animationName.firstChild);
        }
        const animations = PixelEditor.animations
        if (Object.keys(animations).length)
        {
            for (let type in animations)
            {
                const value = type.toLowerCase()
                html({ parent: this.animationName, type: 'option', value, html: value })
            }
            this.disable(this.deleteButton, false)
            this.disable(this.renameButton, false)
            this.disable(this.copyButton, false)
        }
        else
        {
            this.disable(this.play, true)
            this.disable(this.deleteButton, true)
            this.disable(this.renameButton, true)
            this.disable(this.copyButton, true)
        }
    }

    showText()
    {
        if (this.animationName.value)
        {
            const text = JSON.stringify(PixelEditor.animations[this.animationName.value])
            this.animationText.value = text.substr(1, text.length - 2)
        }
    }

    createAnimation()
    {
        new Dialog(this.win, 'Create Animation', 'string', 'name: ', (value) =>
        {
            if (value)
            {
                if (!PixelEditor.animations[value])
                {
                    PixelEditor.animations[value] = []
                    PixelEditor.save()
                    this.showNames()
                }
                this.selectAnimation(value)
            }
        })
    }

    removeAnimation()
    {
        new Dialog(this.win, 'Delete Animation?', 'confirmation', 'Are you sure you want to delete the ' + this.animationName.value + ' animation?', (value) =>
        {
            if (value)
            {
                delete PixelEditor.animations[this.animationName.value]
                PixelEditor.save()
                this.showNames()
            }
        }, { ok: 'DELETE', okColor: 'red' })
    }

    selectAnimation(value)
    {
        for (let name of this.animationName.childNodes)
        {
            if (name.value === value)
            {
                name.setAttribute('selected', true)
                return
            }
        }
    }

    renameAnimation()
    {
        new Dialog(this.win, 'Rename Animation', 'string', 'name: ',(value) =>
        {
            if (value && value !== this.animationName.value)
            {
                PixelEditor.animations[value] = PixelEditor.animations[this.animationName.value]
                delete PixelEditor.animations[this.animationName.value]
                PixelEditor.save()
                this.showNames()
                this.selectAnimation(value)
            }
        }, { original: this.animationName.value })
    }

    duplicateAnimation()
    {
        new Dialog(this.win, 'Duplicate Animation', 'string', 'name: ', (value) =>
        {
            if (value)
            {
                if (!PixelEditor.animations[value])
                {
                    const original = PixelEditor.animations[this.animationName.value]
                    PixelEditor.animations[value] = JSON.parse(JSON.stringify(original))
                    PixelEditor.save()
                    this.showNames()
                }
                this.selectAnimation(value)
            }
        })
    }

    update(elapsed)
    {
        if (this.pixel)
        {
            if (this.pixel.playing && this.pixel.update(elapsed))
            {
                this.renderer.render(this)
            }
        }
    }

    stateSetup()
    {
        this.win.on('resize', () =>
        {
            this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)
            this.draw()
        })
        this.win.on('resize-end', () => State.set())
        this.win.on('move-end', () => State.set())
        PixelEditor.on('changed', () => this.draw())
        State.on('last-file', () =>
        {
            this.draw()
            this.showNames()
            this.showText()
        })
        State.on('relative', this.draw, this)
    }

    resized()
    {
        if (this.win._resizing)
        {
            this.draw()
            State.set()
        }
    }

    dragged()
    {
        if (this.win._moving)
        {
            State.set()
        }
    }

    keydown() { }
}