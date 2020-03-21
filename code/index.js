const electron = require('electron')
const app = electron.app
const url = require('url')
const path = require('path')

const State = require('./state')
const Settings = require('./settings')

let _main

const BACKGROUND = '#000000'

async function init()
{
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
    await State.load()
    const main = State.main
    if (main)
    {
        _main = new electron.BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            icon: path.join(__dirname, 'assets', 'icon.png'),
            title: 'Pixel Editor',
            backgroundColor: BACKGROUND,
            width: Math.round(main.width),
            height: Math.round(main.height),
            x: Math.round(main.x),
            y: Math.round(main.y)
        })
        if (main.maximize)
        {
            _main.maximize()
        }
    }
    else
    {
        _main = new electron.BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            icon: path.join(__dirname, 'assets', 'icon.png'),
            title: 'Pixel Editor',
            backgroundColor: BACKGROUND
        })
        _main.maximize()
    }
    _main.setMenu(null)
    _main.loadURL(url.format({ pathname: path.join(__dirname, '..', 'html', 'electron.html'), protocol: 'file:', slashes: true }))
    if (Settings.DEBUG)
    {
        _main.toggleDevTools()
    }
    State.setupMain(_main)
}

app.on('ready', init)
app.on('activate',
    function ()
    {
        if (_main === null)
        {
            init()
        }
    }
)
app.on('window-all-closed', () => app.quit())