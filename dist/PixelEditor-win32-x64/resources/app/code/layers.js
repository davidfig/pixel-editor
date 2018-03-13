const Settings = require('./settings')

const exists = require('exists')

const UI = require(Settings.UI)
const State = require('./state')
const PixelEditor = require('./pixel-editor')

const WIDTH = 200

module.exports = class Coords extends UI.Window
{
    constructor()
    {
        super({ draggable: true, width: WIDTH })
        this.stateSetup('coords')
        this.nameText = this.addChild(new UI.Text('', { transparent: true }))
        this.frameWidth = this.addChild(new UI.EditText('', { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.frameWidth.on('changed', this.changeFrameWidth, this)
        this.frameHeight = this.addChild(new UI.EditText('', { beforeText: 'h: ', count: 3, edit: 'number' }))
        this.frameHeight.on('changed', this.changeFrameHeight, this)
        this.cursorX = this.addChild(new UI.EditText('', { beforeText: 'x: ', count: 3, edit: 'number' }))
        this.cursorX.on('changed', this.changeCursorX, this)
        this.cursorY = this.addChild(new UI.EditText('', { beforeText: 'y: ', count: 3, edit: 'number' }))
        this.cursorY.on('changed', this.changeCursorY, this)
        this.cursorWidth = this.addChild(new UI.EditText('', { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.cursorWidth.on('changed', () => State.cursorSizeX = parseInt(this.cursorWidth.text))
        this.cursorHeight = this.addChild(new UI.EditText('', { beforeText: 'h: ', count: 3, edit: 'number' }))
        this.cursorHeight.on('changed', () => State.cursorSizeY = parseInt(this.cursorHeight.text))
        this.changed()
        this.dice = this.addChild(new Dice())
    }

    draw()
    {
        const width = Math.max(WIDTH, this.nameText.width)
        let y = Settings.BORDER
        this.nameText.position.set(width / 2 - this.nameText.width / 2, y)
        y += this.nameText.height + Settings.BORDER
        this.frameWidth.position.set(Settings.BORDER, y)
        this.frameHeight.position.set(width - Settings.BORDER - this.cursorY.width, y)
        y += this.frameWidth.height + Settings.BORDER
        this.dice.position.set(width / 2 - this.dice.width / 2, y)
        y += this.dice.height + Settings.BORDER
        this.cursorX.position.set(Settings.BORDER, y)
        this.cursorY.position.set(width - Settings.BORDER - this.cursorY.width, y)
        y += this.cursorX.height + Settings.BORDER
        this.cursorWidth.position.set(Settings.BORDER, y)
        this.cursorHeight.position.set(width - Settings.BORDER - this.cursorHeight.width, y)
        y += this.cursorWidth.height + Settings.BORDER
        this.height = y
        super.draw()
    }

    stateSetup(name)
    {
        this.name = name
        const place = State.get(this.name)
        if (exists(place))
        {
            this.position.set(place.x, place.y)
        }
        State.on('cursorX', this.changed, this)
        State.on('cursorY', this.changed, this)
        State.on('cursorSizeX', this.changed, this)
        State.on('cursorSizeY', this.changed, this)
        State.on('last-file', this.changed, this)
        State.on('relative', this.changed, this)
        PixelEditor.on('changed', this.changed, this)
    }

    changed()
    {
        this.nameText.text = PixelEditor.name
        this.frameWidth.text = PixelEditor.width
        this.frameHeight.text = PixelEditor.height
        let x, y
        switch (State.relative)
        {
            case 'top-right':
                x = PixelEditor.width - State.cursorX - 1
                y = State.cursorY
                break
            case 'center':
                x = State.cursorX - Math.floor(PixelEditor.width / 2)
                y = State.cursorY - Math.floor(PixelEditor.height / 2)
                break
            case 'bottom-left':
                x = State.cursorX
                y = PixelEditor.height - State.cursorY - 1
                break
            case 'bottom-right':
                x = PixelEditor.width - State.cursorX - 1
                y = PixelEditor.height - State.cursorY - 1
                break
            default:
                x = State.cursorX
                y = State.cursorY
        }
        this.cursorX.text = x
        this.cursorY.text = y
        this.cursorWidth.text = State.cursorSizeX
        this.cursorHeight.text = State.cursorSizeY
        this.dirty = true
    }

    changeFrameWidth()
    {
        const width = parseInt(this.frameWidth.text)
        PixelEditor.width = width
    }

    changeFrameHeight()
    {
        const height = parseInt(this.frameHeight.text)
        PixelEditor.height = height
    }

    changeCursorX()
    {
        let x = parseInt(this.cursorX.text)
        switch (State.relative)
        {
            case 'top-right': case 'bottom-right': State.cursorX = PixelEditor.width - x - 1; break
            case 'center': State.cursorX = x + Math.floor(PixelEditor.width / 2); break
            default: State.cursorX = x
        }
    }

    changeCursorY()
    {
        let y = parseInt(this.cursorY.text)
        switch (State.relative)
        {
            case 'bottom-right': case 'bottom-left': State.cursorY = PixelEditor.height - y - 1; break
            case 'center': State.cursorY = y + Math.floor(PixelEditor.width / 2); break
            default: State.cursorY = y
        }
    }
}