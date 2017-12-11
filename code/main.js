const Settings = require('./settings')

const Renderer = require('yy-renderer')
const FontFaceObserver = require('fontfaceobserver')
const remote = require('electron').remote
const path = require('path')
const ClipBoard = require('electron').clipboard

const UI = require(Settings.UI)
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

let renderer, ui, loading = 2, windows = {}

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

    renderer = new Renderer({ debug: true, autoresize: true })
    create()

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

    ui.addListener('keydown', keydown)
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
    // console.log(code)
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
    ui.addChild(new Export())
    // const filename = remote.dialog.showSaveDialog(remote.getCurrentWindow(), { buttonLabel: 'export' })

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

const font = new FontFaceObserver('bitmap')
font.load().then(afterLoad)
Sheet.load(afterLoad)
