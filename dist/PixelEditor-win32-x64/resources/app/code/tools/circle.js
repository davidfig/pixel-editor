const Base = require('./base')
const State = require('../state')
const Settings = require('../settings')

module.exports = class Circle extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        this.draw.cursorBlock.lineStyle(0)
        this.draw.cursorBlock.position.set(0, 0)
        let x0 = State.cursorX
        let y0 = State.cursorY
        const foreground = State.foreground
        const background = State.background
        const blocks = {}
        if (State.cursorSizeX === 3)
        {
            blocks[x0 + ',' + (y0 - 1)] = foreground
            blocks[x0 + ',' + y0] = background
            blocks[x0 + ',' + (y0 + 1)] = foreground
            blocks[(x0 - 1) + ',' + y0] = foreground
            blocks[(x0 + 1) + ',' + y0] = foreground
        }
        else
        {
            const even = State.cursorSizeX % 2 === 0 ? 1 : 0
            let x = Math.ceil(State.cursorSizeX / 2) - 1
            let y = 0
            let decisionOver2 = 1 - x   // Decision criterion divided by 2 evaluated at x=r, y=0

            // draw inside
            if (parseInt(State.background.substr(6), 16) !== 0)
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
            if (parseInt(State.foreground.substr(6), 16) !== 0)
            {
                x = Math.ceil(State.cursorSizeX / 2) - 1
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
        if (State.cursorSizeX === 4)
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
                    this.draw.cursorBlock.beginFill(color, alpha).drawRect(parseInt(pos[0]) * Settings.ZOOM, parseInt(pos[1]) * Settings.ZOOM, Settings.ZOOM, Settings.ZOOM).endFill()
                    this.stamp.push({ x: parseInt(pos[0]), y: parseInt([pos[1]]), color: data })
                }
            }
        }
    }

    activate()
    {
        if (State.cursorSizeX === 1)
        {
            State.cursorSizeX = 3
        }
    }

    space()
    {
        this.drawStamp()
    }
}