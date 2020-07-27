import { Base } from './base'
import { state } from '../state'
import { ZOOM } from '../settings'

export class Ellipse extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        const foreground = state.foreground
        const background = state.background
        this.draw.cursorBlock.lineStyle(0)
        this.draw.cursorBlock.position.set(0, 0)
        let xc = state.cursorX
        let yc = state.cursorY
        let width = state.cursorSizeX
        let height = state.cursorSizeY

        const blocks = {}
        if (width === 1)
        {
            height--
            for (let y = -height / 2; y <= height / 2; y++)
            {
                blocks[xc + ',' + (yc + y)] = foreground
            }
        }
        else if (height === 1)
        {
            width--
            for (let x = -width / 2; x <= width / 2; x++)
            {
                blocks[(xc + x) + ',' + yc] = foreground
            }
        }
        else
        {
            const evenX = state.cursorSizeX % 2 === 0 ? 1 : 0
            const evenY = state.cursorSizeY % 2 === 0 ? 1 : 0
            width = Math.floor(state.cursorSizeX / 2)
            height = Math.floor(state.cursorSizeY / 2)
            let a2 = width * width
            let b2 = height * height
            let fa2 = 4 * a2, fb2 = 4 * b2
            let x, y, sigma

            // draw inside of ellipse
            if (parseInt(state.background.substr(6), 16) !== 0)
            {
                for (x = 0, y = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * x <= a2 * y; x++)
                {
                    for (let xx = -x + evenX; xx <= x; xx++)
                    {
                        blocks[(xc + xx) + ',' + (yc - y)] = background
                        blocks[(xc + xx) + ',' + (yc + y - evenY)] = background
                    }
                    if (sigma >= 0)
                    {
                        sigma += fa2 * (1 - y)
                        y--
                    }
                    sigma += b2 * ((4 * x) + 6)
                }

                for (x = width, y = 0, sigma = 2 * a2 + b2 * (1 - 2 * width); a2 * y <= b2 * x; y++)
                {
                    for (let xx = -x + evenX; xx <= x; xx++)
                    {
                        blocks[(xc + xx) + ',' + (yc - y)] = background
                        blocks[(xc + xx) + ',' + (yc + y - evenY)] = background
                    }
                    if (sigma >= 0)
                    {
                        sigma += fb2 * (1 - x)
                        x--
                    }
                    sigma += a2 * ((4 * y) + 6)
                }
            }

            // outside of ellipse
            if (parseInt(state.foreground.substr(6), 16) !== 0)
            {
                for (x = 0, y = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * x <= a2 * y; x++)
                {
                    blocks[(xc - x + evenX) + ',' + (yc - y)] = foreground // 2
                    blocks[(xc + x) + ',' + (yc - y)] = foreground // 1
                    blocks[(xc - x + evenX) + ',' + (yc + y - evenY)] = foreground // 3
                    blocks[(xc + x) + ',' + (yc + y - evenY)] = foreground // 4
                    if (sigma >= 0)
                    {
                        sigma += fa2 * (1 - y)
                        y--
                    }
                    sigma += b2 * ((4 * x) + 6)
                }

                for (x = width, y = 0, sigma = 2 * a2 + b2 * (1 - 2 * width); a2 * y <= b2 * x; y++)
                {
                    blocks[(xc - x + evenX) + ',' + (yc - y)] = foreground // 2
                    blocks[(xc + x) + ',' + (yc - y)] = foreground // 1
                    blocks[(xc - x + evenX) + ',' + (yc + y - evenY)] = foreground // 3
                    blocks[(xc + x) + ',' + (yc + y - evenY)] = foreground // 4
                    if (sigma >= 0)
                    {
                        sigma += fb2 * (1 - x)
                        x--
                    }
                    sigma += a2 * ((4 * y) + 6)
                }
            }
        }
        this.stamp = []
        for (let block in blocks)
        {
            const data = blocks[block]
            const pos = block.split(',')
            if (this.inBounds(pos))
            {
                const color = parseInt(data.substr(0, 6), 16)
                const alpha = parseInt(data.substr(6), 16) / 255
                this.draw.cursorBlock.beginFill(color, alpha).drawRect(parseInt(pos[0]) * ZOOM, parseInt(pos[1]) * ZOOM, ZOOM, ZOOM).endFill()
                this.stamp.push({ x: parseInt(pos[0]), y: parseInt([pos[1]]), color: data })
            }
        }
    }

    activate()
    {
        if (state.cursorSizeX === 1 && state.cursorSizeY === 1)
        {
            state.cursorSizeX = 3
            state.cursorSizeY = 3
        }
    }

    space()
    {
        this.drawStamp()
    }
}