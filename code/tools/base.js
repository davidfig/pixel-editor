const PixelEditor = require('../pixel-editor')
const State = require('../state')

module.exports = class Base
{
    constructor(draw)
    {
        this.draw = draw
    }

    inBounds(pos)
    {
        let x = parseInt(pos[0])
        let y = parseInt(pos[1])
        return x >= 0 && y >= 0 && x < PixelEditor.width && y < PixelEditor.height
    }

    move(x, y)
    {
        if (State.cursorSizeX < 0)
        {
            State.cursorX += State.cursorSizeX
            State.cursorSizeX = -State.cursorSizeX
        }
        if (State.cursorSizeY < 0)
        {
            State.cursorY += State.cursorSizeY
            State.cursorSizeY = -State.cursorSizeY
        }
        State.cursorX += x
        State.cursorY += y
        State.cursorX = State.cursorX < 0 ? PixelEditor.width - 1 : State.cursorX
        State.cursorY = State.cursorY < 0 ? PixelEditor.height - 1 : State.cursorY
        State.cursorX = State.cursorX === PixelEditor.width ? 0 : State.cursorX
        State.cursorY = State.cursorY === PixelEditor.height ? 0 : State.cursorY
    }

    cursor() { }

    activate() { }

    moveShift(x, y)
    {
        State.cursorSizeX += x
        State.cursorSizeX = (State.cursorSizeX > PixelEditor.width) ? PixelEditor.width : State.cursorSizeX
        State.cursorSizeX = (State.cursorSizeX < -PixelEditor.width) ? -PixelEditor.width : State.cursorSizeX
        if ((State.tool === 'circle' || State.tool === 'ellipse') && State.cursorSizeX < 1)
        {
            State.cursorSizeX = 1
        }
        if (State.tool === 'ellipse' && State.cursorSizeY < 1)
        {
            State.cursorSizeY = 1
        }
        if (State.cursorSizeX === 0)
        {
            State.cursorSizeX = (x < 0) ? -1 : 1
        }
        State.cursorSizeY += y
        State.cursorSizeY = (State.cursorSizeY > PixelEditor.height) ? PixelEditor.height : State.cursorSizeY
        State.cursorSizeY = (State.cursorSizeY < -PixelEditor.height) ? -PixelEditor.height : State.cursorSizeY
        if (State.cursorSizeY === 0)
        {
            State.cursorSizeY = (y < 0) ? -1 : 1
        }
    }

    erase()
    {
        for (let block of this.stamp)
        {
            if (block.x >= 0 && block.x < PixelEditor.width && block.y >= 0 && block.y < PixelEditor.height)
            {
                PixelEditor.set(block.x, block.y, '00000000', true)
            }
        }
    }

    eraseBox()
    {
        for (let y = State.cursorY; y < State.cursorY + State.cursorSizeY; y++)
        {
            for (let x = State.cursorX; x < State.cursorX + State.cursorSizeX; x++)
            {
                if (x >= 0 && x < PixelEditor.width && y >= 0 && y < PixelEditor.height)
                {
                    PixelEditor.set(x, y, '00000000', true)
                }
            }
        }
    }

    drawStamp()
    {
        PixelEditor.undoSave()
        for (let block of this.stamp)
        {
            if (block.x >= 0 && block.x < PixelEditor.width && block.y >= 0 && block.y < PixelEditor.height)
            {
                PixelEditor.set(block.x, block.y, block.color, true)
            }
        }
        this.change()
    }

    clear()
    {
        if (State.cursorSizeX < 0)
        {
            State.cursorX += State.cursorSizeX
        }
        if (State.cursorSizeY < 0)
        {
            State.cursorY += State.cursorSizeY
        }
        if (State.cursorSizeX === 1 && State.cursorSizeY === 1)
        {
            State.cursorX = 0
            State.cursorY = 0
        }
        else
        {
            State.cursorSizeX = 1
            State.cursorSizeY = 1
        }
    }
}