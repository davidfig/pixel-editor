const path = require('path')

const libraries = require('./config/libraries')
const WM = libraries.WM
const File = require('./config/file')
const FPS = require('yy-fps')

const Settings = require('./settings')
const Views = require('./views')
const Sheet = require('./sheet')
const Draw = require('./draw')
const State = require('./state')
const PixelEditor = require('./pixel-editor')
const Menu = require('./menu')
const Export = require('./export')
const Keys = require('./keys')

const Toolbar = require('./frames/toolbar')
const Palette = require('./frames/palette')
const Picker = require('./frames/picker')
const Info = require('./frames/info')
const Frames = require('./frames/frames')
const Animation = require('./frames/animation')
const Position = require('./frames/position')
const Manager = require('./frames/manager')
const Keyboard = require('./frames/preferences/keyboard')

let wm, windows = {}, fps

const Main = {

    afterLoad: async function()
    {
        if (Settings.FPS)
        {
            Main.fpsSetup()
        }
        await PixelEditor.create(Settings.NO_LOAD ? null : State.lastFile)
        Main.create()
        Menu.create()
        Keys.setup(Main)
    },

    fpsSetup: function ()
    {
        function frame()
        {
            fps.frame()
            requestAnimationFrame(frame)
        }
        fps = new FPS()
        frame()
    },

    create: function()
    {
        wm = new WM({
            backgroundColorTitlebarActive: '#555555',
            backgroundColorTitlebarInactive: '#444444',
            backgroundColorWindow: '#333333',
            foregroundColorTitle: '#666666',
            maximizable: false,
            titlebarHeight: '1.25em',
            borderRadius: 'none',
            shadow: 'none',
            snap: {}
        })

        windows.draw = new Draw(wm.overlay, wm)
        windows.frames = new Frames(wm)
        windows.toolbar = new Toolbar(wm)
        windows.palette = new Palette(wm)
        windows.picker = new Picker(wm)
        windows.info = new Info(wm)
        windows.animation = new Animation(wm)
        windows.position = new Position(wm, windows.draw)
        windows.manager = new Manager(wm)
        windows.keyboard = new Keyboard(wm)

        for (let name in windows)
        {
            const win = windows[name].win
            if (win)
            {
                win.on('resize-end', () => Views.update())
                win.on('move-end', () => Views.update())
                if (Menu.height)
                {
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
        }
        Views.init(wm, Main)
        State.start()
        setTimeout(() => document.body.style.opacity = 1, 500)
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

    newFile: async function()
    {
        await PixelEditor.create()
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
        new Export(wm)
    },

    get windows()
    {
        return windows
    },

    get wm()
    {
        return wm
    }
}

module.exports = Main

window.onload = async () =>
{
    document.body.style.opacity = 0
    await State.load()
    await Sheet.load()
    Main.afterLoad()
}