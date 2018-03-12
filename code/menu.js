const Misc = require('./config/misc')
const Menu = require('./config/misc').Menu
const MenuItem = require('./config/misc').MenuItem
const path = require('path')

const locale = require('./locale')
const State = require('./state')
const PixelEditor = require('./pixel-editor')

let Main, Keys
let _menu, _panes

function file()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuNew'), accelerator: Keys.New, click: () => Main.newFile() } ))
    submenu.append(new MenuItem({ label: locale.get('menuSaveAs'), accelerator: Keys.Save, click: () => Main.saveFile() }))
    submenu.append(new MenuItem({ label: locale.get('menuOpen'), accelerator: Keys.Open, click: () => Main.openFile() }))
    submenu.append(new MenuItem({ label: locale.get('menuExport'), accelerator: Keys.Export, click: () => Main.exportFile() }))
    if (State.lastFiles.length)
    {
        submenu.append(new MenuItem({ type: 'separator' }))

        for (let i = 1; i < State.lastFiles.length; i++)
        {
            submenu.append(new MenuItem({ label: '&' + i + '. ' + path.basename(State.lastFiles[i], '.json'), accelerator: 'CommandOrControl+' + i, click: () => Main.load([State.lastFiles[i]]) }))
        }
    }
    if (Misc.isElectron)
    {
        submenu.append(new MenuItem({ type: 'separator' }))
        submenu.append(new MenuItem({ label: locale.get('menuExit'), accelerator: Keys.exit, click: () => Misc.quit() }))
    }
    _menu.append(new MenuItem({ label: locale.get('menuFile'), submenu }))
}

