const Base = require('./base')
const State = require('../state')
const PixelEditor = require('../pixel-editor')
const Settings = require('../settings')

const COLOR = 0x888888

module.exports = class Line extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        this.draw.cursorBlock.position.set(State.cursorX * Settings.ZOOM, State.cursorY * Settings.ZOOM)
        this.draw.cursorBlock.lineStyle(10, COLOR)
        this.draw.cursorBlock.drawRect(0, 0, Settings.ZOOM, Settings.ZOOM)
    }

    space()
    {
        State.color = PixelEditor.get(State.cursorX, State.cursorY)
    }
}