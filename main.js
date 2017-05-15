const electron = require('electron');
const path = require('path');
const url = require('url');
const jsonfile = require('jsonfile');

const BrowserWindow = electron.BrowserWindow;
const Pixel = require('./pixel');
const Colors = require('./colors');

let _mainWindow, _paletteWindow, _zoomWindow, _data, _state;

const app = electron.app;

const filename = path.join(app.getPath('userData'), 'window-state.json');

function load()
{
    try
    {
        _state = jsonfile.readFileSync(filename);
    } catch (err)
    {
        _state = {};
    }
    createWindow();
}

function save()
{
    jsonfile.writeFileSync(filename, _state);
}

function updateState(window)
{
    const state = _state[window.stateID];
    if (state)
    {
        if (state.width)
        {
            window.setSize(state.width, state.height);
        }
        if (state.x)
        {
            window.setPosition(state.x, state.y);
        }
    }
    window.on('move',
        function (object)
        {
            const window = object.sender;
            const position = window.getPosition();
            let state = _state[window.stateID];
            if (!state)
            {
                state = _state[window.stateID] = {};
            }
            state.x = position[0];
            state.y = position[1];
            save();
        });
    window.on('resize',
        function (object)
        {
            const window = object.sender;
            const size = window.getSize();
            let state = _state[window.stateID];
            if (!state)
            {
                state = _state[window.stateID] = {};
            }
            state.width = size[0];
            state.height = size[1];
        });
}

function createWindow()
{
    _mainWindow = new BrowserWindow({ fullscreen: true, backgroundColor: '#aaaaaa' });
    _mainWindow.stateID = 'main';
    updateState(_mainWindow);

    _mainWindow.on('closed', () => _mainWindow = null);

    _data = {};
    _data.pixel = new Pixel(15, 15);
    Colors.init(_data.pixel);
    _data.colors = Colors;

    _zoomWindow = new BrowserWindow({ x: 0, y: 0, title: 'Zoomed', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden'});
    _zoomWindow.stateID = 'zoom';
    _zoomWindow.pixel = _data;
    _zoomWindow.loadURL(url.format({ pathname: path.join(__dirname, 'zoom.html'), protocol: 'file:', slashes: true }));
    _zoomWindow.setMenu(null);
    updateState(_zoomWindow);

    _paletteWindow = new BrowserWindow({ title: 'Palette', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden'});
    _paletteWindow.pixel = _data;
    _paletteWindow.loadURL(url.format({ pathname: path.join(__dirname, 'palette.html'), protocol: 'file:', slashes: true }));
    _paletteWindow.setMenu(null);
    updateState(_paletteWindow);
    // _paletteWindow.toggleDevTools();
}

app.on('ready', load);

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
            load();
        }
    }
);