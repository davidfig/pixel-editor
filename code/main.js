const Settings = require('./settings')

const libraries = require('./config/libraries')
const WM = libraries.WM

const File = require('./config/file')
const clipboard = require('./config/clipboard')
const Misc = require('./config/misc')

const Toolbar = require('./toolbar')
const Palette = require('./palette')
const Picker = require('./picker')
const Info = require('./info')
const Sheet = require('./sheet')
const Draw = require('./draw')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Menu = require('./config/menu')
const Show = require('./show')
const Animation = require('./animation')
const Export = require('./export')
const Position = require('./position')
const Manager = require('./manager')

let ui, loading = 2, windows = {}

function afterLoad()
{
    loading--
    if (loading)
    {
        return
    }
    PixelEditor.create(Settings.NO_LOAD ? null : State.lastFile, () =>
    {
        create()
        Menu()
    })
}

function create()
{
    ui = new WM({
        backgroundColorTitlebarActive: '#555555',
        backgroundColorTitlebarInactive: '#444444',
        backgroundColorWindow: '#333333',
        maximizable: false,
        titlebarHeight: '1.25em',
        borderRadius: 'none',
        shadow: 'none',
        snap: { }
    })

    ui.win.style.position = 'absolute'
    ui.win.style.margin = '1.25em 0 0 0'

    windows.draw = new Draw(ui.overlay, ui)
    windows.show = new Show(ui)
    windows.toolbar = new Toolbar(ui)
    windows.palette = new Palette(ui)
    windows.picker = new Picker(ui)
    windows.info = new Info(ui)
    windows.animation = new Animation(ui)
    windows.position = new Position(ui, windows.draw)
    windows.manager = new Manager(ui)

    reposition()

    // document.body.addEventListener('keydown', keydown)
}

function reposition()
{
    State.position(ui)
    windows.show.resize()
    windows.palette.resize()
}

function resetWindows()
{
    State.positionDefault()
    State.save()
    reposition()
}

function getHidden(name)
{
    return windows[name].win.closed
}

function toggleHidden(name)
{
    if (windows[name].win.closed)
    {
        windows[name].win.open()
    }
    else
    {
        windows[name].win.close()
    }
    State.set()
}

function keydown(e)
{
    const code = e.keyCode

    // reload on ctrl-r key (should be disabled when not debugging)
    if (e.ctrlKey && code === 82) window.location.reload()

    if (e.ctrlKey && e.shiftKey && code === 73)
    {
        Misc.toggleDevTools()
    }

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
            case 69: // ctrl-e
                exportFile()
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
                clipboard.writeText(PixelEditor.export())
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
    windows.position.pressed(1)
    windows.position.pressed(3)
}

function saveFile()
{
    File.saveFileDialog(State.lastPath, save)
}

function openFile()
{
    File.openFileDialog(State.lastPath, load)
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
    new Export(ui)
}

module.exports = {
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
    flipVertical,
    windows,
    getHidden,
    toggleHidden,
    resetWindows
}

// Sheet.load(afterLoad)

window.onload = () =>
{
    State.load(afterLoad)
    Sheet.load(afterLoad)
}