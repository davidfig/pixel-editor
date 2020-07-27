import { Menu, MenuItem, setApplicationMenu } from 'simple-window-manager'
import { state } from './state'
import PixelEditor from './pixel-editor'
import * as views from './views'
import * as locale from './locale'
import { main } from './index'

let _menu, _panes

state.on('last-file', createMenu)

export function createMenu()
{
    _menu = new Menu({ styles: { position: 'unset', cursor: 'default' } })

    file()
    edit()
    draw()
    view()
    frame()

    setApplicationMenu(_menu)
}

function file()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuNew'), accelerator: state.keys.New, click: () => main.newFile() } ))
    submenu.append(new MenuItem({ label: locale.get('menuSaveAs'), accelerator: state.keys.Save, click: () => main.saveFile() }))
    submenu.append(new MenuItem({ label: locale.get('menuOpen'), accelerator: state.keys.Open, click: () => main.openFile() }))
    submenu.append(new MenuItem({ label: locale.get('menuExport'), accelerator: state.keys.Export, click: () => main.exportFile() }))
    if (state.lastFiles.length)
    {
        submenu.append(new MenuItem({ type: 'separator' }))

        for (let i = 1; i < state.lastFiles.length; i++)
        {
            submenu.append(new MenuItem({ label: `&${i}. ${state.lastFiles[i].replace('.json', '')}`, accelerator: `CommandOrControl+${i}`, click: () => main.load([state.lastFiles[i]]) }))
        }
    }
    _menu.append(new MenuItem({ label: locale.get('menuFile'), submenu }))
}

function edit()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuUndo'), accelerator: state.keys.Undo, click: () => PixelEditor.undoOne() }))
    submenu.append(new MenuItem({ label: locale.get('menuRedo'), accelerator: state.keys.Redo, click: () => PixelEditor.redoOne() }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuCopy'), accelerator: state.keys.Copy, click: () => main.windows.draw.copy() }))
    submenu.append(new MenuItem({ label: locale.get('menuCut'), accelerator: state.keys.Cut, click: () => main.windows.draw.cut() }))
    submenu.append(new MenuItem({ label: locale.get('menuPaste'), accelerator: state.keys.Paste, click: () => main.windows.draw.paste() }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuSelectAll'), accelerator: state.keys.SelectAll, click: () => main.windows.draw.selectAll() }))
    _menu.append(new MenuItem({ label: locale.get('menuEdit'), submenu }))
}

function draw()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuSpace'), accelerator: state.keys.Draw, click: () => main.windows.draw.pressSpace() }))
    submenu.append(new MenuItem({ label: locale.get('menuErase'), accelerator: state.keys.Erase, click: () => main.windows.draw.erase() }))
    submenu.append(new MenuItem({ label: locale.get('menuDropper'), accelerator: state.keys.Dropper, click: () => state.foreground = PixelEditor.get(state.cursorX, state.cursorY) }))
    submenu.append(new MenuItem({ label: locale.get('menuClear'), accelerator: state.keys.Clear, click: () => main.windows.draw.clear() }))
    submenu.append(new MenuItem({ label: locale.get('menuSwapForeground'), accelerator: state.keys.SwapForeground, click: () => main.windows.palette.switchForeground() }))

    const tools = new Menu()
    const list = ['Select', 'Paint', 'Fill', 'Circle', 'Ellipse', 'Line', 'Crop']
    for (let tool of list)
    {
        tools.append(new MenuItem({ label: locale.get('menu' + tool + 'Tool'), accelerator: state.keys[tool + 'Tool'], click: () => state.tool = tool.toLowerCase() }))
    }

    submenu.append(new MenuItem({ label: locale.get('menuTools'), submenu: tools }))
    _menu.append(new MenuItem({ label: locale.get('menuDraw'), submenu }))
}

function view()
{
    function paneCreate(name)
    {
        let capitalize = name.substr(0, 1).toUpperCase() + name.substr(1)
        _panes[name] = new MenuItem({ label: locale.get('menu' + capitalize), type: 'checkbox', checked: !views.getClosed(name), click: () => views.toggleClosed(name), accelerator: state.keys[capitalize + 'Window'] })
        panes.append(_panes[name])
    }

    _panes = {}
    const panes = new Menu()
    const normal = ['frames', 'toolbar', 'palette', 'picker', 'info', 'animation', 'position', 'manager']
    for (let i = 0; i < normal.length; i++)
    {
        paneCreate(normal[i], i)
    }
    panes.append(new MenuItem({ type: 'separator' }))
    const preferences = ['keyboard']
    for (let i = 0; i < preferences.length; i++)
    {
        paneCreate(preferences[i], i + normal.length)
    }

    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuNextView'), click: () => views.change(1), accelerator: state.keys.NextView }))
    submenu.append(new MenuItem({ label: locale.get('menuPreviousView'), click: () => views.change(-1), accelerator: state.keys.PreviousView }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuPanes'), submenu: panes }))
    submenu.append(new MenuItem({ label: locale.get('menuResetPanes'), click: () => views.resetWindows(), accelerator: state.keys.ResetWindows }))
    _menu.append(new MenuItem({ label: locale.get('menuView'), submenu }))
}

function frame()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuNewFrame'), accelerator: state.keys.NewFrame, click: () => PixelEditor.add() }))
    submenu.append(new MenuItem({ label: locale.get('menuDuplicate'), accelerator: state.keys.Duplicate, click: () => PixelEditor.duplicate() }))
    submenu.append(new MenuItem({ label: locale.get('menuDelete'), accelerator: state.keys.Delete, click: () => PixelEditor.remove(PixelEditor.current) }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuNextFrame'), accelerator: state.keys.NextFrame, click: () => PixelEditor.nextFrame() }))
    submenu.append(new MenuItem({ label: locale.get('menuPreviousFrame'), accelerator: state.keys.PreviousFrame, click: () => PixelEditor.previousFrame() }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuClockwise'), accelerator: state.keys.Clockwise, click: () => PixelEditor.rotate() }))
    submenu.append(new MenuItem({ label: locale.get('menuCounterClockwise'), accelerator: state.keys.CounterClockwise, click: () => PixelEditor.rotate(true) }))
    submenu.append(new MenuItem({ label: locale.get('menuFlipHorizontal'), accelerator: state.keys.FlipHorizontal, click: () => PixelEditor.flipHorizontal() }))
    submenu.append(new MenuItem({ label: locale.get('menuFlipVertical'), accelerator: state.keys.FlipVertical, click: () => PixelEditor.flipVertical() }))

    _menu.append(new MenuItem({ label: locale.get('menuFrames'), submenu }))
}

export function toggleAll()
{
    let i = 0
    for (let pane in _panes)
    {
        _panes[pane].checked = !state.views[state.view][i++].closed
    }
}

export function toggle(name)
{
    _panes[name].checked = !_panes[name].checked
}

export function menuHeight()
{
    return _menu.div.offsetHeight
}