function edit()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuUndo'), accelerator: Keys.Undo, click: () => PixelEditor.redoOne() }))
    submenu.append(new MenuItem({ label: locale.get('menuRedo'), accelerator: Keys.Redo, click: () => PixelEditor.undoOne() }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuCopy'), accelerator: Keys.Copy, click: () => Main.windows.draw.copy() }))
    submenu.append(new MenuItem({ label: locale.get('menuCut'), accelerator: Keys.Cut, click: () => Main.windows.draw.cut() }))
    submenu.append(new MenuItem({ label: locale.get('menuPaste'), accelerator: Keys.Paste, click: () => Main.windows.draw.paste() }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuSelectAll'), accelerator: Keys.SelectAll, click: () => Main.windows.draw.selectAll() }))
    _menu.append(new MenuItem({ label: locale.get('menuEdit'), submenu }))
}

function draw()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuSpace'), accelerator: Keys.Draw, click: () => Main.windows.draw.pressSpace() }))
    submenu.append(new MenuItem({ label: locale.get('menuErase'), accelerator: Keys.Erase, click: () => Main.windows.draw.erase() }))
    submenu.append(new MenuItem({ label: locale.get('menuDropper'), accelerator: Keys.Dropper, click: () => State.foreground = PixelEditor.get(State.cursorX, State.cursorY) }))
    submenu.append(new MenuItem({ label: locale.get('menuClear'), accelerator: Keys.Clear, click: () => Main.windows.draw.clear() }))
    submenu.append(new MenuItem({ label: locale.get('menuSwapForeground'), accelerator: Keys.SwapForeground, click: () => Main.windows.palette.switchForeground() }))

    const tools = new Menu()
    const list = ['Select', 'Paint', 'Fill', 'Circle', 'Ellipse', 'Line', 'Crop']
    for (let tool of list)
    {
        tools.append(new MenuItem({ label: locale.get('menu' + tool + 'Tool'), accelerator: Keys[tool + 'Tool'], click: () => State.tools = tool.toLowerCase() }))
    }

    submenu.append(new MenuItem({ label: locale.get('menuTools'), submenu: tools }))
    _menu.append(new MenuItem({ label: locale.get('menuDraw'), submenu }))
}

function view()
{
    function paneCreate(name)
    {
        let capitalize = name.substr(0, 1).toUpperCase() + name.substr(1)
        _panes[name] = new MenuItem({ label: locale.get('menu' + capitalize), type: 'checkbox', checked: !Main.getHidden(name), click: () => Main.toggleHidden(name), accelerator: Keys[capitalize + 'Window'] })
        panes.append(_panes[name])
    }

    _panes = {}
    const panes = new Menu()
    const list = ['toolbar', 'info', 'animation', 'palette', 'picker', 'frames', 'position', 'manager']
    for (let item of list)
    {
        paneCreate(item)
    }
    // panes.append(new MenuItem({ label: locale.get('menuToolbar'), type: 'checkbox', checked: !Main.getHidden('toolbar'), click: () => Main.toggleHidden('toolbar'), accelerator: Keys.ToolbarWindow }))
    // panes.append(new MenuItem({ label: locale.get('menuInfo'), type: 'checkbox', checked: !Main.getHidden('info'), click: () => Main.toggleHidden('info'), accelerator: Keys.InfoWindow }))
    // panes.append(new MenuItem({ label: locale.get('menuAnimation'), type: 'checkbox', checked: !Main.getHidden('animation'), click: () => Main.toggleHidden('animation'), accelerator: Keys.AnimationWindow, click: () => Main.toggleHidden('animation') }))
    // panes.append(new MenuItem({ label: locale.get('menuPalette'), type: 'checkbox', checked: !Main.getHidden('palette'), click: () => Main.toggleHidden('palette'), accelerator: Keys.PaletteWindow }))
    // panes.append(new MenuItem({ label: locale.get('menuPicker'), type: 'checkbox', checked: !Main.getHidden('picker'), click: () => Main.toggleHidden('picker'), accelerator: Keys.PickerWindow }))
    // panes.append(new MenuItem({ label: locale.get('menuFrames'), type: 'checkbox', checked: !Main.getHidden('show'), click: () => Main.toggleHidden('show'), accelerator: Keys.FramesWindow }))
    // panes.append(new MenuItem({ label: locale.get('menuPosition'), type: 'checkbox', checked: !Main.getHidden('position'), click: () => Main.toggleHidden('position'), accelerator: Keys.PositionWindow }))
    // panes.append(new MenuItem({ label: locale.get('menuManager'), type: 'checkbox', checked: !Main.getHidden('manager'), click: () => Main.toggleHidden('manager'), accelerator: Keys.ManagerWindow, click: () => Main.toggleHidden('manager') }))

    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuPanes'), submenu: panes }))
    submenu.append(new MenuItem({ label: locale.get('menuResetPanes'), click: () => Main.resetWindows(), accelerator: Keys.ResetWindows }))
    _menu.append(new MenuItem({ label: locale.get('menuView'), submenu }))
}

function frame()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuNewFrame'), accelerator: Keys.NewFrame, click: () => PixelEditor.add() }))
    submenu.append(new MenuItem({ label: locale.get('menuDuplicate'), accelerator: Keys.Duplicate, click: () => PixelEditor.duplicate() }))
    submenu.append(new MenuItem({ label: locale.get('menuDelete'), accelerator: Keys.Delete, click: () => PixelEditor.remove(PixelEditor.current) }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuClockwise'), accelerator: Keys.Clockwise, click: () => PixelEditor.rotate() }))
    submenu.append(new MenuItem({ label: locale.get('menuCounterClockwise'), accelerator: Keys.CounterClockwise, click: () => PixelEditor.rotate(true) }))
    submenu.append(new MenuItem({ label: locale.get('menuFlipHorizontal'), accelerator: Keys.FlipHorizontal, click: () => PixelEditor.flipHorizontal() }))
    submenu.append(new MenuItem({ label: locale.get('menuFlipVertical'), accelerator: Keys.FlipVertical, click: () => PixelEditor.flipVertical() }))

    _menu.append(new MenuItem({ label: locale.get('menuFrames'), submenu }))
}

function create()
{
    Main = require('./main')
    Keys = State.keys

    _menu = new Menu({ styles: { position: 'unset' } })

    file()
    edit()
    draw()
    view()
    frame()

    Menu.setApplicationMenu(_menu)
}

function toggle(name)
{
    _panes[name].checked = !_panes[name].checked
}

State.on('last-file', create)

module.exports = {
    create,
    toggle,
    get Accelerator()
    {
        return Menu.GlobalAccelerator
    },
    height: () => { return _menu.div.offsetHeight }
}