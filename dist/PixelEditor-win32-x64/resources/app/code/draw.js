const PIXI = require('pixi.js')

const libraries = require('./config/libraries')
const Viewport = libraries.Viewport

const Settings = require('./settings')
const Sheet = require('./sheet')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const pixelSheet = require('./pixel-sheet')
const Position = require('./frames/position')

const Circle = require('./tools/circle')
const Ellipse = require('./tools/ellipse')
const Line = require('./tools/line')
const Paint = require('./tools/paint')
const Select = require('./tools/select')
const Fill = require('./tools/fill')
const Crop = require('./tools/crop')

const BORDER = 1
const THRESHOLD = 5

module.exports = class Draw extends PIXI.Container
{
    constructor(body, ui, main)
    {
        super()
        this.body = body
        this.ui = ui
        this.main = main
        this.renderer = new PIXI.Renderer({ resolution: window.devicePixelRatio, transparent: true, autoResize: true })
        body.appendChild(this.renderer.view)

        this.renderer.view.style.display = 'block'
        this.renderer.view.style.margin = '0 auto'
        this.renderer.view.style.width = '100%'
        this.renderer.view.style.height = '100%'
        this.resize()

        this.vp = this.addChild(new Viewport({ screenWidth: window.innerWidth, screenHeight: window.innerHeight, divWheel: this.body }))
        this.blocks = this.vp.addChild(new PIXI.Container())
        this.sprite = this.vp.addChild(new PIXI.Sprite())
        this.grid = this.vp.addChild(new PIXI.Graphics())
        this.cursorBlock = this.vp.addChild(new PIXI.Graphics())
        this.stateSetup('draw')
        window.addEventListener('resize', () => this.resize())

        this.tools = {
            circle: new Circle(this),
            ellipse: new Ellipse(this),
            line: new Line(this),
            fill: new Fill(this),
            paint: new Paint(this),
            select: new Select(this),
            crop: new Crop(this)
        }
        this.tool = this.tools[State.tool]

        this.redraw()
        this.setupViewport()
        PIXI.Ticker.shared.add(() => this.update())
    }

    resize()
    {
        this.renderer.resize(window.innerWidth, window.innerHeight)
        if (this.vp)
        {
            this.vp.resize(window.innerWidth, window.innerHeight)
        }
        this.renderer.render(this)
    }

    setupViewport()
    {
        this.vp
            .drag()
            .decelerate()
            .pinch()
            .wheel()

        const vp = PixelEditor.viewport
        if (vp)
        {
            this.vp.x = vp.x
            this.vp.y = vp.y
            this.vp.scale.set(vp.scale)
        }
        else
        {
            Position.halfSize(this)
            Position.center(this)
        }
    }

    moveViewportCursor(x, y)
    {
        function clamp(n, min, max)
        {
            return n < min ? min : n > max ? max : n
        }

        const point = this.vp.toWorld(x, y)
        State.cursorX = clamp(Math.floor(point.x / Settings.ZOOM), 0, PixelEditor.width - 1)
        State.cursorY = clamp(Math.floor(point.y / Settings.ZOOM), 0, PixelEditor.height - 1)
    }

    update()
    {
        if (this.vp.dirty)
        {
            PixelEditor.viewport = { x: this.vp.x, y: this.vp.y, scale: this.vp.scale.x }
            this.vp.dirty = false
            this.setHitArea()
            this.renderer.render(this)
        }
    }

    setHitArea()
    {
        if (!this.vp.forceHitArea)
        {
            this.vp.forceHitArea = new PIXI.Rectangle(this.vp.left, this.vp.top, this.vp.worldScreenWidth, this.vp.worldScreenHeight)
        }
        else
        {
            this.vp.forceHitArea.x = this.vp.left
            this.vp.forceHitArea.y = this.vp.top
            this.vp.forceHitArea.width = this.vp.worldScreenWidth
            this.vp.forceHitArea.height = this.vp.worldScreenHeight
        }
    }

    redraw()
    {
        State.cursorSizeX = (State.cursorSizeX > PixelEditor.width) ? PixelEditor.width : State.cursorSizeX
        State.cursorSizeY = (State.cursorSizeY > PixelEditor.height) ? PixelEditor.height : State.cursorSizeY
        this.sprite.texture = pixelSheet.getTexture(PixelEditor.name + '-' + PixelEditor.current)
        this.sprite.scale.set(Settings.ZOOM)
        this.transparency()
        this.frame()
        this.cursorDraw()
        this.setHitArea()
        this.renderer.render(this)
    }

    change()
    {
        PixelEditor.save()
        PixelEditor.emit('changed')
        this.redraw()
    }

    clear()
    {
        this.tool.clear()
    }

    moveCursorShift(x, y)
    {
        this.tool.moveShift(x, y)
    }

    moveCursor(x, y)
    {
        this.tool.move(x, y)
    }

    transparency()
    {
        this.blocks.removeChildren()
        for (let y = 0; y < PixelEditor.height; y++)
        {
            for (let x = 0; x < PixelEditor.width; x++)
            {
                const block = this.blocks.addChild(new PIXI.Sprite(Sheet.getTexture('transparency')))
                block.width = block.height = Settings.ZOOM
                block.position.set(x * Settings.ZOOM, y * Settings.ZOOM)
            }
        }
    }

    frame()
    {
        this.grid.clear()
        this.grid.lineStyle(BORDER, 0x888888)
        for (let y = 0; y <= PixelEditor.height; y++)
        {
            this.grid.moveTo(0, y * Settings.ZOOM)
            this.grid.lineTo(PixelEditor.width * Settings.ZOOM, y * Settings.ZOOM)
        }

        for (let x = 0; x <= PixelEditor.width; x++)
        {
            this.grid.moveTo(x * Settings.ZOOM, 0)
            this.grid.lineTo(x * Settings.ZOOM, PixelEditor.height * Settings.ZOOM)
        }
    }

    cursorDraw()
    {
        this.cursorBlock.clear()
        this.tool.cursor()
        this.renderer.render(this)
    }

    down(x, y, data)
    {
        this.saveDown = { x, y }
        return this.vp.down(x, y, data)
    }

    up(x, y, data)
    {
        if (this.saveDown)
        {
            this.moveViewportCursor(x, y, data)
        }
        return this.vp.up(x, y, data)
    }

    move(x, y, data)
    {
        if (this.saveDown)
        {
            if (Math.abs(this.saveDown.x - x) > THRESHOLD || Math.abs(this.saveDown.y - y) > THRESHOLD)
            {
                this.saveDown = null
            }
        }
        return this.vp.move(x, y, data)
    }

    selectAll()
    {
        State.tool = 'select'
        State.cursorX = 0
        State.cursorY = 0
        State.cursorSizeX = PixelEditor.width
        State.cursorSizeY = PixelEditor.height
    }

    pressSpace()
    {
        this.tool.space()
    }

    toolChange()
    {
        this.tool = this.tools[State.tool]
        this.tool.activate()
        this.cursorDraw()
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
                PixelEditor.set(State.cursorX, State.cursorY, '00000000', true)
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
                        PixelEditor.set(x, y, '00000000', true)
                    }
                }
            }
        }
    }

    erase()
    {
        PixelEditor.undoSave()
        this.tool.erase()
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

    stateSetup(name)
    {
        this.name = name
        const states = ['foreground', 'isForeground', 'cursorX', 'cursorY', 'cursorSizeX', 'cursorSizeY']
        for (let state of states)
        {
            State.on(state, () => this.redraw())
        }
        State.on('tool', () => this.toolChange())
        PixelEditor.on('changed', () => this.redraw())
        PixelEditor.on('current', () => this.redraw())
        State.on('last-file', () => this.redraw())
        State.on('background', () => this.toolChange())
    }
}
