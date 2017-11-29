const PIXI = require('pixi.js')
const Pixel = require('yy-pixel').Pixel
const exists = require('exists')

const Sheet = require('./sheet')
const UI = require('../../components/ui')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const pixelSheet = require('./pixel-sheet')

const CURSOR_COLOR = 0xff0000
const SHAPE_HOVER_ALPHA = 1
const BORDER = 1
const DOTTED = 10

const MIN_WIDTH = 100
const MIN_HEIGHT = 100

module.exports = class Draw extends UI.Window
{
    constructor()
    {
        super({ draggable: true, resizeable: true })
        this.stuff = this.addChild(new PIXI.Container())
        this.blocks = this.stuff.addChild(new PIXI.Container())
        this.sprite = this.stuff.addChild(new PIXI.Container())
        this.grid = this.stuff.addChild(new PIXI.Graphics())
        this.cursorBlock = this.stuff.addChild(new PIXI.Graphics())
        this.stateSetup('draw')
        this.redraw()
        this.redraw()
    }

    layout()
    {
        super.layout()
        this.redraw()
    }

    redraw()
    {
        const spacing = this.get('spacing') * 2
        let width = this.width - spacing, height = this.height - spacing
        let w = width / PixelEditor.width
        let h = height / PixelEditor.height
        if (PixelEditor.width * h < width)
        {
            this.zoom = h
        }
        else
        {
            this.zoom = w
        }
        State.cursorSizeX = (State.cursorSizeX > PixelEditor.width) ? PixelEditor.width : State.cursorSizeX
        State.cursorSizeY = (State.cursorSizeY > PixelEditor.height) ? PixelEditor.height : State.cursorSizeY
        this.sprite.removeChildren()
        const pixel = this.sprite.addChild(new Pixel(PixelEditor.getData(), pixelSheet))
        pixel.scale.set(this.zoom)
        pixel.frame(PixelEditor.current)
        this.transparency()
        this.frame()
        this.cursorDraw()
    }

    change()
    {
        PixelEditor.save()
        pixelSheet.render()
    }

    transparency()
    {
        this.blocks.removeChildren()
        for (let y = 0; y < PixelEditor.height; y++)
        {
            for (let x = 0; x < PixelEditor.width; x++)
            {
                const block = this.blocks.addChild(new PIXI.Sprite(Sheet.getTexture('transparency')))
                block.width = block.height = this.zoom
                block.position.set(x * this.zoom, y * this.zoom)
            }
        }
    }

    frame()
    {
        this.grid.clear()
        this.grid.lineStyle(BORDER, 0x888888)
        for (let y = 0; y <= PixelEditor.height; y++)
        {
            this.grid.moveTo(0, y * this.zoom)
            this.grid.lineTo(PixelEditor.width * this.zoom, y * this.zoom)
        }

        for (let x = 0; x <= PixelEditor.width; x++)
        {
            this.grid.moveTo(x * this.zoom, 0)
            this.grid.lineTo(x * this.zoom, PixelEditor.height * this.zoom)
        }
    }

    ellipseCursor(color)
    {
        this.cursorBlock.lineStyle(0)
        this.cursorBlock.position.set(0, 0)
        let xc = State.cursorX
        let yc = State.cursorY
        let width = State.cursorSizeX
        let height = State.cursorSizeY
        let a2 = width * width
        let b2 = height * height
        let fa2 = 4 * a2, fb2 = 4 * b2
        let x, y, sigma

        const blocks = {}
        if (width === 1)
        {
            height--
            for (let y = -height / 2; y <= height / 2; y++)
            {
                blocks[xc + ',' + (yc + y)] = true
            }
        }
        else if (height === 1)
        {
            width--
            for (let x = -width / 2; x <= width / 2; x++)
            {
                blocks[(xc + x) + ',' + yc] = true
            }
        }
        else
        {
            width = Math.floor(State.cursorSizeX / 2)
            const evenX = State.cursorSizeX % 2 === 0 ? 1 : 0
            height = Math.floor(State.cursorSizeY / 2)
            const evenY = State.cursorSizeY % 2 === 0 ? 1 : 0
            for (x = 0, y = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * x <= a2 * y; x++)
            {
                if (State.openEllipse)
                {
                    blocks[(xc - x + evenX) + ',' + (yc - y)] = true // 2
                    blocks[(xc + x) + ',' + (yc - y)] = true // 1

                    blocks[(xc - x + evenX) + ',' + (yc + y - evenY)] = true // 3
                    blocks[(xc + x) + ',' + (yc + y - evenY)] = true // 4
                }
                else
                {
                    for (let xx = -x + evenX; xx <= x; xx++)
                    {
                        blocks[(xc + xx) + ',' + (yc - y)] = true
                        blocks[(xc + xx) + ',' + (yc + y - evenY)] = true
                    }
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
                if (State.openEllipse)
                {
                    blocks[(xc - x + evenX) + ',' + (yc - y)] = true // 2
                    blocks[(xc + x) + ',' + (yc - y)] = true // 1

                    blocks[(xc - x + evenX) + ',' + (yc + y - evenY)] = true // 3
                    blocks[(xc + x) + ',' + (yc + y - evenY)] = true // 4
                }
                else
                {
                    for (let xx = -x + evenX; xx <= x; xx++)
                    {
                        blocks[(xc + xx) + ',' + (yc - y)] = true
                        blocks[(xc + xx) + ',' + (yc + y - evenY)] = true
                    }
                }
                if (sigma >= 0)
                {
                    sigma += fb2 * (1 - x)
                    x--
                }
                sigma += a2 * ((4 * y) + 6)
            }
        }
        this.stamp = []
        for (let block in blocks)
        {
            const pos = block.split(',')
            if (this.inBounds(pos))
            {
                this.cursorBlock.beginFill(color, SHAPE_HOVER_ALPHA).drawRect(parseInt(pos[0]) * this.zoom, parseInt(pos[1]) * this.zoom, this.zoom, this.zoom).endFill()
                this.stamp.push({ x: parseInt(pos[0]), y: parseInt([pos[1]]) })
            }
        }
    }

    inBounds(pos)
    {
        let x = parseInt(pos[0])
        let y = parseInt(pos[1])
        return x >= 0 && y >= 0 && x < PixelEditor.width && y < PixelEditor.height
    }

    circleCursor(color)
    {
        this.cursorBlock.lineStyle(0)
        this.cursorBlock.position.set(0, 0)
        let x0 = State.cursorX
        let y0 = State.cursorY
        const blocks = {}
        if (State.cursorSizeX === 3)
        {
            blocks[x0 + ',' + (y0 - 1)] = true
            blocks[x0 + ',' + y0] = true
            blocks[x0 + ',' + (y0 + 1)] = true
            blocks[(x0 - 1) + ',' + y0] = true
            blocks[(x0 + 1) + ',' + y0] = true
        }
        else
        {
            let x = Math.ceil(State.cursorSizeX / 2) - 1
            const even = State.cursorSizeX % 2 === 0 ? 1 : 0
            let y = 0
            let decisionOver2 = 1 - x   // Decision criterion divided by 2 evaluated at x=r, y=0

            while (x >= y)
            {
                if (State.openCircle)
                {
                    blocks[(x0 + x) + ',' + (y0 + y + even)] = true
                    blocks[(x0 + y) + ',' + (y0 + x + even)] = true
                    blocks[(x0 - y - even) + ',' + (y0 + x + even)] = true
                    blocks[(x0 - x - even) + ',' + (y0 + y + even)] = true
                    blocks[(x0 - x - even) + ',' + (y0 - y)] = true
                    blocks[(x0 - y - even) + ',' + (y0 - x)] = true
                    blocks[(x0 + y) + ',' + (y0 - x)] = true
                    blocks[(x0 + x) + ',' + (y0 - y)] = true
                }
                else
                {
                    for (let i = 0; i <= x; i++)
                    {
                        blocks[(x0 + x - i) + ',' + (y0 + y + even)] = true
                        blocks[(x0 - x - even + i) + ',' + (y0 + y + even)] = true
                        blocks[(x0 - y - even) + ',' + (y0 + x + even - i)] = true
                        blocks[(x0 - x - even + i) + ',' + (y0 - y)] = true
                        blocks[(x0 + x - i) + ',' + (y0 - y)] = true
                    }
                    for (let i = 0; i <= y; i++)
                    {
                        blocks[(x0 + y - i) + ',' + (y0 + x + even)] = true
                        blocks[(x0 - y - even + i) + ',' + (y0 - x)] = true
                        blocks[(x0 + y - i) + ',' + (y0 - x)] = true
                    }
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
        if (State.cursorSizeX === 3 && State.openCircle)
        {
            blocks[x0 + ',' + y0] = false
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
            if (blocks[block])
            {
                const pos = block.split(',')
                if (this.inBounds(pos))
                {
                    this.cursorBlock.beginFill(color, SHAPE_HOVER_ALPHA).drawRect(parseInt(pos[0]) * this.zoom, parseInt(pos[1]) * this.zoom, this.zoom, this.zoom).endFill()
                    this.stamp.push({ x: parseInt(pos[0]), y: parseInt([pos[1]]) })
                }
            }
        }
    }

    lineCursor()
    {
        const color = State.foreground === null ? CURSOR_COLOR : State.foreground
        this.cursorBlock.position.set(0)
        if (this.line)
        {
            this.stamp = []
            let x0 = State.cursorX
            let y0 = State.cursorY
            let x1 = this.line.x
            let y1 = this.line.y

            const dx = Math.abs(x1 - x0)
            const dy = Math.abs(y1 - y0)
            const sx = x0 < x1 ? 1 : -1
            const sy = y0 < y1 ? 1 : -1
            let err = dx - dy
            let e2
            while (true)
            {
                this.cursorBlock.beginFill(color, SHAPE_HOVER_ALPHA)
                    .drawRect(x0 * this.zoom - BORDER, y0 * this.zoom - BORDER, this.zoom + BORDER * 2, this.zoom + BORDER * 2)
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
            this.cursorBlock.beginFill(color, SHAPE_HOVER_ALPHA)
                .drawRect(State.cursorX * this.zoom - BORDER, State.cursorY * this.zoom - BORDER, this.zoom + BORDER * 2, this.zoom + BORDER * 2)
                .endFill()
            this.stamp = [{ x: State.cursorX, y: State.cursorY }]
        }
    }

    fillCursor()
    {
        const color = State.foreground === null ? CURSOR_COLOR : State.foreground
        this.cursorBlock.position.set(State.cursorX * this.zoom, State.cursorY * this.zoom)
        this.cursorBlock.lineStyle(10, color)
        this.cursorBlock.drawRect(0, 0, this.zoom, this.zoom)
    }

    normalCursor()
    {
        const color = State.foreground === null ? CURSOR_COLOR : State.foreground
        this.cursorBlock.position.set(State.cursorX * this.zoom, State.cursorY * this.zoom)
        this.cursorBlock.lineStyle(5, color)
        const x = State.cursorSizeX + State.cursorX >= PixelEditor.width ? PixelEditor.width - State.cursorX : State.cursorSizeX
        const y = State.cursorSizeY + State.cursorY >= PixelEditor.height ? PixelEditor.height - State.cursorY : State.cursorSizeY
        this.cursorBlock.drawRect(0, 0, this.zoom * x, this.zoom * y)
    }

    selectCursor(special)
    {
        const color = special ? 0xd20000 : State.foreground === null ? CURSOR_COLOR : State.foreground
        this.cursorBlock.position.set(State.cursorX * this.zoom, State.cursorY * this.zoom)
        this.cursorBlock.lineStyle(5, color)
        const x = State.cursorSizeX + State.cursorX >= PixelEditor.width ? PixelEditor.width - State.cursorX : State.cursorSizeX
        const y = State.cursorSizeY + State.cursorY >= PixelEditor.height ? PixelEditor.height - State.cursorY : State.cursorSizeY
        let reverse = this.zoom * x < 0
        for (let i = 0; reverse ? i > this.zoom * x : i < this.zoom * x; reverse ? i -= DOTTED * 2 : i += DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - DOTTED < this.zoom * x ? this.zoom * x : i - DOTTED
            }
            else
            {
                far = i + DOTTED > this.zoom * x ? this.zoom * x : i + DOTTED
            }
            this.cursorBlock.moveTo(i, 0)
            this.cursorBlock.lineTo(far, 0)
            this.cursorBlock.moveTo(i, this.zoom * y)
            this.cursorBlock.lineTo(far, this.zoom * y)
        }
        reverse = this.zoom * y < 0
        for (let i = 0; reverse ? i > this.zoom * y : i < this.zoom * y; reverse ? i -= DOTTED * 2 : i += DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - DOTTED < this.zoom * y ? this.zoom * y : i - DOTTED
            }
            else
            {
                far = i + DOTTED > this.zoom * y ? this.zoom * y : i + DOTTED
            }
            this.cursorBlock.moveTo(0, i)
            this.cursorBlock.lineTo(0, far)
            this.cursorBlock.moveTo(this.zoom * x, i)
            this.cursorBlock.lineTo(this.zoom * x, far)
        }
    }

    moveCursor(x, y)
    {
        if (this.shift)
        {
            if (State.tool === 'line')
            {
                if (!this.line)
                {
                    this.line = { x: State.cursorX, y: State.cursorY }
                }
                this.line.x += x
                this.line.y += y
                this.line.x = this.line.x < 0 ? PixelEditor.width - 1 : this.line.x
                this.line.y = this.line.y < 0 ? PixelEditor.height - 1 : this.line.y
                this.line.x = this.line.x === PixelEditor.width ? 0 : this.line.x
                this.line.y = this.line.y === PixelEditor.height ? 0 : this.line.y
            }
            else
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
        }
        else
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
        this.redraw()
    }

    cursorDraw()
    {
        this.cursorBlock.clear()
        switch (State.tool)
        {
            case 'select':
                this.selectCursor()
                break

            case 'crop':
                this.selectCursor(true)
                break

            case 'paint':
                this.normalCursor()
                break

            case 'circle':
                this.circleCursor(State.foreground)
                break

            case 'ellipse':
                this.ellipseCursor(State.foreground)
                break

            case 'line':
                this.lineCursor(State.foreground)
                break

            case 'fill':
                this.fillCursor()
                break
        }
    }

    keydown(code, special)
    {
        this.shift = special.shift
        if (special.ctrl)
        {
            switch (code)
            {
                case 88:
                    this.cut()
                    break
                case 67:
                    this.copy()
                    break
                case 86:
                    this.paste()
                    break
                case 90:
                    if (special.shift)
                    {
                        PixelEditor.redoOne()
                    }
                    else
                    {
                        PixelEditor.undoOne()
                    }
                    break
                case 68:
                    PixelEditor.duplicate(PixelEditor.current)
                    break
                case 65:
                    State.tool = 'select'
                    State.cursorX = 0
                    State.cursorY = 0
                    State.cursorSizeX = PixelEditor.width
                    State.cursorSizeY = PixelEditor.height
                    break
            }
        }
        else
        {
            switch (code)
            {
                case 37: // left
                    this.moveCursor(-1, 0)
                    break
                case 38: // up
                    this.moveCursor(0, -1)
                    break
                case 39: // right
                    this.moveCursor(1, 0)
                    break
                case 40: // down
                    this.moveCursor(0, 1)
                    break
                case 187: // -
                    break
                case 189: // =
                    break
                case 32: // space
                    this.space()
                    this.spacingOn = true
                    this.lastX = State.cursorX
                    this.lastY = State.cursorY
                    break
                case 73:
                    State.foreground = PixelEditor.get(State.cursorX, State.cursorY)
                    break
                case 27:
                    this.clear()
                    break
                case 8:
                    this.clearBox()
                    break
            }
            if (this.spacingOn)
            {
                if (State.cursorX !== this.lastX || State.cursorY !== this.lastY)
                {
                    this.space()
                }
            }
        }
    }

    keyup(code)
    {
        if (this.spacingOn)
        {
            if (code === 32)
            {
                this.spacingOn = false
            }
        }
    }

    clear()
    {
        switch (State.tool)
        {
            case 'crop':
            case 'select':
            case 'paint':
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
                break
        }
    }

    tool()
    {
        switch (State.tool)
        {
            case 'ellipse':
                if (State.cursorSizeX === 1 && State.cursorSizeY === 1)
                {
                    State.cursorSizeX = 3
                    State.cursorSizeY = 3
                }
                break

            case 'circle':
                if (State.cursorSizeX === 1)
                {
                    State.cursorSizeX = 3
                }
                break

            case 'select':
                this.dragging = false
                this.selecting = false
                break

            case 'line':
                this.line = null
                break
        }
        this.redraw()
    }

    cut()
    {
        this.copy(true)
        this.change()
    }

    copy(clear)
    {
        PixelEditor.undoSave()
        if (State.cursorSizeX === 1 && State.cursorSizeY === 1)
        {
            this.clipboard = { width: 1, height: 1, data: PixelEditor.get(State.cursorX, State.cursorY) }
            if (clear)
            {
                PixelEditor.set(State.cursorX, State.cursorY, null, true)
            }
        }
        else
        {
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
            this.clipboard = { width: xTo - xStart, height: yTo - yStart, data: [] }
            for (let y = yStart; y < yTo; y++)
            {
                for (let x = xStart; x < xTo; x++)
                {
                    this.clipboard.data.push(PixelEditor.get(x, y))
                    if (clear)
                    {
                        PixelEditor.set(x, y, null, true)
                    }
                }
            }
        }
    }

    clearBox()
    {
        PixelEditor.undoSave()
        switch (State.tool)
        {
            case 'select':
            case 'fill':
            case 'paint':
                for (let y = State.cursorY; y < State.cursorY + State.cursorSizeY; y++)
                {
                    for (let x = State.cursorX; x < State.cursorX + State.cursorSizeX; x++)
                    {
                        if (x >= 0 && x < PixelEditor.width && y >= 0 && y < PixelEditor.height)
                        {
                            PixelEditor.set(x, y, null, true)
                        }
                    }
                }
                break
            case 'ellipse':
            case 'circle':
            case 'line':
                for (let block of this.stamp)
                {
                    if (block.x >= 0 && block.x < PixelEditor.width && block.y >= 0 && block.y < PixelEditor.height)
                    {
                        PixelEditor.set(block.x, block.y, null, true)
                    }
                }
                break
        }
        this.change()
    }

    paste()
    {
        if (this.clipboard)
        {
            PixelEditor.undoSave()
            let i = 0
            for (let y = 0; y < this.clipboard.height; y++)
            {
                for (let x = 0; x < this.clipboard.width; x++)
                {
                    PixelEditor.set(x + State.cursorX, y + State.cursorY, this.clipboard.data[i++], true)
                }
            }
            this.change()
        }
    }

    space()
    {
        switch (State.tool)
        {
            case 'crop':
                PixelEditor.crop(State.cursorX, State.cursorY, State.cursorSizeX, State.cursorSizeY)
                State.cursorX = 0
                State.cursorY = 0
                break

            case 'paint':
                if (State.cursorSizeX === 1 && State.cursorSizeY === 1)
                {
                    PixelEditor.undoSave()
                    const current = PixelEditor.get(State.cursorX, State.cursorY)
                    const color = (current !== State.foreground) ? State.foreground : State.background
                    PixelEditor.set(State.cursorX, State.cursorY, color, true)
                    this.change()
                    return color
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
                    this.change()
                }
                break

            case 'ellipse':
            case 'circle':
            case 'line':
                const color = State.foreground
                PixelEditor.undoSave()
                for (let block of this.stamp)
                {
                    if (block.x >= 0 && block.x < PixelEditor.width && block.y >= 0 && block.y < PixelEditor.height)
                    {
                        PixelEditor.set(block.x, block.y, color, true)
                    }
                }
                this.change()
                break

            case 'line':
                break

            case 'fill':
                PixelEditor.undoSave()
                this.floodFill(State.cursorX, State.cursorY, PixelEditor.get(State.cursorX, State.cursorY))
                this.change()
                break
        }
    }

    floodFill(x, y, check)
    {
        if (check !== State.color && PixelEditor.get(x, y) === check)
        {
            PixelEditor.set(x, y, State.color, true)
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

    stateSetup(name)
    {
        this.name = name
        const place = State.get(this.name)
        if (exists(place))
        {
            this.position.set(place.x, place.y)
            this.width = place.width && place.width > MIN_WIDTH ? place.width : MIN_WIDTH
            this.height = place.height && place.height > MIN_HEIGHT ? place.height : MIN_HEIGHT
        }
        else
        {
            this.width = MIN_WIDTH
            this.height = MIN_HEIGHT
        }
        this.on('drag-end', this.dragged, this)
        this.on('resize-end', this.dragged, this)
        const states = ['foreground', 'isForeground', 'cursorX', 'cursorY', 'cursorSizeX', 'cursorSizeY']
        for (let state of states)
        {
            State.on(state, () => this.redraw())
        }
        State.on('tool', () => this.tool())
        PixelEditor.on('changed', () => this.redraw())
        State.on('last-file', () => this.redraw())
        State.on('open-circle', () => this.redraw())
        State.on('open-ellipse', () => this.redraw())
    }

    dragged()
    {
        State.set(this.name, this.x, this.y, this.width, this.height)
    }
}
