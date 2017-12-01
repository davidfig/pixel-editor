const PIXI = require('pixi.js')
const RenderSheet = require('yy-rendersheet')
// const Pixel = require('yy-pixel').Pixel
const Pixel = require('../../components/pixel').Pixel
const exists = require('exists')
const Loop = require('yy-loop')

const UI = require('yy-ui')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Settings = require('./settings')
const sheet = require('./pixel-sheet')

const MIN_WIDTH = 200
const MIN_HEIGHT = 200

const BUTTONS = require('../images/animation.json')

module.exports = class Animation extends UI.Window
{
    constructor()
    {
        super({ draggable: true, resizeable: true })
        this.buttons = this.addChild(new PIXI.Container())
        this.numbers = [true]
        this.current = 0
        this.time = 0
        this.loop = new Loop({ pauseOnBlur: true })
        this.loop.interval(this.update.bind(this))
        this.sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST })
        Pixel.add(BUTTONS, this.sheet)
        this.play = this.addChild(new UI.Button({ sprite: this.sheet.get('animation-0') }))
        this.play.sprite.anchor.set(0)
        this.play.sprite.scale.set(2)
        this.play.on('pressed', this.change, this)
        this.play.disabled = true
        this.playing = false
        this.animationName = this.addChild(new UI.EditText('animation name...'))
        this.animationName.on('editing', this.showNames, this)
        this.animationName.on('changed', this.changeName, this)
        this.animationName.on('lose-focus', () => this.list.visible = false)
        this.animationText = this.addChild(new UI.EditText('enter data here...', { full: true }))
        this.animationText.on('changed', this.changeText, this)
        this.animationText.disabled = true
        this.animationError = this.addChild(new UI.Text(''))
        this.animationError['foreground-color'] = '#ff0000'
        this.list = this.special.addChild(new UI.List({ transparent: false, theme: { between: 0, spacing: 2 } }))
        this.list.visible = false
        this.list.on('select', this.select, this)
        this.newButton = new UI.Button({ sprite: this.sheet.get('animation-4') })
        this.newButton.on('clicked', this.reset, this)
        this.copyButton = new UI.Button({ sprite: this.sheet.get('animation-3') })
        this.copyButton.on('clicked', this.copyAnimation, this)
        this.deleteButton = new UI.Button({ sprite: this.sheet.get('animation-2') })
        this.deleteButton.on('clicked', this.removeAnimation, this)
        this.buttons = this.addChild(new UI.Stack([this.newButton, this.copyButton, this.deleteButton], { horizontal: true }))
        for (let button of this.buttons.items)
        {
            button.sprite.anchor.set(0)
            button.sprite.scale.set(2)
        }
        this.disableControls(true)
        this.sheet.render()
        this.stateSetup('animation')
        this.layout()
        this.height = this.maxHeight
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
        this.drawPlay()
        if (this.playing)
        {
            this.change()
        }
    }

    layout()
    {
        this.draw()
        super.layout()
    }

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
        this.pixel = this.addChild(new Pixel(PixelEditor.getData(), sheet))
        this.pixel.on('stop', this.stopped, this)
        this.pixel.scale.set(PixelEditor.zoom)
        this.pixel.frame(0)
        const split = State.relative.split('-')
        this.pixel.anchor.x = split[1] === 'left' ? 0 : split[1] === 'right' ? 1 : 0.5
        this.pixel.anchor.y = split[0] === 'top' ? 0 : split[0] === 'bottom' ? 1 : 0.5
        this.pixel.position.set(PixelEditor.largestWidth * PixelEditor.zoom * this.pixel.anchor.x, PixelEditor.largestHeight * PixelEditor.zoom * this.pixel.anchor.y)
    }

    drawPlay()
    {
        this.play.position.set(this.right - this.play.width, 0)
        this.animationName.y = this.pixel.y + (1 - this.pixel.anchor.y) * PixelEditor.maxHeight * PixelEditor.zoom + Settings.BORDER
        this.animationText.y = this.animationName.y + this.animationName.height + Settings.BORDER
        this.animationText.width = this.animationError.width = this.right
        this.animationText.height = this.animationText.height = this.animationName.height
        this.animationError.y = this.animationText.y + this.animationText.height + Settings.BORDER
        this.list.y = this.animationName.y + this.animationName.height + Settings.BORDER * 2
        this.list.x = this.get('spacing')
        this.buttons.y = this.animationError.y + this.animationError.height + Settings.BORDER
        this.maxHeight = this.buttons.y + this.buttons.height + Settings.BORDER + this.get('spacing') * 2
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
                this.list.add(new UI.Text(key))
            }
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
                this.dirty = true
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
        this.on('resize-end', this.dragged, this)
        PixelEditor.on('changed', this.layout, this)
        State.on('last-file', () => { this.draw(); this.height = this.maxHeight; this.reset() })
        State.on('relative', this.drawAnimation, this)
    }

    dragged()
    {
        State.set(this.name, this.x, this.y, this.width, this.height)
    }
}