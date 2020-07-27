import { Base } from './base'
import { state } from '../state'
import { ZOOM } from '../settings'

export class Circle extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        this.draw.cursorBlock.lineStyle(0)
        this.draw.cursorBlock.position.set(0, 0)
        let x0 = state.cursorX
        let y0 = state.cursorY
        const foreground = state.foreground
        const background = state.background
        const blocks = {}
        if (state.cursorSizeX === 3)
        {
            blocks[x0 + ',' + (y0 - 1)] = foreground
            blocks[x0 + ',' + y0] = background
            blocks[x0 + ',' + (y0 + 1)] = foreground
            blocks[(x0 - 1) + ',' + y0] = foreground
            blocks[(x0 + 1) + ',' + y0] = foreground
        }
        else
        {
            const even = state.cursorSizeX % 2 === 0 ? 1 : 0
            let x = Math.ceil(state.cursorSizeX / 2) - 1
            let y = 0
            let decisionOver2 = 1 - x   // Decision criterion divided by 2 evaluated at x=r, y=0

            // draw inside
            if (parseInt(state.background.substr(6), 16) !== 0)
            {
                while (x >= y)
                {
                    for (let i = 0; i <= x; i++)
                    {
                        blocks[(x0 + x - i) + ',' + (y0 + y + even)] = background
                        blocks[(x0 - x - even + i) + ',' + (y0 + y + even)] = background
                        blocks[(x0 - y - even) + ',' + (y0 + x + even - i)] = background
                        blocks[(x0 - x - even + i) + ',' + (y0 - y)] = background
                        blocks[(x0 + x - i) + ',' + (y0 - y)] = background
                    }
                    for (let i = 0; i <= y; i++)
                    {
                        blocks[(x0 + y - i) + ',' + (y0 + x + even)] = background
                        blocks[(x0 - y - even + i) + ',' + (y0 - x)] = background
                        blocks[(x0 + y - i) + ',' + (y0 - x)] = background
                    }
                    y++
                    if (decisionOver2 <= 0)
                    {
                        decisionOver2 += 2 * y + 1
                    }
                    else
                    {
                        x--
                        decisionOver2 += 2 * (y - x) + 1
                    }
                }
            }

            // draw outside
            if (parseInt(state.foreground.substr(6), 16) !== 0)
            {
                x = Math.ceil(state.cursorSizeX / 2) - 1
                y = 0
                decisionOver2 = 1 - x   // Decision criterion divided by 2 evaluated at x=r, y=0
                while (x >= y)
                {
                    blocks[(x0 + x) + ',' + (y0 + y + even)] = foreground
                    blocks[(x0 + y) + ',' + (y0 + x + even)] = foreground
                    blocks[(x0 - y - even) + ',' + (y0 + x + even)] = foreground
                    blocks[(x0 - x - even) + ',' + (y0 + y + even)] = foreground
                    blocks[(x0 - x - even) + ',' + (y0 - y)] = foreground
                    blocks[(x0 - y - even) + ',' + (y0 - x)] = foreground
                    blocks[(x0 + y) + ',' + (y0 - x)] = foreground
                    blocks[(x0 + x) + ',' + (y0 - y)] = foreground
                    y++
                    if (decisionOver2 <= 0)
                    {
                        decisionOver2 += 2 * y + 1
                    }
                    else
                    {
                        x--
                        decisionOver2 += 2 * (y - x) + 1
                    }
                }
            }
        }
        if (state.cursorSizeX === 4)
        {
            blocks[(x0 - 2) + ',' + (y0 - 1)] = false
            blocks[(x0 + 1) + ',' + (y0 - 1)] = false
            blocks[(x0 - 2) + ',' + (y0 + 2)] = false
            blocks[(x0 + 1) + ',' + (y0 + 2)] = false
        }
        this.stamp = []
        for (let block in blocks)
        {
            const data = blocks[block]
            if (data)
            {
                const pos = block.split(',')
                if (this.inBounds(pos))
                {
                    const data = blocks[block]
                    const color = parseInt(data.substr(0, 6), 16)
                    const alpha = parseInt(data.substr(6), 16) / 255
                    this.draw.cursorBlock.beginFill(color, alpha).drawRect(parseInt(pos[0]) * ZOOM, parseInt(pos[1]) * ZOOM, ZOOM, ZOOM).endFill()
                    this.stamp.push({ x: parseInt(pos[0]), y: parseInt([pos[1]]), color: data })
                }
            }
        }
    }

    activate()
    {
        if (state.cursorSizeX === 1)
        {
            state.cursorSizeX = 3
        }
    }

    space()
    {
        this.drawStamp()
    }
}