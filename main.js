const electron = require('electron');

const path = require('path');
const url = require('url');
const jsonfile = require('jsonfile');

const BrowserWindow = electron.BrowserWindow;
const Pixel = require('./pixel');
const Colors = require('./colors');

let _mainWindow, _paletteWindow, _zoomWindow, _showWindow, _data, _state;

const app = electron.app;

const BACKGROUND = '#aaaaaa';

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
        if (state.maximize)
        {
            window.maximize();
        }
    }
    else
    {
        _state[window.stateID] = {};
    }
    window.on('maximize',
        function (object)
        {
            _state[object.sender.stateID].maximize = true;
            save();
        });
    window.on('unmaximize',
        function (object)
        {
            _state[object.sender.stateID].maximize = false;
            save();
        });
    window.on('move',
        function (object)
        {
            const window = object.sender;
            const position = window.getPosition();
            const state = _state[window.stateID];
            state.x = position[0];
            state.y = position[1];
            save();
        });
    window.on('resize',
        function (object)
        {
            const window = object.sender;
            const size = window.getSize();
            const state = _state[window.stateID];
            state.width = size[0];
            state.height = size[1];
            save();
        });
}

function createWindow()
{
    _mainWindow = new BrowserWindow({ backgroundColor: BACKGROUND });
    _mainWindow.stateID = 'main';
    updateState(_mainWindow);

    _mainWindow.on('closed', () => _mainWindow = null);

    _data = {};
    _data.pixel = new Pixel(15, 15);
    Colors.init(_data.pixel);
    _data.colors = Colors;

    _zoomWindow = new BrowserWindow({ backgroundColor: BACKGROUND, x: 0, y: 0, title: 'Zoomed', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden'});
    _zoomWindow.stateID = 'zoom';
    _zoomWindow.pixel = _data;
    _zoomWindow.loadURL(url.format({ pathname: path.join(__dirname, 'zoom.html'), protocol: 'file:', slashes: true }));
    _zoomWindow.setMenu(null);
    updateState(_zoomWindow);
    // _zoomWindow.toggleDevTools();

    _paletteWindow = new BrowserWindow({ backgroundColor: BACKGROUND, title: 'Palette', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden'});
    _paletteWindow.stateID = 'palette';
    updateState(_paletteWindow);
    _paletteWindow.pixel = _data;
    _paletteWindow.loadURL(url.format({ pathname: path.join(__dirname, 'palette.html'), protocol: 'file:', slashes: true }));
    _paletteWindow.setMenu(null);
    _paletteWindow.main = _zoomWindow;
    _paletteWindow.on('focus', () => _zoomWindow.focus());
    // _paletteWindow.toggleDevTools();

    _showWindow = new BrowserWindow({ backgroundColor: BACKGROUND, x: 0, y: 0, title: 'show', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _showWindow.stateID = 'show';
    _showWindow.pixel = _data;
    _showWindow.loadURL(url.format({ pathname: path.join(__dirname, 'show.html'), protocol: 'file:', slashes: true }));
    _showWindow.setMenu(null);
    updateState(_showWindow);
    // _showWindow.toggleDevTools();
    _zoomWindow.showWindow = _showWindow;

    _zoomWindow.focus();

    accelerators();
}

function accelerators()
{
    electron.globalShortcut.register('CommandOrControl+Q', () => app.quit());
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