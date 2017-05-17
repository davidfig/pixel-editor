const electron = require('electron');

const path = require('path');
const url = require('url');
const fs = require('fs');

const BrowserWindow = electron.BrowserWindow;
const Pixel = require('./data/pixel');
const Colors = require('./data/colors');
const Layers = require('./data/layers');
const State = require('./data/state');

let _mainWindow, _paletteWindow, _zoomWindow, _showWindow, _coordsWindow, _toolsWindow, _state, _data;

const app = electron.app;

const BACKGROUND = '#aaaaaa';

function init()
{
    _state = new State();
    _data = {};
    if (_state.lastFile)
    {
        _data.pixel = new Pixel(_state.lastFile);
    }
    else
    {
        _data.pixel = new Pixel(10, 10);
        let i = 0, filename;
        do
        {
            i++;
            filename = path.join(app.getPath('documents'), 'pixel-' + i + '.json');
        }
        while (fs.existsSync(filename));
        _data.pixel.save(filename);
        _state.lastFile = filename;
    }
    Colors.init(_data.pixel);
    _data.colors = Colors;
    _data.tool = 'paint';
    createWindow();
}

function createWindow()
{
    _mainWindow = new BrowserWindow({ show: false, backgroundColor: BACKGROUND });
    _mainWindow.stateID = 'main';
    _mainWindow.setMenu(null);
    _state.addWindow(_mainWindow);
    // _mainWindow.toggleDevTools();

    _paletteWindow = new BrowserWindow({ show: false, focusable: false, backgroundColor: BACKGROUND, title: 'Palette', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden'});
    _paletteWindow.stateID = 'palette';
    _state.addWindow(_paletteWindow);
    _paletteWindow.pixel = _data;
    _paletteWindow.loadURL(url.format({ pathname: path.join(__dirname, 'palette.html'), protocol: 'file:', slashes: true }));
    _paletteWindow.setMenu(null);
    _paletteWindow.main = _zoomWindow;
    // _paletteWindow.toggleDevTools();

    _showWindow = new BrowserWindow({ show: false, focusable: false, frame: false, backgroundColor: BACKGROUND, x: 0, y: 0, title: 'show', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _showWindow.stateID = 'show';
    _showWindow.pixel = _data;
    _showWindow.loadURL(url.format({ pathname: path.join(__dirname, 'show.html'), protocol: 'file:', slashes: true }));
    _showWindow.setMenu(null);
    _state.addWindow(_showWindow, true);
    // _showWindow.toggleDevTools();

    _coordsWindow = new BrowserWindow({ show: false, focusable: false, frame: false, parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _coordsWindow.stateID = 'coords';
    _coordsWindow.pixel = _data;
    _coordsWindow.state = _state;
    _coordsWindow.loadURL(url.format({ pathname: path.join(__dirname, 'coords.html'), protocol: 'file:', slashes: true }));
    _coordsWindow.setMenu(null);
    _state.addWindow(_coordsWindow, true);
    // _coordsWindow.toggleDevTools();

    _toolsWindow = new BrowserWindow({ show: false, focusable: false, frame: false, title: 'tools', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _toolsWindow.stateID = 'tools';
    _toolsWindow.pixel = _data;
    _toolsWindow.loadURL(url.format({ pathname: path.join(__dirname, 'tools.html'), protocol: 'file:', slashes: true }));
    _toolsWindow.setMenu(null);
    _state.addWindow(_toolsWindow, true);
    // _toolsWindow.toggleDevTools();

    _zoomWindow = new BrowserWindow({ show: false, backgroundColor: BACKGROUND, title: 'Zoomed', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _zoomWindow.stateID = 'zoom';
    _zoomWindow.pixel = _data;
    _zoomWindow.state = _state;
    _zoomWindow.loadURL(url.format({ pathname: path.join(__dirname, 'zoom.html'), protocol: 'file:', slashes: true }));
    _zoomWindow.setMenu(null);
    _state.addWindow(_zoomWindow);
    _zoomWindow.coordsWindow = _coordsWindow;
    _zoomWindow.showWindow = _showWindow;
    _zoomWindow.paletteWindow = _paletteWindow;
    _zoomWindow.setTitle(path.basename(_state.lastFile, '.json'));

    // _zoomWindow.toggleDevTools();

    _zoomWindow.focus();

    accelerators();
}

function accelerators()
{
    electron.globalShortcut.register('CommandOrControl+Q', () => app.quit());
}

app.on('ready', init);

app.on('window-all-closed',
    function ()
    {
        if (process.platform !== 'darwin')
        {
            app.quit();
        }
    }
);

app.on('activate',
    function ()
    {
        if (_mainWindow === null)
        {
            init();
        }
    }
);