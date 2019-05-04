const electron = require('electron')
const remote = electron.remote
const path = require('path')
const fs = require('fs-extra')

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

async function readState()
{
    const app = electron.remote ? electron.remote.app : electron.app
    const filename = path.join(app.getPath('userData'), 'state.json')
    try
    {
        return await fs.readJson(filename)
    }
    catch (err)
    {
        return null
    }
}

async function writeState(data)
{
    const app = electron.remote ? electron.remote.app : electron.app
    const filename = path.join(app.getPath('userData'), 'state.json')
    await fs.outputJson(filename, data, { overwrite: true })
}

async function getTempFilename()
{
    let filename, i = 0
    do
    {
        i++
        filename = path.join(remote.app.getPath('temp'), 'pixel-' + i + '.json')
    }
    while (await fs.exists(filename))
    return filename
}

async function readJSON(filename)
{
    return await fs.readJSON(filename)
}

async function writeJSON(filename, json)
{
    await fs.outputJson(filename, json, { overwrite: true })
}

async function fileDate(filename)
{
    return (await fs.stat(filename)).mtimeMs
}

async function readDir(dir)
{
    return await fs.readdir(dir)
}

module.exports = {
    openFileDialog,
    openDirDialog,
    saveFileDialog,
    readState,
    writeState,
    getTempFilename,
    readJSON,
    writeJSON,
    exportFileDialog,
    writeFile: fs.writeFileSync,
    readDir,
    fileDate
}