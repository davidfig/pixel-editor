const Settings = require('../settings')

const PORT = 3333

function saveFileDialog(path, callback) {
    console.log('not implemented')
}

function exportFileDialog(path, callback) {
    console.log('not implemented')
}

function openFileDialog(path, callback) {
    console.log('not implemented')
}

function openDirDialog(callback) {
}

function writeFile() {
}

function readDir(dir, callback) {
}

function fileDate(file) {
    return 0
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