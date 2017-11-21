const exists = require('exists')
const UI = require('../../components/ui')
const State = require('./state')
const Settings = require('./settings')
const Dice = require('./dice')
const PixelEditor = require('./pixel-editor')

module.exports = class Coords extends UI.Window
{
    constructor()
    {
        super({ draggable: true, fit: true })
        this.nameText = this.addChild(new UI.Text('', { place: 'top-center', theme: { spacing: 2 } }))
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
        this.button = this.addChild(new UI.Button({ text: 'c' }))
        this.button.on('clicked', this.copy, this)
        this.zoom = this.addChild(new UI.EditText(PixelEditor.zoom, { beforeText: 'zoom: ', count: 2 }))
        this.zoom.on('changed', () => PixelEditor.zoom = parseInt(this.zoom.text))
        this.changed()
        this.dice = this.addChild(new Dice())
        this.stateSetup('coords')
    }

    layout()
    {
        const width = 200
        const center = width / 2
        let y = 0
        this.nameText.position.set(center - this.nameText.width / 2, y)
        y += this.nameText.height + Settings.BORDER
        this.frameWidth.position.set(0, y)
        this.frameHeight.position.set(width - this.cursorY.width, y)
        y += this.frameWidth.height + Settings.BORDER
        this.dice.position.set(center - this.dice.width / 2, y)
        this.button.position.set(width - this.button.width - Settings.BORDER, y)
        y += this.dice.height + Settings.BORDER
        this.cursorX.position.set(0, y)
        this.cursorY.position.set(width - this.cursorY.width, y)
        y += this.cursorX.height + Settings.BORDER
        this.cursorWidth.position.set(0, y)
        this.cursorHeight.position.set(width  - this.cursorHeight.width, y)
        y += this.cursorWidth.height + Settings.BORDER
        this.zoom.position.set(center - this.zoom.width / 2, y)
        super.layout()
    }

    stateSetup(name)
    {
        this.name = name
        const place = State.get(this.name)
        if (exists(place))
        {
            this.position.set(place.x, place.y)
        }
        this.on('drag-end', this.dragged, this)
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
        let relative
        if (State.relative.indexOf('center') !== -1)
        {
            relative = 'center'
        }
        else if (State.relative.indexOf('right') !== -1)
        {
            relative = 'right'
        }
        else
        {
            relative = 'left'
        }
        PixelEditor.adjustWidth(width, relative)
    }

    changeFrameHeight()
    {
        const height = parseInt(this.frameHeight.text)
        let relative
        if (State.relative.indexOf('center') !== -1)
        {
            relative = 'center'
        }
        else if (State.relative.indexOf('bottom') !== -1)
        {
            relative = 'bottom'
        }
        else
        {
            relative = 'top'
        }
        PixelEditor.adjustHeight(height, relative)
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

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }

    copy()
    {
        if (State.cursorSizeX === 1 && State.cursorSizeY === 1)
        {
            // ClipBoard.writeText('put(' + State.cursorX + ', ' + State.cursorY + ')')
        }
        else
        {
            // ClipBoard.writeText('rectFill(' + State.cursorX + ', ' + State.cursorY + ', ' + State.cursorSizeX + ', ' + State.cursorSizeY + ')')
        }
    }

    keydown(code)
    {
        if (code === 190)
        {
            this.copy()
        }
    }
}