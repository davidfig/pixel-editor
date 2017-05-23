const Menu = require('electron').Menu;
const app = require('electron').app;
const path = require('path');

const State = require('./data/state.js');

let _template = [], _windows;

function append(label, items)
{
    const submenu = [];
    _template.push({ label, submenu });
    for (let item of items)
    {
        if (item[0] === 'separator')
        {
            submenu.push({ type: 'separator' });
        }
        else if (item[1])
        {
            submenu.push({ label: item[0], click() { _windows.zoom.webContents.send('menu', item[1]); } });
        }
        else
        {
            submenu.push({ label: item[0], click: item[2] });
        }
    }
}

function view(label, items)
{
    const submenu = [];
    _template.push({ label, submenu });
    for (let item of items)
    {
        submenu.push({ label: item[0], type: 'checkbox', checked: true, click: (menuItem) => menuItem.checked ? _windows[item[1]].show() : _windows[item[1]].hide() });
    }
}

function init(windows)
{
    _template = [];
    const state = new State();
    _windows = windows;
    const list = [
        ['&New (Ctrl-N)', 'new'],
        ['&Save... (Ctrl-S)', 'save'],
        ['&Open... (Ctrl-O)', 'open'],
        ['separator']];
    for (let i = 1; i < state.lastFiles.length; i++)
    {
        list.push(['&' + i + '. ' + path.basename(state.lastFiles[i], '.json') + ' (Ctrl+' + i + ')', 'open***' + state.lastFiles[i]]);
    }
    if (state.lastFiles.length)
    {
        list.push(['separator']);
    }
    list.push(
        ['E&xit (Ctrl-Q)', null, () => app.quit()]
    );
    append('&File', list);
    append('&Edit', [
        ['&Copy (Ctrl-C', 'copy'],
        ['C&ut (Ctrl-X)', 'cut'],
        ['&Paste (Ctrl-V)', 'paste'],
    ]);
    append('&Tools', [
        ['&Paint (B)', 'paint'],
        ['&Select (V)', 'select'],
        ['&Circle (C)', 'circle'],
        ['&Ellipse (E)', 'ellipse'],
        ['&Line (L)', 'line'],
        ['&Fill (F)', 'fill']
    ]);
    view('&View', [
        ['&Animation', 'animation'],
        ['Coor&dinates', 'coords'],
        ['&Palette', 'palette'],
        ['&Color Picker', 'picker'],
        ['&Frame Selector', 'show'],
        ['&Tools', 'tools'],
        ['&Editor', 'zoom'],
    ]);
    append('F&rame', [
        ['&Duplicate (Ctrl-D)', 'duplicate'],
        ['D&elete', 'delete'],
        ['&New Frame', 'frame']
    ]);
    Menu.setApplicationMenu(Menu.buildFromTemplate(_template));
    for (let key in _windows)
    {
        windows[key].setMenu(null);
    }
}

module.exports = init;