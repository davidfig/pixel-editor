const electron = require('electron')
const app = electron.app
const url = require('url')
const path = require('path')

let _main

const BACKGROUND = '#aaaaaa'

function init()
{
    _main = new electron.BrowserWindow({ title: 'Pixel Editor', backgroundColor: BACKGROUND })
    _main.loadURL(url.format({ pathname: path.join(__dirname, 'html', 'main.html'), protocol: 'file:', slashes: true }))
    _main.toggleDevTools()
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