import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'

import { ZOOM } from './settings'
import { sheet } from './sheet'
import { state } from './state'
import PixelEditor from './pixel-editor'
import { sheet as pixelSheet } from './pixel-sheet'
import { Position } from './frames/position'

import { Circle } from './tools/circle'
import { Ellipse } from './tools/ellipse'
import { Line } from './tools/line'
import { Paint } from './tools/paint'
import { Select } from './tools/select'
import { Fill } from './tools/fill'
import { Crop } from './tools/crop'

const BORDER = 1
const THRESHOLD = 5

export class Draw extends PIXI.Container {
    constructor(ui) {
        super()
        this.renderer = new PIXI.Renderer({ resolution: window.devicePixelRatio, backgroundAlpha: 0, autoResize: true })
        ui.wallpaper.appendChild(this.renderer.view)

        this.renderer.view.style.display = 'block'
        this.renderer.view.style.margin = '0 auto'
        this.renderer.view.style.width = '100%'
        this.renderer.view.style.height = '100%'
        this.resize()

        this.vp = this.addChild(new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            divWheel: this.body,
            interaction: this.renderer.plugins.interaction
        }))
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
        this.tool = this.tools[state.tool]

        this.redraw()
        this.setupViewport()
        PIXI.Ticker.shared.add(() => this.update())
    }

    resize() {
        this.renderer.resize(window.innerWidth, window.innerHeight)
        if (this.vp) {
            this.vp.resize(window.innerWidth, window.innerHeight)
        }
        this.renderer.render(this)
    }

    setupViewport() {
        this.vp
            .drag()
            .decelerate()
            .pinch()
            .wheel()

        const vp = PixelEditor.viewport
        if (vp) {
            this.vp.x = vp.x
            this.vp.y = vp.y
            this.vp.scale.set(vp.scale)
        }
        else {
            Position.halfSize(this)
            Position.center(this)
        }
    }

    moveViewportCursor(x, y) {
        function clamp(n, min, max) {
            return n < min ? min : n > max ? max : n
        }

        const point = this.vp.toWorld(x, y)
        state.cursorX = clamp(Math.floor(point.x / ZOOM), 0, PixelEditor.width - 1)
        state.cursorY = clamp(Math.floor(point.y / ZOOM), 0, PixelEditor.height - 1)
    }

    update() {
        if (this.vp.dirty) {
            PixelEditor.viewport = { x: this.vp.x, y: this.vp.y, scale: this.vp.scale.x }
            this.vp.dirty = false
            this.setHitArea()
            this.renderer.render(this)
        }
    }

    setHitArea() {
        if (!this.vp.forceHitArea) {
            this.vp.forceHitArea = new PIXI.Rectangle(this.vp.left, this.vp.top, this.vp.worldScreenWidth, this.vp.worldScreenHeight)
        }
        else {
            this.vp.forceHitArea.x = this.vp.left
            this.vp.forceHitArea.y = this.vp.top
            this.vp.forceHitArea.width = this.vp.worldScreenWidth
            this.vp.forceHitArea.height = this.vp.worldScreenHeight
        }
    }

    redraw() {
        state.cursorSizeX = (state.cursorSizeX > PixelEditor.width) ? PixelEditor.width : state.cursorSizeX
        state.cursorSizeY = (state.cursorSizeY > PixelEditor.height) ? PixelEditor.height : state.cursorSizeY
        this.sprite.texture = pixelSheet.getTexture(PixelEditor.name + '-' + PixelEditor.current)
        this.sprite.scale.set(ZOOM)
        this.transparency()
        this.frame()
        this.cursorBlock.clear()
        this.tool.cursor()
        this.setHitArea()
        this.renderer.render(this)
    }

    change() {
        PixelEditor.save()
        PixelEditor.emit('changed')
        this.redraw()
    }

    clear() {
        this.tool.clear()
    }

    moveCursorShift(x, y) {
        this.tool.moveShift(x, y)
    }

    moveCursor(x, y) {
        this.tool.move(x, y)
    }

    transparency() {
        this.blocks.removeChildren()
        for (let y = 0; y < PixelEditor.height; y++) {
            for (let x = 0; x < PixelEditor.width; x++) {
                const block = this.blocks.addChild(new PIXI.Sprite(sheet.getTexture('transparency')))
                block.width = block.height = ZOOM
                block.position.set(x * ZOOM, y * ZOOM)
            }
        }
    }

    frame() {
        this.grid.clear()
        this.grid.lineStyle(BORDER, 0x888888)
        for (let y = 0; y <= PixelEditor.height; y++) {
            this.grid.moveTo(0, y * ZOOM)
            this.grid.lineTo(PixelEditor.width * ZOOM, y * ZOOM)
        }

        for (let x = 0; x <= PixelEditor.width; x++) {
            this.grid.moveTo(x * ZOOM, 0)
            this.grid.lineTo(x * ZOOM, PixelEditor.height * ZOOM)
        }
    }

    cursorDraw() {
        this.cursorBlock.clear()
        this.tool.cursor()
        this.renderer.render(this)
    }

    down(x, y, data) {
        this.saveDown = { x, y }
        return this.vp.down(x, y, data)
    }

    up(x, y, data) {
        if (this.saveDown) {
            this.moveViewportCursor(x, y, data)
        }
        return this.vp.up(x, y, data)
    }

    move(x, y, data) {
        if (this.saveDown) {
            if (Math.abs(this.saveDown.x - x) > THRESHOLD || Math.abs(this.saveDown.y - y) > THRESHOLD) {
                this.saveDown = null
            }
        }
        return this.vp.move(x, y, data)
    }

    selectAll() {
        state.tool = 'select'
        state.cursorX = 0
        state.cursorY = 0
        state.cursorSizeX = PixelEditor.width
        state.cursorSizeY = PixelEditor.height
    }

    pressSpace() {
        this.tool.space()
    }

    toolChange() {
        this.tool = this.tools[state.tool]
        this.tool.activate()
        this.cursorDraw()
    }

    cut() {
        this.copy(true)
        this.change()
    }

    copy(clear) {
        PixelEditor.undoSave()
        if (state.cursorSizeX === 1 && state.cursorSizeY === 1) {
            this.clipboard = { width: 1, height: 1, data: PixelEditor.get(state.cursorX, state.cursorY) }
            if (clear) {
                PixelEditor.set(state.cursorX, state.cursorY, '00000000', true)
            }
        }
        else {
            let xStart = state.cursorX, yStart = state.cursorY, xTo, yTo
            if (state.cursorSizeX < 0) {
                xStart += state.cursorSizeX
                xTo = xStart + Math.abs(state.cursorSizeX)
            }
            else {
                xTo = xStart + state.cursorSizeX
            }
            if (state.cursorSizeY < 0) {
                yStart += state.cursorSizeY
                yTo = yStart + Math.abs(state.cursorSizeY) - 1
            }
            else {
                yTo = yStart + state.cursorSizeY
            }
            this.clipboard = { width: xTo - xStart, height: yTo - yStart, data: [] }
            for (let y = yStart; y < yTo; y++) {
                for (let x = xStart; x < xTo; x++) {
                    this.clipboard.data.push(PixelEditor.get(x, y))
                    if (clear) {
                        PixelEditor.set(x, y, '00000000', true)
                    }
                }
            }
        }
    }

    erase() {
        PixelEditor.undoSave()
        this.tool.erase()
        this.change()
    }

    paste() {
        if (this.clipboard) {
            PixelEditor.undoSave()
            let i = 0
            for (let y = 0; y < this.clipboard.height; y++) {
                for (let x = 0; x < this.clipboard.width; x++) {
                    PixelEditor.set(x + state.cursorX, y + state.cursorY, this.clipboard.data[i++], true)
                }
            }
            this.change()
        }
    }

    stateSetup(name) {
        this.name = name
        const states = ['foreground', 'isForeground', 'cursorX', 'cursorY', 'cursorSizeX', 'cursorSizeY']
        for (const key of states) {
            state.on(key, () => this.redraw())
        }
        state.on('tool', () => this.toolChange())
        PixelEditor.on('changed', () => this.redraw())
        PixelEditor.on('current', () => this.redraw())
        state.on('last-file', () => this.redraw())
        state.on('background', () => this.toolChange())
    }
}
