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
        this.draw.cursorBlock.position.set(State.cursorX * this.draw.zoom, State.cursorY * this.draw.zoom)
        this.draw.cursorBlock.lineStyle(5, color)
        const x = State.cursorSizeX + State.cursorX >= PixelEditor.width ? PixelEditor.width - State.cursorX : State.cursorSizeX
        const y = State.cursorSizeY + State.cursorY >= PixelEditor.height ? PixelEditor.height - State.cursorY : State.cursorSizeY
        this.draw.cursorBlock.drawRect(0, 0, this.draw.zoom * x, this.draw.zoom * y)
    }

    erase()
    {
        this.eraseBox()
    }

    space()
    {
        if (State.cursorSizeX === 1 && State.cursorSizeY === 1)
        {
            PixelEditor.undoSave()
            const current = PixelEditor.get(State.cursorX, State.cursorY)
            const color = (current !== State.foreground) ? State.foreground : State.background
            PixelEditor.set(State.cursorX, State.cursorY, color, true)
        }
        else
        {
            PixelEditor.undoSave()
            const color = State.foreground
            let xStart = State.cursorX, yStart = State.cursorY, xTo, yTo
            if (State.cursorSizeX < 0)
            {
                xStart += State.cursorSizeX
                xTo = xStart + Math.abs(State.cursorSizeX)
            }
            else
            {
                xTo = xStart + State.cursorSizeX
            }
            if (State.cursorSizeY < 0)
            {
                yStart += State.cursorSizeY
                yTo = yStart + Math.abs(State.cursorSizeY) - 1
            }
            else
            {
                yTo = yStart + State.cursorSizeY
            }
            for (let y = yStart; y < yTo; y++)
            {
                for (let x = xStart; x < xTo; x++)
                {
                    PixelEditor.set(x, y, color, true)
                }
            }
        }
        this.draw.change()
    }
}