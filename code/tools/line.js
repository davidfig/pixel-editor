import { Base } from './base'
import { state } from '../state'
import { ZOOM, BORDER } from '../settings'
import PixelEditor from '../pixel-editor'

export class Line extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        const color = state.color
        const c = parseInt(color.substr(0, 6), 16)
        const a = parseInt(color.substr(6), 16) / 255
        this.draw.cursorBlock.position.set(0)
        if (this.draw.line)
        {
            this.stamp = []
            let x0 = state.cursorX
            let y0 = state.cursorY
            let x1 = this.draw.line.x
            let y1 = this.draw.line.y

            const dx = Math.abs(x1 - x0)
            const dy = Math.abs(y1 - y0)
            const sx = x0 < x1 ? 1 : -1
            const sy = y0 < y1 ? 1 : -1
            let err = dx - dy
            let e2
            while (true)
            {
                this.draw.cursorBlock.beginFill(c, a)
                    .drawRect(x0 * ZOOM - BORDER, y0 * ZOOM - BORDER, ZOOM + BORDER * 2, ZOOM + BORDER * 2)
                    .endFill()
                this.stamp.push({ x: x0, y: y0 })
                if (x0 == x1 && y0 == y1)
                {
                    break
                }
                e2 = 2 * err
                if (e2 > -dy)
                {
                    err -= dy
                    x0 += sx
                }
                if (e2 < dx)
                {
                    err += dx
                    y0 += sy
                }
            }
        }
        else
        {
            this.draw.cursorBlock.beginFill(c, a)
                .drawRect(state.cursorX * ZOOM - BORDER, state.cursorY * ZOOM - BORDER, ZOOM + BORDER * 2, ZOOM + BORDER * 2)
                .endFill()
            this.stamp = [{ x: state.cursorX, y: state.cursorY, color }]
        }
    }

    moveShift(x, y)
    {
        if (!this.draw.line)
        {
            this.draw.line = { x: state.cursorX, y: state.cursorY }
        }
        this.draw.line.x += x
        this.draw.line.y += y
        this.draw.line.x = this.draw.line.x < 0 ? PixelEditor.width - 1 : this.draw.line.x
        this.draw.line.y = this.draw.line.y < 0 ? PixelEditor.height - 1 : this.draw.line.y
        this.draw.line.x = this.draw.line.x === PixelEditor.width ? 0 : this.draw.line.x
        this.draw.line.y = this.draw.line.y === PixelEditor.height ? 0 : this.draw.line.y
    }

    activate()
    {
        this.line = null
    }

    space()
    {
        this.drawStamp()
    }
}