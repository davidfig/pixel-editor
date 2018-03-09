const localforage = require('localforage')

const Settings = require('../settings')

const STATE_FILENAME = 'state-save'

localforage.config({
    name: Settings.NAME
})

function saveFileDialog(path, callback)
{
    // remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Save PIXEL file', defaultPath: State.lastPath }, callback)
    console.log('todo: save file')
}

function exportFileDialog(path, callback)
{

}

function openFileDialog(path, callback)
{
    // remote.dialog.showOpenDialog(remote.getCurrentWindow(), { title: 'Load PIXEL file', defaultPath: State.lastPath, filters: [{ name: 'JSON', extensions: ['json'] }] }, callback)
    console.log('todo: load file')
}

function openDirDialog(callback)
{

}

function readState(callback)
{
    localforage.getItem(STATE_FILENAME)
        .then((value) => callback(JSON.parse(value)))
        .catch(() => callback())
}

function writeState(data)
{
    localforage.setItem(STATE_FILENAME, JSON.stringify(data))
}

function getTempFilename(callback)
{
    localforage.keys()
        .then((keys) =>
        {
            function search(filename)
            {
                for (let key of keys)
                {
                    if (key === filename)
                    {
                        return true
                    }
                }
                return false
            }

            let filename, i = 0
            do
            {
                i++
                filename = 'pixel-' + i + '.json'
            }
            while (search(filename))
            callback(filename)
        }).catch((err) =>
        {
            console.error(err)
        })
}

function readJSON(filename, callback)
{
    localforage.getItem(filename)
        .then((value) => callback(JSON.parse(value)))
        .catch(() => callback())
}

function writeJSON(filename, data)
{
    localforage.setItem(filename, JSON.stringify(data))
}

function writeFile()
{
}

function readDir()
{
}

function fileDate(file)
{
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
    writeFile,
    readDir,
    fileDate
}