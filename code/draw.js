const RenderSheet = require('yy-rendersheet')
const PIXI = require('pixi.js')
const Pixel = require('yy-pixel').Pixel
const exists = require('exists')
const Input = require('yy-input')

const Sheet = require('./sheet')
const UI = require('../windows/ui')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Settings = require('./settings')
let Main

const CURSOR_COLOR = 0xff0000
const SHAPE_HOVER_ALPHA = 1
const BORDER = 1
const DOTTED = 10

const MIN_WIDTH = 100
const MIN_HEIGHT = 100

module.exports = class Palette extends UI.Window
{
    constructor()
    {
        Main = require('./main')
        super({ clickable: true, draggable: true, resizeable: true })
        this.stateSetup('draw')
        this.stuff = this.addChild(new PIXI.Container())
        this.blocks = this.stuff.addChild(new PIXI.Container())
        this.sprite = this.stuff.addChild(new PIXI.Container())
        this.grid = this.stuff.addChild(new PIXI.Graphics())
        this.cursorBlock = this.stuff.addChild(new PIXI.Graphics())
        this.stuff.position.set(Settings.BORDER, Settings.BORDER)
        this.input = new Input()
        this.input.on('keydown', this.keydown, this)
        this.input.on('keyup', this.keyup, this)
    }

    draw()
    {
        let width = this.width - Settings.BORDER * 2, height = this.height - Settings.BORDER * 2
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
        State.cursorSizeX = (State.cursorSizeX >= PixelEditor.width) ? PixelEditor.width - 1 : State.cursorSizeX
        State.cursorSizeY = (State.cursorSizeX >= PixelEditor.height) ? PixelEditor.height - 1 : State.cursorSizeY

        this.sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST})
        this.sprite.removeChildren()
        const pixel = this.sprite.addChild(new Pixel(PixelEditor.getData(), this.sheet))
        pixel.scale.set(this.zoom)
        pixel.render(true)
        this.sheet.render()
        pixel.frame(PixelEditor.current)
        this.transparency()
        this.frame()
        this.cursorDraw()
        super.draw()
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
        let rx = State.cursorSizeX
        let ry = State.cursorSizeY
        let x = 0, y = ry
        let p = (ry * ry) - (rx * rx * ry) + ((rx * rx) / 4)
        const blocks = {}
        while ((2 * x * ry * ry) < (2 * y * rx * rx))
        {
            for (let i = 0; i < x * 2; i++)
            {
                blocks[(xc - x + i) + ',' + (yc - y)] = true
                blocks[(xc - x + i) + ',' + (yc + y)] = true
            }
            if (p < 0)
            {
                x = x + 1
                p = p + (2 * ry * ry * x) + (ry * ry)
            }
            else
            {
                x = x + 1
                y = y - 1
                p = p + (2 * ry * ry * x + ry * ry) - (2 * rx * rx * y)
            }
        }
        p = (x + 0.5) * (x + 0.5) * ry * ry + (y - 1) * (y - 1) * rx * rx - rx * rx * ry * ry
        while (y >= 0)
        {
            for (let i = 0; i < x * 2; i++)
            {
                blocks[(xc - x + i) + ',' + (yc - y)] = true
                blocks[(xc - x + i) + ',' + (yc + y)] = true
            }
            if (p > 0)
            {
                y = y - 1
                p = p - (2 * rx * rx * y) + (rx * rx)
            }
            else
            {
                y = y - 1
                x = x + 1
                p = p + (2 * ry * ry * x) - (2 * rx * rx * y) - (rx * rx)
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

    circleCursor3(color)
    {
        this.cursorBlock.lineStyle(0)
        this.cursorBlock.position.set(0, 0)
        let x0 = State.cursorX
        let y0 = State.cursorY
        let x = State.cursorSizeX - 1
        let y = 0
        let dx = 1
        let dy = 1
        let err = dx - (State.cursorSize << 1)
        const blocks = []

        while (x >= y)
        {
            blocks[(x0 + x) + ',' + (y0 + y)] = true
            blocks[(x0 + y) + ',' + (y0 + x)] = true
            blocks[(x0 - y) + ',' + (y0 + x)] = true
            blocks[(x0 - x) + ',' + (y0 + y)] = true
            blocks[(x0 - x) + ',' + (y0 - y)] = true
            blocks[(x0 - y) + ',' + (y0 - x)] = true
            blocks[(x0 + y) + ',' + (y0 - x)] = true
            blocks[(x0 + x) + ',' + (y0 - y)] = true

            if (err <= 0)
            {
                y++
                err += dy
                dy += 2
            }
            if (err > 0)
            {
                x--
                dx += 2
                err += (State.cursorSizeX << 1) + dx
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

    // from https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
    circleCursor(color)
    {
        this.cursorBlock.lineStyle(0)
        this.cursorBlock.position.set(0, 0)
        let x0 = State.cursorX
        let y0 = State.cursorY
        let x = State.cursorSizeX
        let y = 0
        let decisionOver2 = 1 - x   // Decision criterion divided by 2 evaluated at x=r, y=0

        const blocks = {}
        while (x >= y)
        {
            for (let i = 0; i < x * 2; i++)
            {
                blocks[(-x + x0 + i) + ',' + (y + y0)] = true
                blocks[(-x + x0 + i) + ',' + (-y + y0)] = true
            }
            for (let i = 0; i < y * 2; i++)
            {
                blocks[(-y + x0 + i) + ',' + (x + y0)] = true
                blocks[(-y + x0 + i) + ',' + (-x + y0)] = true
            }
            y++
            if (decisionOver2 <= 0)
            {
                decisionOver2 += 2 * y + 1
            } else
            {
                x--
                decisionOver2 += 2 * (y - x) + 1
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

    selectCursor()
    {
        const color = State.foreground === null ? CURSOR_COLOR : State.foreground
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
        this.dirty = true
    }

    cursorDraw()
    {
        this.cursorBlock.clear()
        switch (State.tool)
        {
            case 'select':
                this.selectCursor()
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
        if (Main.isEditing()) return
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
                    this.spacing = true
                    this.lastX = State.cursorX
                    this.lastY = State.cursorY
                    break
                case 73:
                    State.foreground = PixelEditor.get(State.cursorX, State.cursorY)
                    break
                case 27:
                    this.clear()
                    break
            }
            if (this.spacing)
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
        if (this.spacing)
        {
            if (code === 32)
            {
                this.spacing = false
            }
        }
    }

    clear()
    {
        switch (State.tool)
        {
            case 'paint':
                if (State.cursorSizeX < 0)
                {
                    State.cursorX += State.cursorSizeX
                }
                if (State.cursorSizeY < 0)
                {
                    State.cursorY += State.cursorSizeY
                }
                State.cursorSizeX = 1
                State.cursorSizeY = 1
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
        this.dirty = true
    }

    cut()
    {
        this.copy(true)
        PixelEditor.save()
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
            PixelEditor.save()
        }
    }

    space()
    {
        switch (State.tool)
        {
            case 'paint':
                if (State.cursorSizeX === 1 && State.cursorSizeY === 1)
                {
                    const current = PixelEditor.get(State.cursorX, State.cursorY)
                    const color = (current !== State.foreground) ? State.foreground : State.background
                    PixelEditor.set(State.cursorX, State.cursorY, color)
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
                    PixelEditor.save()
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
                PixelEditor.save()
                break

            case 'line':
                break

            case 'fill':
                PixelEditor.undoSave()
                this.floodFill(State.cursorX, State.cursorY, PixelEditor.get(State.cursorX, State.cursorY))
                PixelEditor.save()
                break
        }
    }

    floodFill(x, y, check)
    {
        if (check !== State.foreground && PixelEditor.get(x, y) === check)
        {
            PixelEditor.set(x, y, State.foreground, true)
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
            State.on(state, () => this.dirty = true)
        }
        State.on('tool', () => this.tool())
        PixelEditor.on('changed', () => this.dirty = true)
        State.on('last-file', () => this.dirty = true)
    }

    dragged()
    {
        State.set(this.name, this.x, this.y, this.width, this.height)
    }
}


/*

function downMouse(x, y)
{
    const xx = Math.floor(x / this.zoom)
    const yy = Math.floor(y / this.zoom)
    switch (State.tool)
    {
        case 'paint':
            const current = PixelEditor.get(xx, yy)
            const color = (current !== State.foreground) ? State.foreground : State.background
            PixelEditor.set(xx, yy, color)
            this.dirty = true
            _isDown = { color, x: xx, y: yy }
            break

        case 'fill':
            PixelEditor.undoSave()
            floodFill(xx, yy, PixelEditor.get(xx, yy))
            this.dirty = true
            break

        case 'ellipse':
        case 'circle':
            space()
            break

        case 'select':
            if (xx >= State.cursorX && xx <= State.cursorX + State.cursorSizeX && yy >= State.cursorY && yy <= State.cursorY + State.cursorSizeY)
            {
                this.dragging = { x: xx, y: yy, data: PixelEditor.data.slice(0) }
            }
            else
            {
                this.selecting = true
                State.cursorX = xx
                State.cursorY = yy
            }
            break
    }
}

function moveMouse(x, y)
{
    const xx = Math.floor(x / this.zoom)
    const yy = Math.floor(y / this.zoom)
    switch (State.tool)
    {
        case 'paint':
            if (_isDown !== -1)
            {
                if (_isDown.x !== xx || _isDown.y !== yy)
                {
                    PixelEditor.set(xx, yy, _isDown.color)
                    this.dirty = true
                }
            }
            break

        case 'ellipse':
        case 'circle':
            State.cursorX = Math.floor(x / this.zoom)
            State.cursorY = Math.floor(y / this.zoom)
            cursor()
            View.render()
            break

        case 'select':
            if (this.selecting)
            {
                State.cursorSizeX = xx - State.cursorX
                State.cursorSizeY = yy - State.cursorY
                cursor()
                View.render()
            }
            else if (this.dragging && (xx !== this.dragging.x || yy !== this.dragging.y))
            {
                State.cursorX = this.dragging.x
                State.cursorY = this.dragging.y
                PixelEditor.data = this.dragging.data
                const temp = this.clipboard
                cut()
                State.cursorX = xx; //this.dragging.x
                State.cursorY = yy;// - this.dragging.y
                paste()
                this.clipboard = temp
                cursor()
                this.dirty = true
            }
    }
}

function upMouse()
{
    _isDown = -1
    if (this.dragging)
    {

    }
    this.selecting = this.dragging = false
}

function convert(color)
{
    let test = color.toString(16)
    while (test.length < 6)
    {
        test = '0' + test
    }
    return TinyColor(test).toHsl()
}

function color(color)
{
    const colors = []
    function find(color)
    {
        for (let find of colors)
        {
            if (find === color)
            {
                return true
            }
        }
    }
    for (let frame of PixelEditor.frames)
    {
        for (let color of frame.data)
        {
            if (color !== null && !find(color))
            {
                colors.push(color)
            }
        }
    }
    colors.sort(
        function (a, b)
        {
            const hslA = convert(a)
            const hslB = convert(b)
            return hslA.h < hslB.h ? -1 : hslA.h > hslB.h ? 1 : hslA.l < hslB.l ? -1 : hslA.l > hslB.l - 1 ? hslA.s < hslB.s : hslA.s > hslB.s ? -1 : 0
        })
    if (color < colors.length)
    {
        State.foreground = colors[color]
        ipcRenderer.send('state')
    }
}

function menu(caller, menu)
{
    if (menu.indexOf('open***') !== -1)
    {
        const filename = menu.split('open***')
        load([filename[1]])
        return
    }

    switch (menu)
    {
        case 'duplicate':
            PixelEditor.duplicate(PixelEditor.current)
            draw()
            this.dirty = true
            break

        case 'delete':
            if (PixelEditor.frames.length > 1)
            {
                const current = PixelEditor.current === 0 ? 0 : PixelEditor.current - 1
                PixelEditor.delete(PixelEditor.current)
                PixelEditor.current = current
                draw()
                title()
                this.dirty = true
            }
            break

        case 'frame':
            PixelEditor.blank()
            PixelEditor.current = PixelEditor.frames.length - 1
            draw()
            title()
            this.dirty = true
            break
*/