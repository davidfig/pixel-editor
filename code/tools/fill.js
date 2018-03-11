const Base = require('./base')
const State = require('../state')
const Settings = require('../settings')
const PixelEditor = require('../pixel-editor')

module.exports = class Line extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        const color = State.foreground.substr(6) === '00' ? Settings.CURSOR_COLOR : parseInt(State.foreground.substr(0, 6), 16)
        this.draw.cursorBlock.position.set(State.cursorX * Settings.ZOOM, State.cursorY * Settings.ZOOM)
        this.draw.cursorBlock.lineStyle(10, color)
        this.draw.cursorBlock.drawRect(0, 0, Settings.ZOOM, Settings.ZOOM)
    }

    erase()
    {
        this.eraseBox()
    }

    floodFill(x, y, check)
    {
        if (check !== State.color && PixelEditor.get(x, y) === check)
        {
            PixelEditor.set(x, y, State.color, true)
            if (y > 0)
            {
                this.floodFill(x, y - 1, check)
            }
            if (y < PixelEditor.height - 1)
            {
                this.floodFill(x, y + 1, check)
            }
            if (x > 0)
            {
                this.floodFill(x - 1, y, check)
            }
            if (x < PixelEditor.width - 1)
            {
                this.floodFill(x + 1, y, check)
            }
        }
    }

    space()
    {
        PixelEditor.undoSave()
        this.floodFill(State.cursorX, State.cursorY, PixelEditor.get(State.cursorX, State.cursorY))
        this.draw.change()
    }
}