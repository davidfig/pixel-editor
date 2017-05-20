const electron = require('electron');
const app = electron.app;
const console = require('console');
const url = require('url');
const path = require('path');

const WindowState = require('./data/window-state');

const DEBUG = false;
const DEV_ALL = false;

let _windows, _main, _state;

const BACKGROUND = '#aaaaaa';
const WINDOW_BACKGROUND = '#bbbbbb';

function init()
{
    _state = new WindowState();

    _windows = {};
    _main = new electron.BrowserWindow({ backgroundColor: BACKGROUND });
    _main.stateID = 'main';
    _main.loadURL(url.format({ pathname: path.join(__dirname, 'main-window.html'), protocol: 'file:', slashes: true }));
    _main.setMenu(null);
    _state.addWindow(_main);

    create('zoom', { frame: true });
    create('coords', { noResize: true });
    create('palette');
    create('show', { noResize: true });
    create('tools', { noResize: true });
    create('picker');
    create('animation', { noThrottling: true });

    accelerators();
    listeners();
}

function create(name, options)
{
    options = options || {};
    const window = new electron.BrowserWindow({ skipTaskbar: true, frame: options.frame ? true : false, show: DEBUG ? true : false, backgroundColor: WINDOW_BACKGROUND, parent: _main, maximizable: false, minimizable: false, closable: false, fullscreenable: false, acceptFirstMouse: true });
    window.stateID = name;
    _state.addWindow(window, (!DEV_ALL && options.noResize));
    window.loadURL(url.format({ pathname: path.join(__dirname, name + '.html'), protocol: 'file:', slashes: true }));
    window.setMenu(null);
    window.windows = _windows;
    _windows[name] = window;
    if (options.dev || DEV_ALL)
    {
        window.toggleDevTools();
    }
    if (options.noThrottling)
    {
        window.backgroundThrottling = false;
    }
    return window;
}

function accelerators()
{
    electron.globalShortcut.register('CommandOrControl+Q', () => app.quit());
}

function listeners()
{
    electron.ipcMain.on('state',
        function (event)
        {
            for (let key in _windows)
            {
                const window = _windows[key];
                if (!window.isDestroyed() && window.webContents !== event.sender)
                {
                    window.webContents.send('state');
                }
            }
        });

    electron.ipcMain.on('pixel',
        function (event)
        {
            for (let key in _windows)
            {
                const window = _windows[key];
                if (!window.isDestroyed() && window.webContents !== event.sender)
                {
                    window.webContents.send('pixel');
                }
            }
        });
}

app.console = new console.Console(process.stdout, process.stderr);

app.on('ready', init);
app.on('activate',
    function ()
    {
        if (_main === null)
        {
            init();
        }
    }
);