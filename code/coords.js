const exists = require('exists')

const UI = require('../windows/ui')
const State = require('./state')
const Settings = require('./settings')
const Dice = require('./dice')

const WIDTH = 200

module.exports = class Coords extends UI.Window
{
    constructor()
    {
        super({ draggable: true, width: WIDTH })
        this.stateSetup('coords')
        this.cursorX = this.addChild(new UI.EditText(State.cursorX, { beforeText: 'x: ', count: 3, edit: 'number' }))
        this.cursorY = this.addChild(new UI.EditText(State.cursorY, { beforeText: 'y: ', count: 3, edit: 'number' }))
        this.cursorWidth = this.addChild(new UI.EditText(State.cursorSizeX, { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.cursorHeight = this.addChild(new UI.EditText(State.cursorSizeY, { beforeText: 'h: ', count: 3, edit: 'number' }))
        this.dice = this.addChild(new Dice())
    }

    draw()
    {
        let y = Settings.BORDER
        this.cursorX.position.set(Settings.BORDER, y)
        this.cursorY.position.set(WIDTH - Settings.BORDER - this.cursorY.width, y)
        y += this.cursorX.height + Settings.BORDER
        this.cursorWidth.position.set(Settings.BORDER, y)
        this.cursorHeight.position.set(WIDTH - Settings.BORDER - this.cursorHeight.width, y)
        y += this.cursorWidth.height + Settings.BORDER
        this.dice.position.set(WIDTH / 2 - this.dice.width / 2, y)
        y += this.dice.height + Settings.BORDER
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