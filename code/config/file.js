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

function readState()
{
    return null
}

function getTempFilename()
{
    return 'temp.json'
}

function readJSON()
{
    return null
}

function writeJSON(filename, json)
{
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
    getTempFilename,
    readJSON,
    writeJSON,
    exportFileDialog,
    writeFile,
    readDir,
    fileDate
}