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
        this.draw.cursorBlock.position.set(State.cursorX * Settings.ZOOM, State.cursorY * Settings.ZOOM)
        this.draw.cursorBlock.lineStyle(5, color)
        const x = State.cursorSizeX + State.cursorX >= PixelEditor.width ? PixelEditor.width - State.cursorX : State.cursorSizeX
        const y = State.cursorSizeY + State.cursorY >= PixelEditor.height ? PixelEditor.height - State.cursorY : State.cursorSizeY
        let reverse = Settings.ZOOM * x < 0
        for (let i = 0; reverse ? i > Settings.ZOOM * x : i < Settings.ZOOM * x; reverse ? i -= Settings.DOTTED * 2 : i += Settings.DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - Settings.DOTTED < Settings.ZOOM * x ? Settings.ZOOM * x : i - Settings.DOTTED
            }
            else
            {
                far = i + Settings.DOTTED > Settings.ZOOM * x ? Settings.ZOOM * x : i + Settings.DOTTED
            }
            this.draw.cursorBlock.moveTo(i, 0)
            this.draw.cursorBlock.lineTo(far, 0)
            this.draw.cursorBlock.moveTo(i, Settings.ZOOM * y)
            this.draw.cursorBlock.lineTo(far, Settings.ZOOM * y)
        }
        reverse = Settings.ZOOM * y < 0
        for (let i = 0; reverse ? i > Settings.ZOOM * y : i < Settings.ZOOM * y; reverse ? i -= Settings.DOTTED * 2 : i += Settings.DOTTED * 2)
        {
            let far
            if (reverse)
            {
                far = i - Settings.DOTTED < Settings.ZOOM * y ? Settings.ZOOM * y : i - Settings.DOTTED
            }
            else
            {
                far = i + Settings.DOTTED > Settings.ZOOM * y ? Settings.ZOOM * y : i + Settings.DOTTED
            }
            this.draw.cursorBlock.moveTo(0, i)
            this.draw.cursorBlock.lineTo(0, far)
            this.draw.cursorBlock.moveTo(Settings.ZOOM * x, i)
            this.draw.cursorBlock.lineTo(Settings.ZOOM * x, far)
        }
    }

    activate()
    {
        this.dragging = false
        this.selecting = false
    }

    erase()
    {
        this.eraseBox()
    }
}