const electron = require('electron');

const path = require('path');
const url = require('url');
const jsonfile = require('jsonfile');

const BrowserWindow = electron.BrowserWindow;
const Pixel = require('./data/pixel');
const Colors = require('./data/colors');
const Layers = require('./data/layers');

let _mainWindow, _paletteWindow, _zoomWindow, _showWindow, _coordsWindow, _toolsWindow,_data, _state;

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

function updateState(window, noResize)
{
    if (noResize)
    {
        window.setResizable(false);
    }
    const state = _state[window.stateID];
    if (state)
    {
        if (!noResize && state.width)
        {
            window.setSize(state.width, state.height);
        }
        if (state.x)
        {
            window.setPosition(state.x, state.y);
        }
        if (!noResize && state.maximize)
        {
            window.maximize();
        }
    }
    else
    {
        _state[window.stateID] = {};
    }
    if (!noResize)
    {
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
    window.on('focus',
        function (object)
        {
            if (object.sender !== _zoomWindow)
            {
                _zoomWindow.focus();
            }
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
    _data.tool = 'paint';

    _paletteWindow = new BrowserWindow({ backgroundColor: BACKGROUND, title: 'Palette', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden'});
    _paletteWindow.stateID = 'palette';
    updateState(_paletteWindow);
    _paletteWindow.pixel = _data;
    _paletteWindow.loadURL(url.format({ pathname: path.join(__dirname, 'palette.html'), protocol: 'file:', slashes: true }));
    _paletteWindow.setMenu(null);
    _paletteWindow.main = _zoomWindow;
    // _paletteWindow.toggleDevTools();

    _showWindow = new BrowserWindow({ frame: false, backgroundColor: BACKGROUND, x: 0, y: 0, title: 'show', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _showWindow.stateID = 'show';
    _showWindow.pixel = _data;
    _showWindow.loadURL(url.format({ pathname: path.join(__dirname, 'show.html'), protocol: 'file:', slashes: true }));
    _showWindow.setMenu(null);
    updateState(_showWindow, true);
    // _showWindow.toggleDevTools();

    _coordsWindow = new BrowserWindow({ frame: false, parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _coordsWindow.stateID = 'coords';
    _coordsWindow.pixel = _data;
    _coordsWindow.loadURL(url.format({ pathname: path.join(__dirname, 'coords.html'), protocol: 'file:', slashes: true }));
    _coordsWindow.setMenu(null);
    updateState(_coordsWindow, true);
    // _coordsWindow.toggleDevTools();

    _toolsWindow = new BrowserWindow({ frame: false, title: 'tools', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _toolsWindow.stateID = 'tools';
    _toolsWindow.pixel = _data;
    _toolsWindow.loadURL(url.format({ pathname: path.join(__dirname, 'tools.html'), protocol: 'file:', slashes: true }));
    _toolsWindow.setMenu(null);
    updateState(_toolsWindow, true);
    // _toolsWindow.toggleDevTools();

    _zoomWindow = new BrowserWindow({ backgroundColor: BACKGROUND, title: 'Zoomed', parent: _mainWindow, maximizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true, titleBarStyle: 'hidden' });
    _zoomWindow.stateID = 'zoom';
    _zoomWindow.pixel = _data;
    _zoomWindow.loadURL(url.format({ pathname: path.join(__dirname, 'zoom.html'), protocol: 'file:', slashes: true }));
    _zoomWindow.setMenu(null);
    updateState(_zoomWindow);
    _zoomWindow.coordsWindow = _coordsWindow;
    _zoomWindow.showWindow = _showWindow;
    // _zoomWindow.toggleDevTools();

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