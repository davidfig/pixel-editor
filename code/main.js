const path = require('path')

const libraries = require('./config/libraries')
const WM = libraries.WM
const File = require('./config/file')

const Settings = require('./settings')
const Toolbar = require('./toolbar')
const Palette = require('./palette')
const Picker = require('./picker')
const Info = require('./info')
const Sheet = require('./sheet')
const Draw = require('./draw')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Menu = require('./menu')
const Show = require('./show')
const Animation = require('./animation')
const Export = require('./export')
const Position = require('./position')
const Manager = require('./manager')
const Keys = require('./keys')

let ui, loading = 2, windows = {}

const Main = {

    afterLoad: function()
    {
        loading--
        if (loading)
        {
            return
        }
        PixelEditor.create(Settings.NO_LOAD ? null : State.lastFile, () =>
        {
            Main.create()
            Menu.create()
            Keys.setup(Main)
        })
    },

    create: function()
    {
        ui = new WM({
            backgroundColorTitlebarActive: '#555555',
            backgroundColorTitlebarInactive: '#444444',
            backgroundColorWindow: '#333333',
            maximizable: false,
            titlebarHeight: '1.25em',
            borderRadius: 'none',
            shadow: 'none',
            snap: {}
        })

        windows.draw = new Draw(ui.overlay, ui)
        windows.show = new Show(ui)
        windows.toolbar = new Toolbar(ui)
        windows.palette = new Palette(ui)
        windows.picker = new Picker(ui)
        windows.info = new Info(ui)
        windows.animation = new Animation(ui)
        windows.position = new Position(ui, windows.draw)
        windows.manager = new Manager(ui)

        if (Menu.height)
        {
            for (let name in windows)
            {
                const win = windows[name].win
                if (win)
                {
                    win.on('move-end', () =>
                    {
                        if (win.y < Menu.height)
                        {
                            win.y = Menu.height
                        }
                    })
                }
            }
        }

        Main.reposition()
    },

    reposition: function()
    {
        State.position(ui)
        windows.show.resize()
        windows.palette.resize()
    },

    resetWindows: function()
    {
        State.positionDefault()
        State.save()
        Main.reposition()
    },

    getHidden: function(name)
    {
        return windows[name].win.closed
    },

    toggleHidden: function(name)
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
    },

    save: function(filename)
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
    },

    load: function(list)
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
    },

    newFile: function()
    {
        PixelEditor.create()
        State.lastFile = PixelEditor.filename
        State.current = 0
        State.cursorX = State.cursorY = 0
        State.cursorSizeX = State.cursorSizeY = 1
        windows.position.pressed(1)
        windows.position.pressed(3)
    },

    saveFile: function()
    {
        File.saveFileDialog(State.lastPath, Main.save)
    },

    openFile: function()
    {
        File.openFileDialog(State.lastPath, Main.load)
    },

    exportFile: function()
    {
        new Export(ui)
    },

    get windows()
    {
        return windows
    }
}

module.exports = Main

window.onload = () =>
{
    State.load(Main.afterLoad)
    Sheet.load(Main.afterLoad)
}