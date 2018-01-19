const remote = require('electron').remote
const app = remote.app
const Menu = remote.Menu
const path = require('path')

const State = require('./state')
let Main

let _template = []

function append(label, items)
{
    const submenu = []
    _template.push({ label, submenu })
    for (let item of items)
    {
        if (item[0] === 'separator')
        {
            submenu.push({ type: 'separator' })
        }
        else
        {
            submenu.push({ label: item[0], click: item[1] })
        }
    }
}

function view(label, items)
{
    const submenu = []
    _template.push({ label, submenu })
    for (let item of items)
    {
        submenu.push({ label: item[0], type: 'checkbox', checked: !State.getHidden(item[1]), click: () => Main.toggleWindow(item[1]) })
    }
}

function menu()
{
    Main = require('./main')
    _template = []
    const list = [
        ['&New (Ctrl-N)', Main.newFile],
        ['&Save As... (Ctrl-S)', Main.saveFile],
        ['&Open... (Ctrl-O)', Main.openFile],
        ['&Export... (Ctrl-E)', Main.exportFile],
        ['separator']]
    for (let i = 1; i < State.lastFiles.length; i++)
    {
        list.push(['&' + i + '. ' + path.basename(State.lastFiles[i], '.json') + ' (Ctrl+' + i + ')', () => Main.load([State.lastFiles[i]])])
    }
    if (State.lastFiles.length)
    {
        list.push(['separator'])
    }
    list.push(
        ['E&xit (Ctrl-Q)', () => app.quit()]
    )
    append('&File', list)
    append('&Edit', [
        ['&Copy (Ctrl-C)'],
        ['C&ut (Ctrl-X)'],
        ['&Paste (Ctrl-V)']
    ])
    append('&Tools', [
        ['&Paint (B)', () => State.tool = 'paint'],
        ['&Select (V)', () => State.tool = 'select'],
        ['&Circle (C)', () => State.tool = 'circle'],
        ['&Ellipse (E)', () => State.tool = 'ellipse'],
        ['&Line (L)', () => State.tool = 'line'],
        ['&Fill (F)', () => State.tool = 'fill']
    ])
    view('&View', [
        ['&Editor', 'draw'],
        ['&Info', 'coords'],
        ['&Animation', 'animation'],
        ['&Palette', 'palette'],
        ['&Color Picker', 'picker'],
        ['&Frame Selector', 'show'],
        ['&Toolbar', 'toolbar'],
    ])
    append('F&rame', [
        ['&Duplicate (Ctrl-d)', () => Main.duplicate()],
        ['D&elete (Ctrl-bkspc)', () => Main.remove()],
        ['&New Frame (Ctrl-f)', () => Main.add()],
        ['separator'],
        ['&Rotate Frame (Ctrl-.)', () => Main.rotate()],
        ['&Rotate Frame (Ctrl-,)', () => Main.rotate(true)],
        ['Flip &Horizontal (Ctrl-h)', () => Main.flipHorizontal()],
        ['Flip &Vertical (Ctrl-b)', () => Main.flipVertical()]
    ])
    Menu.setApplicationMenu(Menu.buildFromTemplate(_template))
}

State.on('last-file', menu)

module.exports = menu