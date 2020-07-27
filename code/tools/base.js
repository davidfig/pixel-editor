import PixelEditor from '../pixel-editor'
import { state } from '../state'

export class Base
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
        if (state.cursorSizeX < 0)
        {
            state.cursorX += state.cursorSizeX
            state.cursorSizeX = -state.cursorSizeX
        }
        if (state.cursorSizeY < 0)
        {
            state.cursorY += state.cursorSizeY
            state.cursorSizeY = -state.cursorSizeY
        }
        state.cursorX += x
        state.cursorY += y
        state.cursorX = state.cursorX < 0 ? PixelEditor.width - 1 : state.cursorX
        state.cursorY = state.cursorY < 0 ? PixelEditor.height - 1 : state.cursorY
        state.cursorX = state.cursorX === PixelEditor.width ? 0 : state.cursorX
        state.cursorY = state.cursorY === PixelEditor.height ? 0 : state.cursorY
    }

    cursor() { }

    activate() { }

    moveShift(x, y)
    {
        state.cursorSizeX += x
        state.cursorSizeX = (state.cursorSizeX > PixelEditor.width) ? PixelEditor.width : state.cursorSizeX
        state.cursorSizeX = (state.cursorSizeX < -PixelEditor.width) ? -PixelEditor.width : state.cursorSizeX
        if ((state.tool === 'circle' || state.tool === 'ellipse') && state.cursorSizeX < 1)
        {
            state.cursorSizeX = 1
        }
        if (state.tool === 'ellipse' && state.cursorSizeY < 1)
        {
            state.cursorSizeY = 1
        }
        if (state.cursorSizeX === 0)
        {
            state.cursorSizeX = (x < 0) ? -1 : 1
        }
        state.cursorSizeY += y
        state.cursorSizeY = (state.cursorSizeY > PixelEditor.height) ? PixelEditor.height : state.cursorSizeY
        state.cursorSizeY = (state.cursorSizeY < -PixelEditor.height) ? -PixelEditor.height : state.cursorSizeY
        if (state.cursorSizeY === 0)
        {
            state.cursorSizeY = (y < 0) ? -1 : 1
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
        for (let y = state.cursorY; y < state.cursorY + state.cursorSizeY; y++)
        {
            for (let x = state.cursorX; x < state.cursorX + state.cursorSizeX; x++)
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
    }

    clear()
    {
        if (state.cursorSizeX < 0)
        {
            state.cursorX += state.cursorSizeX
        }
        if (state.cursorSizeY < 0)
        {
            state.cursorY += state.cursorSizeY
        }
        if (state.cursorSizeX === 1 && state.cursorSizeY === 1)
        {
            state.cursorX = 0
            state.cursorY = 0
        }
        else
        {
            state.cursorSizeX = 1
            state.cursorSizeY = 1
        }
    }
}