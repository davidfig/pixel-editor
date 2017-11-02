const path = require('path')
const remote = require('electron').remote

const PixelEditor = require('./pixel-editor')
const State = require('./state')

function save(filename)
{
    State.lastPath = path.dirname(filename)
    if (path.extname(filename) !== '.json')
    {
        filename += '.json'
    }
    State.lastFile = filename
    State.save()
    PixelEditor.save(filename)
}

function load(list)
{
    if (list && list.length)
    {
        const filename = list[0]
        PixelEditor = PixelEditor.load(filename)
        State.lastFile = filename
        State.current = 0
    }
}

function newFile()
{
    PixelEditor = new PixelEditor()
    State.lastFile = PixelEditor.filename
    State.current = 0
}

function saveFile()
{
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Save PIXEL file', defaultPath: State.lastPath }, save)
}

function openFile()
{
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), { title: 'Load PIXEL file', defaultPath: State.lastPath, filters: [{ name: 'JSON', extensions: ['json'] }] }, load)
}


module.exports = {
    newFile,
    saveFile,
    openFile
}