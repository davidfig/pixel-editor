const remote = require('electron').remote
const app = remote.app
const Menu = remote.Menu
const path = require('path')

let Main

const State = require('./state')

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
        submenu.push({ label: item[0], type: 'checkbox', checked: true, click: () => Main.toggleWindow(item[1]) })
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
        ['&Paste (Ctrl-V)'],
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
        // ['&Animation', 'animation'],
        ['Coor&dinates', 'coords'],
        ['&Palette', 'palette'],
        ['&Color Picker', 'picker'],
        // ['&Frame Selector', 'show'],
        ['&Toolbar', 'toolbar'],
        ['&Editor', 'draw'],
    ])
    append('F&rame', [
        ['&Duplicate (Ctrl-D)', 'duplicate'],
        ['D&elete', () => Main.remove()],
        ['&New Frame (Ctrl-F)', () => Main.add()]
    ])
    Menu.setApplicationMenu(Menu.buildFromTemplate(_template))
}

State.on('last-file', menu)

module.exports = menu