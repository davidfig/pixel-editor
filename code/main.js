const Renderer = require('yy-renderer')
const FontFaceObserver = require('fontfaceobserver')
const Input = require('yy-input')
const remote = require('electron').remote
const path = require('path')
const ClipBoard = require('electron').clipboard

const UI = require('../windows/ui')
const Toolbar = require('./toolbar')
const Palette = require('./palette')
const Picker = require('./picker')
const Coords = require('./coords')
const Sheet = require('./sheet')
const Draw = require('./draw')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Menu = require('./menu')
const Show = require('./show')
const Animation = require('./animation')

let renderer, ui, input, loading = 2, windows = {}

function afterLoad()
{
    loading--
    if (loading)
    {
        return
    }

    Menu()

    if (State.lastFile)
    {
        PixelEditor.load(State.lastFile)
    }

    renderer = new Renderer({ debug: true, autoresize: true })
    create()

    input = new Input({ noPointers: true })
    input.on('keydown', keydown)
    renderer.interval(update)
    renderer.start()
}

function create()
{
    renderer.clear()

    ui = renderer.add(new UI())
    windows.draw = ui.addChild(new Draw())
    windows.show = ui.addChild(new Show())
    windows.toolbar = ui.addChild(new Toolbar())
    windows.palette = ui.addChild(new Palette())
    windows.picker = ui.addChild(new Picker())
    windows.coords = ui.addChild(new Coords())
    windows.animation = ui.addChild(new Animation())
}

function update(elapsed)
{
    if (ui.update(elapsed))
    {
        renderer.dirty = true
    }
}

function keydown(code, special)
{
    if (ui.editing) return

    // reload on ctrl-r key (should be disabled when not debugging)
    if (special.ctrl && code === 82) window.location.reload()

    this.shift = special.shift
    if (special.ctrl && code >= 48 && code <= 57)
    {
        let i = code === 48 ? 10 : code - 48
        if (i < State.lastFiles.length)
        {
            load([State.lastFiles[i]])
        }
    }
    if (special.ctrl && special.shift && code === 68)
    {
        State.createDefaults()
        return
    }
    if (special.ctrl)
    {
        switch (code)
        {
            case 81:
                remote.app.quit()
                break
            case 83:
                saveFile()
                break
            case 79:
                openFile()
                break
            case 78:
                newFile()
                break
            case 191: // '/' to add to clipboard the data indexed by color
                ClipBoard.writeText(PixelEditor.export())
                break
        }
    }
}

function isEditing()
{
    return ui.editing
}


function toggleWindow(name)
{
    windows[name].visible = !windows[name].visible
}

function save(filename)
{
    if (filename)
    {
        State.lastPath = path.dirname(filename)
        if (path.extname(filename) !== '.json')
        {
            filename += '.json'
        }
        State.lastFile = filename
        PixelEditor.name = path.basename(filename, path.extname(filename))
        PixelEditor.save(filename)
    }
}

function load(list)
{
    if (list && list.length)
    {
        const filename = list[0]
        PixelEditor.load(filename)
        State.lastFile = filename
        State.current = 0
        if (State.cursorX >= PixelEditor.width)
        {
            State.cursorX = 0
        }
        if (State.cursorY >= PixelEditor.height)
        {
            State.cursorY = 0
        }
        PixelEditor.emit('changed')
    }
}

function newFile()
{
    PixelEditor.create()
    State.lastFile = PixelEditor.filename
    State.current = 0
}

function saveFile()
{
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Save PIXEL file', defaultPath: State.lastPath }, save)
}

function openFile()
{
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), { title: 'Load PIXEL file', defaultPath: State.lastPath, filters: [{ name: 'JSON', extensions: ['json'] }] }, load)
}

function remove()
{
    PixelEditor.remove(PixelEditor.current)
}

module.exports = {
    isEditing,
    toggleWindow,
    saveFile,
    openFile,
    newFile,
    load,
    remove
}

const font = new FontFaceObserver('bitmap')
font.load().then(afterLoad)
Sheet.load(afterLoad)
