import { Base } from './base'
import { state } from '../state'
import { CURSOR_COLOR, ZOOM } from '../settings'
import PixelEditor from '../pixel-editor'

export class Paint extends Base
{
    constructor(draw)
    {
        super(draw)
        document.body.addEventListener('keyup', (e) => this.keyup(e))
    }

    cursor()
    {
        const color = state.foreground.substr(6) === '00' ? CURSOR_COLOR : parseInt(state.foreground.substr(0, 6), 16)
        this.draw.cursorBlock.position.set(state.cursorX * ZOOM, state.cursorY * ZOOM)
        this.draw.cursorBlock.lineStyle(5, color)
        const x = state.cursorSizeX + state.cursorX >= PixelEditor.width ? PixelEditor.width - state.cursorX : state.cursorSizeX
        const y = state.cursorSizeY + state.cursorY >= PixelEditor.height ? PixelEditor.height - state.cursorY : state.cursorSizeY
        this.draw.cursorBlock.drawRect(0, 0, ZOOM * x, ZOOM * y)
    }

    erase()
    {
        this.eraseBox()
    }

    keyup(e)
    {
        if (e.code === 'Space')
        {
            this.spacing = null
        }
    }

    move(x, y)
    {
        super.move(x, y)
        if (this.spacing)
        {
            this.space()
        }
    }

    space()
    {
        if (this.spacing && state.cursorX === this.spacing.x && state.cursorY === this.spacing.y)
        {
            return
        }
        if (state.cursorSizeX === 1 && state.cursorSizeY === 1)
        {
            PixelEditor.undoSave()
            const current = PixelEditor.get(state.cursorX, state.cursorY)
            const color = (current !== state.foreground) ? state.foreground : state.background
            PixelEditor.set(state.cursorX, state.cursorY, color, true)
        }
        else
        {
            PixelEditor.undoSave()
            const color = state.foreground
            let xStart = state.cursorX, yStart = state.cursorY, xTo, yTo
            if (state.cursorSizeX < 0)
            {
                xStart += state.cursorSizeX
                xTo = xStart + Math.abs(state.cursorSizeX)
            }
            else
            {
                xTo = xStart + state.cursorSizeX
            }
            if (state.cursorSizeY < 0)
            {
                yStart += state.cursorSizeY
                yTo = yStart + Math.abs(state.cursorSizeY) - 1
            }
            else
            {
                yTo = yStart + state.cursorSizeY
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
        this.spacing = { x: state.cursorX, y: state.cursorY }
    }
}