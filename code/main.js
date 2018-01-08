const Settings = require('./settings')

const remote = require('electron').remote
const path = require('path')
const ClipBoard = require('electron').clipboard
const WM = require(Settings.WINDOW_MANAGER)

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
const Export = require('./export')

let ui, loading = 1, windows = {}

function afterLoad()
{
    loading--
    if (loading)
    {
        return
    }

    Menu()

    if (!Settings.NO_LOAD && State.lastFile)
    {
        PixelEditor.load(State.lastFile)
    }

    create()
}

function create()
{
    ui = new WM({
        backgroundColorWindow: '#cccccc',
        maximizable: false,
        titlebarHeight: '20px',
        borderRadius: '0 0 4px 4px'
    })
    windows.draw = new Draw(ui.overlay, ui)

    windows.show = new Show(ui)

    windows.toolbar = new Toolbar(ui)
    windows.palette = new Palette(ui)
    windows.picker = new Picker(ui)
    windows.coords = new Coords(ui)
    windows.animation = new Animation(ui)

    document.body.addEventListener('keydown', keydown)
}

function keydown(e)
{
    const code = e.keyCode

    // reload on ctrl-r key (should be disabled when not debugging)
    if (e.ctrlKey && code === 82) window.location.reload()

    this.shift = e.shiftKey
    if (e.ctrlKey && code >= 48 && code <= 57)
    {
        let i = code === 48 ? 10 : code - 48
        if (i < State.lastFiles.length)
        {
            load([State.lastFiles[i]])
        }
    }
    if (e.ctrlKey && e.shiftCode && code === 68)
    {
        State.createDefaults()
        return
    }
    if (e.ctrlKey)
    {
        switch (code)
        {
            case 8:
                remove()
                break
            case 81: // ctrl-q
                remote.app.quit()
                break
            case 83: // ctrl-s
                saveFile()
                break
            case 70: // ctrl-f
                add()
                break
            case 79: // ctrl-o
                openFile()
                break
            case 78: // ctrl-n
                newFile()
                break
            case 191: // '/' to add to clipboard the data indexed by color
                ClipBoard.writeText(PixelEditor.export())
                break
            case 188: // ,
                rotate(true)
                break
            case 190: // .
                rotate()
                break
            case 72: // h
                flipHorizontal()
                break
            case 66: // b
                flipVertical()
                break
        }
    }
    for (let window in windows)
    {
        windows[window].keydown(e)
    }
    // console.log(code)
}

function toggleWindow(name)
{
    State.toggleHidden(name)
    if (State.getHidden(name))
    {
        windows[name].visible = false
    }
    else
    {
        windows[name].visible = true
        windows[name].layout()
    }
    ui.dirty = true
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
        let filename = list[0]
        if (filename.indexOf('.editor.'))
        {
            filename = filename.replace('.editor.', '')
        }
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
    }
}

function newFile()
{
    PixelEditor.create()
    State.lastFile = PixelEditor.filename
    State.current = 0
    State.cursorX = State.cursorY = 0
    State.cursorSizeX = State.cursorSizeY = 1
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

function add()
{
    PixelEditor.add()
}

function duplicate()
{
    PixelEditor.duplicate()
}

function rotate(reverse)
{
    PixelEditor.rotate(reverse)
}

function flipHorizontal()
{
    PixelEditor.flipHorizontal()
}

function flipVertical()
{
    PixelEditor.flipVertical()
}

function exportFile()
{
// TODO
    ui.addChild(new Export())

}

module.exports = {
    toggleWindow,
    saveFile,
    openFile,
    newFile,
    exportFile,
    load,
    remove,
    add,
    duplicate,
    rotate,
    flipHorizontal,
    flipVertical
}

Sheet.load(afterLoad)
