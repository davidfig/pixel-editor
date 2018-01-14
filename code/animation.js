const Settings = require('./settings')

const PIXI = require('pixi.js')
const Pixel = require(Settings.YY_PIXEL).Pixel
const exists = require('exists')
const clicked = require('clicked')

const html = require('./html')
const button = require('./button')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const sheet = require('./pixel-sheet')

const MIN_WIDTH = 200
const MIN_HEIGHT = 200

const BUTTONS = require('../images/animation.json')

module.exports = class Animation extends PIXI.Container
{
    constructor(wm)
    {
        super()

        this.current = 0
        this.time = 150

        this.win = wm.createWindow({ height: MIN_HEIGHT, width: MIN_WIDTH })
        this.content = this.win.content
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
        this.play = button(buttons, BUTTONS.imageData[0], null, 'play animation')
        clicked(this.play, () => this.change())

        const newButton = button(buttons, BUTTONS.imageData[4])
        const copyButton = button(buttons, BUTTONS.imageData[3])
        const deleteButton = button(buttons, BUTTONS.imageData[2])

        const stack = html({parent: div, styles: { display: 'flex', alignItems: 'flex-end' }})
        this.animationName = html({ parent: stack, type: 'select', styles: { margin: '0.25em', flex: '1' } })
        this.animationTime = html({ parent: stack, type: 'input', value: this.time, styles: { margin: '0.25em', width: '2em', textAlign: 'right' } })
        this.animationTime.addEventListener('change', () => this.changeTime())
        this.captureKey(this.animationTime)
        html({parent: stack, html: 'ms', styles: { paddingBottom: '0.25em'}})
        this.showNames()
        this.animationName.addEventListener('change', () => this.changeName())

        this.animationText = html({ parent: this.content, type: 'textarea', styles: { flex: 2, margin: '0.25em', resize: 'none' } })
        this.animationText.addEventListener('change', () => this.changeText())
        this.animationError = html({ parent: this.content, styles: { width: 'calc(100% - 1em)', margin: '0.25em', color: 'red' }})
        this.captureKey(this.animationText)
        this.showText()

        // this.animationName.on('changed', this.changeName, this)
        // this.animationName.on('lose-focus', () => this.list.visible = false)
        // this.animationText = this.addChild(new UI.EditText('enter data here...', { full: true }))
        // this.animationText.on('changed', this.changeText, this)
        // this.animationText.disabled = true
        // this.animationError = this.addChild(new UI.Text(''))
        // this.animationError['foreground-color'] = '#ff0000'
        // this.list = this.special.addChild(new UI.List({ transparent: false, theme: { between: 0, spacing: 2 } }))
        // this.list.visible = false
        // this.list.on('select', this.select, this)
        // this.newButton = new UI.Button({ sprite: this.sheet.get('animation-4') })
        // this.newButton.on('clicked', this.reset, this)
        // this.copyButton = new UI.Button({ sprite: this.sheet.get('animation-3') })
        // this.copyButton.on('clicked', this.copyAnimation, this)
        // this.deleteButton = new UI.Button({ sprite: this.sheet.get('animation-2') })
        // this.deleteButton.on('clicked', this.removeAnimation, this)
        // this.buttons = this.addChild(new UI.Stack([this.newButton, this.copyButton, this.deleteButton], { horizontal: true }))
        // for (let button of this.buttons.items)
        // {
        //     button.sprite.anchor.set(0)
        //     button.sprite.scale.set(2)
        // }
        // this.animationTime = this.addChild(new UI.EditText('150', { afterText: 'ms' }))
        // this.time = 150
        // this.animationTime.on('changed', this.changeTime, this)
        // this.disableControls(true)


// return
//         this.play.position.set(this.right - this.play.width, 0)
//         this.animationName.y = this.pixel.y + (1 - this.pixel.anchor.y) * PixelEditor.maxHeight * PixelEditor.zoom + Settings.BORDER
//         this.animationText.y = this.animationName.y + this.animationName.height + Settings.BORDER
//         this.animationText.width = this.animationError.width = this.right
//         this.animationText.height = this.animationText.height = this.animationName.height
//         this.animationError.y = this.animationText.y + this.animationText.height + Settings.BORDER
//         this.list.y = this.animationName.y + this.animationName.height + Settings.BORDER * 2
//         this.list.x = this.get('spacing')
//         this.animationTime.y = this.buttons.y = this.animationError.y + this.animationError.height + Settings.BORDER
//         this.animationTime.x = this.buttons.x + this.buttons.width + Settings.BORDER
//         this.maxHeight = this.buttons.y + this.buttons.height + Settings.BORDER + this.get('spacing') * 2

//     }


    }

    reset()
    {
        this.animationName.text = 'animation name...'
        this.animationText.text = ''
        this.animationError.text = ''
        this.original = ''
        this.disableControls(true)
        this.pixel.frame(0)
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

    /**
     * whether an active animation is selected
     */
    disableControls(disable)
    {
        this.play.disabled = disable
        this.animationText.disabled = disable
        for (let button of this.buttons.items)
        {
            button.disabled = disable
        }
    }

    changeName()
    {
        const animations = PixelEditor.animations
        const name = this.animationName.text
        if (!name || name === 'animation name...' || name === this.original)
        {
            return
        }
        if (this.original)
        {
            animations[name] = animations[this.original]
            delete animations[this.original]
            PixelEditor.save()
        }
        else
        {
            this.original = name
            animations[name] = []
            PixelEditor.save()
        }
        this.list.visible = false
        this.disableControls(false)
    }

    changeTime()
    {
        this.time = parseInt(this.animationTime.value)
        this.draw()
    }

    select(item)
    {
        const name = item.text
        if (!name || name === 'animation name...')
        {
            this.list.visible = false
            return
        }
        this.animationName.editing = false
        this.animationName.text = name
        this.original = name
        const text = JSON.stringify(PixelEditor.animations[name])
        this.animationText.text = text.substring(1, text.length - 1)
        this.animationText.disabled = false
        this.list.visible = false
        this.disableControls(false)
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
            this.play.setAttribute('disabled', false)
            this.play.style.opacity = 1
        }
        catch (e)
        {
            this.animationError.innerHTML = e.message
            this.play.setAttribute('disabled', true)
            this.play.style.opacity = 0.25
        }
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
            this.animationName.removeChild(this.types.firstChild);
        }
        const animations = PixelEditor.animations
        for (let type in animations)
        {
            const value = type.toLowerCase()
            html({ parent: this.animationName, type: 'option', value, html: value })
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

    removeAnimation()
    {
        delete PixelEditor.animations[this.animationName.text]
        PixelEditor.save()
        this.reset()
    }

    copyAnimation()
    {
        let name = this.animationName.text
        const dashes = name.split('-')
        if (dashes.length > 1)
        {
            if (!isNaN(dashes[dashes.length - 1]))
            {
                const number = dashes[dashes.length - 1]
                name = name.replace('-' + number, '-' + (parseInt(number) + 1))
            }
            else
            {
                name += '-1'
            }
        }
        else
        {
            name += '-1'
        }
        PixelEditor.animations[name] = PixelEditor.animations[this.animationName.text]
        PixelEditor.save()
        this.animationName.text = name
        this.animationError.text = ''
        this.animationText['foreground-color'] = '0'
        this.animationText.layout()
        this.disableControls(false)
    }

    stopped()
    {
        this.change()
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
            this.win.win.display = 'none'
        }
        PixelEditor.on('changed', this.draw, this)
        // State.on('last-file', () => { this.draw(); this.height = this.maxHeight; this.reset() })
// TODO
        State.on('relative', this.draw, this)
    }

    resized()
    {
        if (this.win._resizing)
        {
            this.draw()
            State.set(this.name, this.win.x, this.win.y, this.win.width, this.win.height)
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