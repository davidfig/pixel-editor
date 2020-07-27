import { WindowManager } from 'simple-window-manager'
import Fps from 'yy-fps'

import { FPS, NO_LOAD } from './settings'
import * as views from './views'
import { createSheet } from './sheet'
import { Draw } from './draw'
import { state } from './state'
import PixelEditor from './pixel-editor'
import { createMenu, menuHeight } from './menu'
// import Export from './export'
// import Keys from './keys'

import { Toolbar } from './frames/toolbar'
import { Palette }  from './frames/palette'
import { Picker }  from './frames/picker'
import { Info }  from './frames/info'
import { Frames } from './frames/frames'
import { Animation } from './frames/animation'
import { Position } from './frames/position'
import { Manager }  from './frames/manager'
import { Keyboard } from './frames/preferences/keyboard'
import { setupKeys } from './keys'

class Main
{
    async afterLoad()
    {
        if (FPS)
        {
            this.fpsSetup()
        }
        await PixelEditor.create(NO_LOAD ? null : state.lastFile)
        this.create()
        setupKeys(this)
    }

    fpsSetup()
    {
        function frame()
        {
            fps.frame()
            requestAnimationFrame(frame)
        }
        const fps = new Fps()
        frame()
    }

    create()
    {
        views.init()
        createMenu()
        this.wm = new WindowManager({ snap: true }, {
            backgroundTitlebarActive: '#666666',
            backgroundTitlebarInactive: '#444444',
            backgroundWindow: '#333333',
            foregroundTitle: '#888888',
            maximizable: false,
            closable: true,
            resizable: true,
            titlebarHeight: '1.25rem',
            borderRadius: 'none',
            shadow: 'none',
        })
        this.setupWindows()
        state.start()
        document.body.style.opacity = 1
    }

    setupWindows()
    {
        this.windows = {}
        this.windows.draw = new Draw(this.wm)
        this.windows.frames = new Frames(this.wm)
        this.windows.toolbar = new Toolbar(this.wm)
        this.windows.palette = new Palette(this.wm)
        this.windows.picker = new Picker(this.wm)
        this.windows.info = new Info(this.wm)
        this.windows.animation = new Animation(this.wm)
        this.windows.position = new Position(this.wm, this.windows.draw)
        this.windows.manager = new Manager(this.wm)
        this.windows.keyboard = new Keyboard(this.wm)
        for (const name in this.windows)
        {
            const win = this.windows[name].win
            if (win)
            {
                win.on('resize-end', () => views.update())
                win.on('move-end', () => views.update())
            }
        }
        views.apply()
    }

    toggleHidden(name)
    {
        if (this.windows[name].win.closed)
        {
            this.windows[name].win.open()
        }
        else
        {
            this.windows[name].win.close()
        }
    }

//     save: function(filename)
//     {
//         if (filename)
//         {
//             State.lastPath = path.dirname(filename)
//             if (path.extname(filename) !== '.json')
//             {
//                 filename += '.json'
//             }
//             State.lastFile = filename
//             PixelEditor.name = path.basename(filename, path.extname(filename))
//             PixelEditor.save(filename)
//         }
//     },

//     load: async function(list)
//     {
//         if (list && list.length)
//         {
//             let filename = list[0]
//             if (filename.indexOf('.editor.'))
//             {
//                 filename = filename.replace('.editor.', '')
//             }
//             await PixelEditor.load(filename)
//             State.lastFile = filename
//             State.current = 0
//             if (State.cursorX >= PixelEditor.width)
//             {
//                 State.cursorX = 0
//             }
//             if (State.cursorY >= PixelEditor.height)
//             {
//                 State.cursorY = 0
//             }
//         }
//     },

//     newFile: async function()
//     {
//         await PixelEditor.create()
//         State.lastFile = PixelEditor.filename
//         State.current = 0
//         State.cursorX = State.cursorY = 0
//         State.cursorSizeX = State.cursorSizeY = 1
//         windows.position.pressed(1)
//         windows.position.pressed(3)
//     },

//     saveFile: function()
//     {
//         File.saveFileDialog(State.lastPath, Main.save)
//     },

//     openFile: function()
//     {
//         File.openFileDialog(State.lastPath, Main.load)
//     },

//     exportFile: function()
//     {
//         new Export(wm)
//     }
}

export const main = new Main()

window.onload = async () =>
{
    document.body.style.opacity = 0
    await state.load()
    await createSheet()
    main.afterLoad()
}