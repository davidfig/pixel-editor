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

module.exports = function ()
{
    Main = require('./main')
    _template = []
    const list = [
        ['&New (Ctrl-N)', Main.newFile],
        ['&Save... (Ctrl-S)', Main.saveFile],
        ['&Open... (Ctrl-O)', Main.openFile],
        ['separator']]
    for (let i = 1; i < State.lastFiles.length; i++)
    {
        list.push(['&' + i + '. ' + path.basename(State.lastFiles[i], '.json') + ' (Ctrl+' + i + ')', 'open***' + State.lastFiles[i]])
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
        ['&Paint (B)', () => State.tools = 'paint'],
        ['&Select (V)', () => State.tools = 'select'],
        ['&Circle (C)', () => State.tools = 'circle'],
        ['&Ellipse (E)', () => State.tools = 'ellipse'],
        ['&Line (L)', () => State.tools = 'line'],
        ['&Fill (F)', () => State.tools = 'fill']
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
        ['D&elete', 'delete'],
        ['&New Frame', 'frame']
    ])
    Menu.setApplicationMenu(Menu.buildFromTemplate(_template))
}