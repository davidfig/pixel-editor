import { Base } from './base'
import { state } from '../state'
import { CURSOR_COLOR, ZOOM } from '../settings'
import PixelEditor from '../pixel-editor'

export class Fill extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        const color = state.foreground.substr(6) === '00' ? CURSOR_COLOR : parseInt(state.foreground.substr(0, 6), 16)
        this.draw.cursorBlock.position.set(state.cursorX * ZOOM, state.cursorY * ZOOM)
        this.draw.cursorBlock.lineStyle(10, color)
        this.draw.cursorBlock.drawRect(0, 0, ZOOM, ZOOM)
    }

    erase()
    {
        this.eraseBox()
    }

    floodFill(x, y, check)
    {
        if (check !== state.color && PixelEditor.get(x, y) === check)
        {
            PixelEditor.set(x, y, state.color, true)
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
        this.floodFill(state.cursorX, state.cursorY, PixelEditor.get(state.cursorX, state.cursorY))
        this.draw.change()
    }
}