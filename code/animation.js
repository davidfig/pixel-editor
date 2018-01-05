const Settings = require('./settings')

const PIXI = require('pixi.js')
const RenderSheet = require(Settings.YY_RENDERSHEET)
const Pixel = require(Settings.YY_PIXEL).Pixel
const exists = require('exists')

const State = require('./state')
const PixelEditor = require('./pixel-editor')
const sheet = require('./pixel-sheet')

const MIN_WIDTH = 200
const MIN_HEIGHT = 200

const SPACING = 10

const BUTTONS = require('../images/animation.json')

module.exports = class Animation extends PIXI.Container
{
    constructor(ui)
    {
        super()
        this.ui = ui

        this.buttons = this.addChild(new PIXI.Container())
        this.numbers = [true]
        this.current = 0
        this.time = 0

        this.sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        Pixel.add(BUTTONS, this.sheet)

        // this.play = this.addChild(new UI.Button({ sprite: this.sheet.get('animation-0') }))
        // this.play.sprite.anchor.set(0)
        // this.play.sprite.scale.set(2)
        // this.play.on('pressed', this.change, this)
        // this.play.disabled = true
        // this.playing = false
        // this.animationName = this.addChild(new UI.EditText('animation name...'))
        // this.animationName.on('editing', this.showNames, this)
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
        this.sheet.render(this.afterLoad.bind(this))
    }

    afterLoad()
    {
        this.win = this.ui.createWindow({ height: MIN_HEIGHT, width: MIN_WIDTH })
        this.win.open()

        this.content = this.win.content
        this.content.style.margin = '0.25em'
        this.renderer = new PIXI.WebGLRenderer({ resolution: window.devicePixelRatio, transparent: true })
        this.content.appendChild(this.renderer.view)

        // this.renderer.view.style.width = this.content.offsetWidth
        // this.renderer.view.style.height = this.content.offsetHeight + 'px'
        // const height = this.alpha.y + this.alpha.height
        // this.renderer.view.height = height
        // this.renderer.view.style.height = height + 'px'
        // this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)

        this.stateSetup('animation')

        this.renderer.resize(this.content.offsetWidth, this.content.offsetHeight)
        this.renderer.view.style.width = this.content.offsetWidth + 'px'
        this.renderer.view.style.height = this.content.offsetHeight + 'px'

        this.draw()

        PIXI.ticker.shared.add(() => this.update(PIXI.ticker.shared.elapsedMS))
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

    draw()
    {
        this.drawAnimation()
        this.drawButtons()

        // this.drawPlay()
        // if (this.playing)
        // {
        //     this.change()
        // }

        this.renderer.render(this)
    }

    button(name)
    {
        const button = this.addChild(new PIXI.Container())
        button.background = button.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        button.sprite = button.addChild(this.sheet.get(name))
        button.sprite.anchor.set(0.5)
        button.sprite.scale.set(2)
        button.background.width = button.sprite.width * 1.5
        button.background.height = button.sprite.height * 1.5
        button.sprite.position.set(button.background.width / 2, button.background.height / 2)
        button.interactive = true
        button.on('pointertap', () => this.pressed(button))
        return button
    }

    pressed(button)
    {

    }

    resize()
    {
        const width = this.content.offsetWidth
        for (let i = 0; i < this.buttons.children.length; i++)
        {
            const button = this.buttons.children[i]
            button.x = (button.width + 2) * i
        }
        this.buttons.position.set(width / 2 - this.buttons.width / 2, this.pixel.largestHeight() * PixelEditor.zoom + SPACING)
    }

    drawButtons()
    {
        this.buttons = this.addChild(new PIXI.Container())
        this.buttons.addChild(this.button('animation-0'))
        this.buttons.addChild(this.button('animation-4'))
        this.buttons.addChild(this.button('animation-3'))
        this.buttons.addChild(this.button('animation-2'))

        this.resize()

        // this.newButton = new UI.Button({ sprite: this.sheet.get('animation-4') })
        // this.newButton.on('clicked', this.reset, this)
        // this.copyButton = new UI.Button({ sprite: this.sheet.get('animation-3') })
        // this.copyButton.on('clicked', this.copyAnimation, this)
        // this.deleteButton = new UI.Button({ sprite: this.sheet.get('animation-2') })
        // this.deleteButton.on('clicked', this.removeAnimation, this)

    }

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

    change()
    {
        if (this.playing)
        {
            this.playing = false
            this.play.sprite.texture = this.sheet.getTexture('animation-0')
            this.pixel.stop()
        }
        else
        {
            this.playing = true
            this.play.sprite.texture = this.sheet.getTexture('animation-1')
            this.pixel.animate(this.animationName.text)
        }
        this.dirty = true
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
        this.time = parseInt(this.animationTime.text)
        this.drawAnimation()
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
        const name = this.animationName.text
        try
        {
            const data = JSON.parse('[' + this.animationText.text + ']')
            animations[name] = data
            this.animationError.text = ''
            this.animationText['foreground-color'] = '0'
            this.animationText.layout()
            PixelEditor.save()
        }
        catch (e)
        {
            this.animationError.text = e.message
            this.animationText['foreground-color'] = '#ff0000'
            this.animationText.layout()
            this.play.disabled = true
        }
    }

    drawAnimation()
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
    }

    showNames()
    {
        const animations = PixelEditor.animations
        if (Object.keys(animations).length)
        {
            this.list.visible = true
            this.list.clear()
            for (let key in animations)
            {
                this.list.add(new UI.Text(key), true)
            }
            this.list.layout()
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
        State.on('relative', this.drawAnimation, this)
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