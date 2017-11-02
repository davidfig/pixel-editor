const exists = require('exists')
const path = require('path')

const UI = require('../windows/ui')
const State = require('./state')
const Settings = require('./settings')
const Dice = require('./dice')
const PixelEditor = require('./pixel-editor')

const WIDTH = 200

module.exports = class Coords extends UI.Window
{
    constructor()
    {
        super({ draggable: true, width: WIDTH })
        this.stateSetup('coords')
        this.filename = this.addChild(new UI.Text('', { transparent: true }))
        this.frameWidth = this.addChild(new UI.EditText('', { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.frameHeight = this.addChild(new UI.EditText('', { beforeText: 'h: ', count: 3, edit: 'number' }))
        this.cursorX = this.addChild(new UI.EditText('', { beforeText: 'x: ', count: 3, edit: 'number' }))
        this.cursorY = this.addChild(new UI.EditText('', { beforeText: 'y: ', count: 3, edit: 'number' }))
        this.cursorWidth = this.addChild(new UI.EditText('', { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.cursorHeight = this.addChild(new UI.EditText('', { beforeText: 'h: ', count: 3, edit: 'number' }))
        this.changed()
        this.dice = this.addChild(new Dice())
    }

    draw()
    {
        const width = Math.max(WIDTH, this.filename.width)
        let y = Settings.BORDER
        this.filename.position.set(width / 2 - this.filename.width / 2, y)
        y += this.filename.height + Settings.BORDER
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
        this.on('drag-end', this.dragged, this)
        State.on('cursorX', this.changed, this)
        State.on('cursorY', this.changed, this)
        State.on('cursorSizeX', this.changed, this)
        State.on('cursorSizeY', this.changed, this)
        State.on('last-file', this.changed, this)
        State.on('relative', this.changed, this)
    }

    changed()
    {
        this.filename.text = path.basename(PixelEditor.filename, path.extname(PixelEditor.filename))
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

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }
}