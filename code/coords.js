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
        this.filename = this.addChild(new UI.Text(path.basename(PixelEditor.filename, path.extname(PixelEditor.filename)), { transparent: true }))
        this.frameWidth = this.addChild(new UI.EditText(PixelEditor.width, { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.frameHeight = this.addChild(new UI.EditText(PixelEditor.height, { beforeText: 'h: ', count: 3, edit: 'number' }))
        this.cursorX = this.addChild(new UI.EditText(State.cursorX, { beforeText: 'x: ', count: 3, edit: 'number' }))
        this.cursorY = this.addChild(new UI.EditText(State.cursorY, { beforeText: 'y: ', count: 3, edit: 'number' }))
        this.cursorWidth = this.addChild(new UI.EditText(State.cursorSizeX, { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.cursorHeight = this.addChild(new UI.EditText(State.cursorSizeY, { beforeText: 'h: ', count: 3, edit: 'number' }))
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
        State.on('cursorX', () => this.dirty = true)
        State.on('cursorY', () => this.dirty = true)
        State.on('cursorWidth', () => this.dirty = true)
        State.on('cursorHeight', () => this.dirty = true)
    }

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }
}