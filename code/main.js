const Renderer = require('yy-renderer')
const FontFaceObserver = require('fontfaceobserver')
const Input = require('yy-input')
const remote = require('electron').remote
const path = require('path')

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

let renderer, ui, input, loading = 2, windows = {}

function afterLoad()
{
    Menu()

    loading--
    if (loading)
    {
        return
    }

    renderer = new Renderer({ debug: true, autoresize: true })
    create()

    input = new Input({ noPointers: true })
    input.on('keyup', keyup)
    renderer.interval(update)
    renderer.start()
}

function create()
{
    renderer.clear()

    ui = renderer.add(new UI())
    windows.draw = ui.addChild(new Draw())
    windows.toolbar = ui.addChild(new Toolbar())
    windows.palette = ui.addChild(new Palette())
    windows.picker = ui.addChild(new Picker())
    windows.coords = ui.addChild(new Coords())
}

function update(elapsed)
{
    if (ui.update(elapsed))
    {
        renderer.dirty = true
    }
}

function keyup(code, special)
{
    if (ui.editing)
    {
        return
    }
    this.shift = special.shift
    if (special.ctrl && code >= 48 && code <= 57)
    {
        let i = code === 48 ? 10 : code - 48
        if (i < State.lastFiles.length)
        {
            // load([State.lastFiles[i]])
            return
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
    State.lastPath = path.dirname(filename)
    if (path.extname(filename) !== '.json')
    {
        filename += '.json'
    }
    State.lastFile = filename
    PixelEditor.save(filename)
}

function load(list)
{
    if (list && list.length)
    {
        const filename = list[0]
        PixelEditor.load(filename)
        State.lastFile = filename
        State.current = 0
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

module.exports = {
    isEditing,
    toggleWindow,
    saveFile,
    openFile,
    newFile
}

const font = new FontFaceObserver('bitmap')
font.load().then(afterLoad)
Sheet.load(afterLoad)
