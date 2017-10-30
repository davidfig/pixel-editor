const remote = require('electron').remote
const Input = require('./input')

function init()
{
    Input.init(null, { keyDown })
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special)
}

init()