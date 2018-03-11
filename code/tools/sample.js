const Base = require('./base')
const State = require('../state')
const PixelEditor = require('../pixel-editor')

const COLOR = 0x888888

module.exports = class Line extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        this.draw.cursorBlock.position.set(State.cursorX * this.draw.zoom, State.cursorY * this.draw.zoom)
        this.draw.cursorBlock.lineStyle(10, COLOR)
        this.draw.cursorBlock.drawRect(0, 0, this.draw.zoom, this.draw.zoom)
    }

    space()
    {
        State.color = PixelEditor.get(State.cursorX, State.cursorY)
    }
}