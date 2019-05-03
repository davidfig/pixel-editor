const remote = require('electron').remote
const app = remote.app
const Menu = remote.Menu
const MenuItem = remote.MenuItem
const path = require('path')

const locale = require('./locale')
const State = require('./state')

let Main
let _menu

function file()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuNew'), accelerator: 'CommandOrControl+N', click: () => Main.newFile() }))
    submenu.append(new MenuItem({ label: locale.get('menuSaveAs'), accelerator: 'CommandOrControl+S', click: () => Main.saveFile() }))
    submenu.append(new MenuItem({ label: locale.get('menuOpen'), accelerator: 'CommandOrControl+O', click: () => Main.openFile() }))
    submenu.append(new MenuItem({ label: locale.get('menuExport'), accelerator: 'CommandOrControl+E', click: () => Main.exportFile() }))
    submenu.append(new MenuItem({ type: 'separator' }))

    for (let i = 1; i < State.lastFiles.length; i++)
    {
        submenu.append(new MenuItem({ label: '&' + i + '. ' + path.basename(State.lastFiles[i], '.json'), accelerator: 'CommandOrControl+' + i, click: () => Main.load([State.lastFiles[i]]) }))
    }
    if (State.lastFiles.length)
    {
        submenu.append(new MenuItem({ type: 'separator' }))
    }
    submenu.append(new MenuItem({ label: locale.get('menuExit'), accelerator: 'CommandOrControl+Q', click: () => app.quit() }))
    _menu.append(new MenuItem({ label: locale.get('menuFile'), submenu }))
}

function edit()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuCopy'), accelerator: 'CommandOrControl+C', click: () => { Main.windows.draw.copy() }}))
    submenu.append(new MenuItem({ label: locale.get('menuCut'), accelerator: 'CommandOrControl+X', click: () => { Main.windows.draw.cut() }}))
    submenu.append(new MenuItem({ label: locale.get('menuPaste'), accelerator: 'CommandOrControl+V', click: () => { Main.windows.draw.paste() }}))
    _menu.append(new MenuItem({ label: locale.get('menuEdit'), submenu }))
}

function view()
{
    const panes = new Menu()
    panes.append(new MenuItem({ label: locale.get('menuToolbar'), type: 'checkbox', checked: !Main.getHidden('toolbar'), click: () => Main.toggleHidden('toolbar') }))
    panes.append(new MenuItem({ label: locale.get('menuInfo'), type: 'checkbox', checked: !Main.getHidden('info'), click: () => Main.toggleHidden('info') }))
    panes.append(new MenuItem({ label: locale.get('menuAnimation'), type: 'checkbox', checked: !Main.getHidden('animation'), click: () => Main.toggleHidden('animation'), accelerator: 'A', click: () => Main.toggleHidden('animation') }))
    panes.append(new MenuItem({ label: locale.get('menuPalette'), type: 'checkbox', checked: !Main.getHidden('palette'), click: () => Main.toggleHidden('palette') }))
    panes.append(new MenuItem({ label: locale.get('menuPicker'), type: 'checkbox', checked: !Main.getHidden('picker'), click: () => Main.toggleHidden('picker') }))
    panes.append(new MenuItem({ label: locale.get('menuFrames'), type: 'checkbox', checked: !Main.getHidden('show'), click: () => Main.toggleHidden('show') }))
    panes.append(new MenuItem({ label: locale.get('menuPosition'), type: 'checkbox', checked: !Main.getHidden('position'), click: () => Main.toggleHidden('position') }))
    panes.append(new MenuItem({ label: locale.get('menuManager'), type: 'checkbox', checked: !Main.getHidden('manager'), click: () => Main.toggleHidden('manager'), accelerator: 'M', click: () => Main.toggleHidden('manager') }))

    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuPanes'), submenu: panes }))
    submenu.append(new MenuItem({ label: locale.get('menuResetPanes'), click: () => Main.resetWindows() }))
    _menu.append(new MenuItem({ label: locale.get('menuView'), submenu, accelerator: 'Alt+V' }))
}

function frame()
{
    const submenu = new Menu()
    submenu.append(new MenuItem({ label: locale.get('menuDuplicate'), accelerator: 'CommandOrControl+D', click: () => Main.duplicate() }))
    submenu.append(new MenuItem({ label: locale.get('menuDelete'), accelerator: 'CommandOrControl+Backspace', click: () => Main.remove() }))
    submenu.append(new MenuItem({ label: locale.get('menuNewFrame'), accelerator: 'CommandOrControl+F', click: () => Main.add() }))
    submenu.append(new MenuItem({ type: 'separator' }))
    submenu.append(new MenuItem({ label: locale.get('menuClockwise'), accelerator: 'CommandOrControl+.', click: () => Main.rotate() }))
    submenu.append(new MenuItem({ label: locale.get('menuCounterClockwise'), accelerator: 'CommandOrControl+,', click: () => Main.rotate(true) }))
    submenu.append(new MenuItem({ label: locale.get('menuFlipHorizontal'), accelerator: 'CommandOrControl+H', click: () => Main.flipHorizontal() }))
    submenu.append(new MenuItem({ label: locale.get('menuFlipVertical'), accelerator: 'CommandOrControl+B', click: () => Main.flipVertical() }))

    _menu.append(new MenuItem({ label: locale.get('menuFrames'), submenu }))
}

function menu()
{
    Main = require('./main')
    _menu = new Menu()

    file()
    edit()
    view()
    frame()

    Menu.setApplicationMenu(_menu)
}

State.on('last-file', menu)

module.exports = menu