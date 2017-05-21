const Menu = require('electron').Menu;
const app = require('electron').app;

let _zoom, _template = [], _windows;

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
            submenu.push({ label: item[0], click() { _zoom.webContents.send('menu', item[1]); } });
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
    _windows = windows;
    _zoom = windows.zoom;
    append('&File', [
        ['&New (Ctrl-N)', 'new'],
        ['&Save... (Ctrl-S)', 'save'],
        ['&Open... (Ctrl-O)', 'open'],
        ['separator'],
        ['E&xit (Ctrl-Q)', null, () => app.quit()]
    ]);
    append('Edit', [
        ['Copy (Ctrl-C', 'copy'],
        ['Cut (Ctrl-X)', 'cut'],
        ['Paste (Ctrl-V)', 'paste'],
    ]);
    append('Tools', [
        ['Paint (B)', 'paint'],
        ['Select (V)', 'select'],
        ['Circle (C)', 'circle'],
        ['Ellipse (E)', 'ellipse'],
        ['Line (L)', 'line'],
        ['Fill (F)', 'fill']
    ]);
    view('View', [
        ['Animation', 'animation'],
        ['Coordinates', 'coords'],
        ['Palette', 'palette'],
        ['Color Picker', 'picker'],
        ['Frame Selector', 'show'],
        ['Tools', 'tools'],
        ['Editor', 'zoom'],
    ]);
    Menu.setApplicationMenu(Menu.buildFromTemplate(_template));
}

module.exports = init;