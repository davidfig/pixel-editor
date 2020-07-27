import { Base } from './base'
import { state } from '../state'
import { ZOOM, DOTTED } from '../settings'
import PixelEditor from '../pixel-editor'

export class Crop extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        const color = 0xd20000
        this.draw.cursorBlock.position.set(state.cursorX * ZOOM, state.cursorY * ZOOM)
        this.draw.cursorBlock.lineStyle(5, color)
        const x = state.cursorSizeX + state.cursorX >= PixelEditor.width ? PixelEditor.width - state.cursorX : state.cursorSizeX
        const y = state.cursorSizeY + state.cursorY >= PixelEditor.height ? PixelEditor.height - state.cursorY : state.cursorSizeY
        let reverse = ZOOM * x < 0
        for (let i = 0; reverse ? i > ZOOM * x : i < ZOOM * x; reverse ? i -= DOTTED * 2 : i += DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - DOTTED < ZOOM * x ? ZOOM * x : i - DOTTED
            }
            else
            {
                far = i + DOTTED > ZOOM * x ? ZOOM * x : i + DOTTED
            }
            this.draw.cursorBlock.moveTo(i, 0)
            this.draw.cursorBlock.lineTo(far, 0)
            this.draw.cursorBlock.moveTo(i, ZOOM * y)
            this.draw.cursorBlock.lineTo(far, ZOOM * y)
        }
        reverse = ZOOM * y < 0
        for (let i = 0; reverse ? i > ZOOM * y : i < ZOOM * y; reverse ? i -= DOTTED * 2 : i += DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - DOTTED < ZOOM * y ? ZOOM * y : i - DOTTED
            }
            else
            {
                far = i + DOTTED > ZOOM * y ? ZOOM * y : i + DOTTED
            }
            this.draw.cursorBlock.moveTo(0, i)
            this.draw.cursorBlock.lineTo(0, far)
            this.draw.cursorBlock.moveTo(ZOOM * x, i)
            this.draw.cursorBlock.lineTo(ZOOM * x, far)
        }
    }

    space()
    {
        PixelEditor.crop(state.cursorX, state.cursorY, state.cursorSizeX, state.cursorSizeY)
        state.cursorX = 0
        state.cursorY = 0
    }
}