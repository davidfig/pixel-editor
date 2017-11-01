const exists = require('exists')
const Input = require('yy-input')
const PIXI = require('pixi.js')

const UI = require('../windows/ui')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Settings = require('./settings')
const Dice = require('./dice')

const WIDTH = 200
const HEIGHT = 300

module.exports = class Coords extends UI.Window
{
    constructor()
    {
        super({ draggable: true, width: WIDTH, height: HEIGHT })
        this.stateSetup('coords')
        this.cursorX = this.addChild(new UI.EditText(State.cursorX, { beforeText: 'x: ', count: 3, edit: 'number' }))
        this.cursorY = this.addChild(new UI.EditText(State.cursorY, { beforeText: 'y: ', count: 3, edit: 'number' }))
        this.cursorWidth = this.addChild(new UI.EditText(State.cursorSizeX, { beforeText: 'w: ', count: 3, edit: 'number' }))
        this.cursorHeight = this.addChild(new UI.EditText(State.cursorSizeY, { beforeText: 'h: ', count: 3, edit: 'number' }))
        this.dice = this.addChild(new Dice())
    }

    draw()
    {
        let y = Settings.BORDER
        this.cursorX.position.set(Settings.BORDER, y)
        this.cursorY.position.set(WIDTH - Settings.BORDER - this.cursorY.width, y)
        y += this.cursorX.height + Settings.BORDER
        this.cursorWidth.position.set(Settings.BORDER, y)
        this.cursorHeight.position.set(WIDTH - Settings.BORDER - this.cursorHeight.width, y)
        y += this.cursorWidth.height + Settings.BORDER
        this.dice.position.set(WIDTH / 2 - this.dice.width / 2, y)
        y += this.dice.height + Settings.BORDER
        super.draw()
    }

    stateSetup(name)
    {
        this.name = name
        const place = State.get(this.name)
        if (exists(place))
        {
            this.position.set(place.x, place.y)
        }
        this.on('drag-end', this.dragged, this)
    }

    dragged()
    {
        State.set(this.name, this.x, this.y)
    }
}

/*

let _state, _pixel, _editing

function init()
{
    Input.init(null, { keyDown })
    _state = new State()
    _pixel = new PixelEditor(_state.lastFile)
    stateChange(true)
    pixelChange(true)
    new EasyEdit(document.getElementById('width'), { onsuccess: widthChange, oncancel: cancel, onedit: start })
    new EasyEdit(document.getElementById('height'), { onsuccess: heightChange, oncancel: cancel, onedit: start })
    new EasyEdit(document.getElementById('pixels'), { onsuccess: pixelsChange, oncancel: cancel, onedit: start })
    ipcRenderer.on('state', stateChange)
    ipcRenderer.on('pixel', pixelChange)
    ipcRenderer.on('reset', reset)
    remote.getCurrentWindow().show()
}

function reset()
{
    _state.load()
    _pixel = new PixelEditor(_state.lastFile)
    stateChange(true)
    pixelChange(true)
}

function start()
{
    _editing = true
}

function cancel()
{
    _editing = false
}

function widthChange(value)
{
    const original = _pixel.width
    _pixel.width = value
    if (_pixel.width !== parseInt(value))
    {
        document.getElementById('width').innerHTML = original
    }
    else
    {
        _pixel.save()
        ipcRenderer.send('pixel')
    }
}

function heightChange(value)
{
    const original = _pixel.height
    _pixel.height = value
    if (_pixel.height !== parseInt(value))
    {
        document.getElementById('height').innerHTML = original
    }
    else
    {
        _pixel.save()
        ipcRenderer.send('pixel')
    }
}

function pixelsChange(value)
{
    const pixels = parseInt(value)
    if (!isNaN(pixels) && pixels > 0)
    {
        _pixel.pixels = value
        _pixel.save()
        ipcRenderer.send('pixel')
    }
}

function pixelChange(noload)
{
    if (noload !== true)
    {
        _pixel.load()
    }
    document.getElementById('width').innerHTML = _pixel.width
    document.getElementById('height').innerHTML = _pixel.height
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight)
}

function stateChange(noload)
{
    if (noload !== true)
    {
        _state.load()
    }
    const centered = document.getElementById('centered').checked
    document.getElementById('pixels').innerHTML = _state.pixels
    document.getElementById('x').innerHTML = _state.cursorX - (centered ? Math.floor(_pixel.width / 2) : 0)
    document.getElementById('y').innerHTML = _state.cursorY - (centered ? Math.floor(_pixel.height / 2) : 0)
    document.getElementById('cursorWidth').innerHTML = _state.cursorSizeX
    document.getElementById('cursorHeight').innerHTML = _state.cursorSizeY
    const filename = '--- ' + path.basename(_state.lastFile, '.json') + ' ---'
    document.getElementById('filename').innerHTML = filename
}

*/