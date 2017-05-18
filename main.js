const electron = require('electron');

const path = require('path');
const url = require('url');
const fs = require('fs');

const BrowserWindow = electron.BrowserWindow;
const Pixel = require('./data/pixel');
const Colors = require('./data/colors');
const State = require('./data/state');

let _windows, _mainWindow, _state, _data;

const app = electron.app;

const BACKGROUND = '#aaaaaa';
const WINDOW_BACKGROUND = '#bbbbbb';

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

function create(name, options)
{
    options = options || {};
    const window = new BrowserWindow({ skipTaskbar: true, frame: options.frame ? true : false, show: false, backgroundColor: WINDOW_BACKGROUND, parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true });
    window.stateID = name;
    _state.addWindow(window, options.noResize, options.square);
    window.pixel = _data;
    window.state = _state;
    window.loadURL(url.format({ pathname: path.join(__dirname, name + '.html'), protocol: 'file:', slashes: true }));
    window.setMenu(null);
    window.windows = _windows;
    _windows[name] = window;
    if (options.dev)
    {
        window.toggleDevTools();
    }
    return window;
}

function createWindow()
{
    _windows = {};
    _mainWindow = new BrowserWindow({ show: false, backgroundColor: BACKGROUND });
    _mainWindow.stateID = 'main';
    _mainWindow.loadURL(url.format({ pathname: path.join(__dirname, 'main-window.html'), protocol: 'file:', slashes: true }));
    _mainWindow.setMenu(null);
    _windows.mainWindow = _mainWindow;
    _mainWindow.windows = _windows;
    _state.addWindow(_mainWindow);

    create('palette');
    create('show', { noResize: true });
    create('coords', { noResize: true });
    create('tools', { noResize: true });
    create('picker');
    create('zoom', { square: true, frame: true, dev: true });

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