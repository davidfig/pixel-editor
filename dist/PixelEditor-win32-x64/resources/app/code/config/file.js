const electron = require('electron')
const remote = electron.remote
const path = require('path')
const jsonfile = require('jsonfile')
const fs = require('fs')

function saveFileDialog(defaultPath, callback)
{
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Save PIXEL file', defaultPath }, callback)
}

function exportFileDialog(defaultPath, callback)
{
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
        title: 'Export PNG file',
        defaultPath,
        filters: [{ name: 'PNG', extensions: ['png'] }]
    }, callback)
}

function openFileDialog(defaultPath, callback)
{
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), { title: 'Load PIXEL file', defaultPath, filters: [{ name: 'JSON', extensions: ['json'] }] }, callback)
}

function openDirDialog(callback)
{
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), { properties: ['openDirectory'] }, callback)
}

function readState(callback)
{
    const app = electron.remote ? electron.remote.app : electron.app
    const filename = path.join(app.getPath('userData'), 'state.json')
    try
    {
        callback(jsonfile.readFileSync(filename))
    }
    catch (err)
    {
        callback()
    }
}

function writeState(data)
{
    const app = electron.remote ? electron.remote.app : electron.app
    const filename = path.join(app.getPath('userData'), 'state.json')
    jsonfile.writeFileSync(filename, data)
}

function getTempFilename(callback)
{
    let filename, i = 0
    do
    {
        i++
        filename = path.join(remote.app.getPath('temp'), 'pixel-' + i + '.json')
    }
    while (fs.existsSync(filename))
    callback(filename)
}

function writeJSON(filename, json)
{
    jsonfile.writeFileSync(filename, json)
}

function fileDate(filename)
{
    return fs.statSync(filename).mtimeMs
}

function readDir(dir, callback)
{
    callback(fs.readdirSync(dir))
}

module.exports = {
    openFileDialog,
    openDirDialog,
    saveFileDialog,
    readState,
    writeState,
    getTempFilename,
    writeJSON,
    exportFileDialog,
    writeFile: fs.writeFileSync,
    readDir,
    fileDate
}