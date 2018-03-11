const Base = require('./base')
const State = require('../state')
const Settings = require('../settings')
const PixelEditor = require('../pixel-editor')

module.exports = class Select extends Base
{
    constructor(draw)
    {
        super(draw)
    }

    cursor()
    {
        const color = State.foreground.substr(6) === '00' ? Settings.CURSOR_COLOR : parseInt(State.foreground.substr(0, 6), 16)
        this.draw.cursorBlock.position.set(State.cursorX * this.draw.zoom, State.cursorY * this.draw.zoom)
        this.draw.cursorBlock.lineStyle(5, color)
        const x = State.cursorSizeX + State.cursorX >= PixelEditor.width ? PixelEditor.width - State.cursorX : State.cursorSizeX
        const y = State.cursorSizeY + State.cursorY >= PixelEditor.height ? PixelEditor.height - State.cursorY : State.cursorSizeY
        let reverse = this.draw.zoom * x < 0
        for (let i = 0; reverse ? i > this.draw.zoom * x : i < this.draw.zoom * x; reverse ? i -= Settings.DOTTED * 2 : i += Settings.DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - Settings.DOTTED < this.draw.zoom * x ? this.draw.zoom * x : i - Settings.DOTTED
            }
            else
            {
                far = i + Settings.DOTTED > this.draw.zoom * x ? this.draw.zoom * x : i + Settings.DOTTED
            }
            this.draw.cursorBlock.moveTo(i, 0)
            this.draw.cursorBlock.lineTo(far, 0)
            this.draw.cursorBlock.moveTo(i, this.draw.zoom * y)
            this.draw.cursorBlock.lineTo(far, this.draw.zoom * y)
        }
        reverse = this.draw.zoom * y < 0
        for (let i = 0; reverse ? i > this.draw.zoom * y : i < this.draw.zoom * y; reverse ? i -= Settings.DOTTED * 2 : i += Settings.DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - Settings.DOTTED < this.draw.zoom * y ? this.draw.zoom * y : i - Settings.DOTTED
            }
            else
            {
                far = i + Settings.DOTTED > this.draw.zoom * y ? this.draw.zoom * y : i + Settings.DOTTED
            }
            this.draw.cursorBlock.moveTo(0, i)
            this.draw.cursorBlock.lineTo(0, far)
            this.draw.cursorBlock.moveTo(this.draw.zoom * x, i)
            this.draw.cursorBlock.lineTo(this.draw.zoom * x, far)
        }
    }

    activate()
    {
        this.dragging = false
        this.selecting = false
    }

    clear()
    {
        this.clearBox()
    }
}