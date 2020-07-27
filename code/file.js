import * as localFiles from 'local-files/localFiles'

// async function saveFileDialog(defaultPath, callback)
// {
//     const results = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Save PIXEL file', defaultPath })
//     callback(results.filePaths)
// }

// async function exportFileDialog(defaultPath, callback)
// {
//     const results = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
//         title: 'Export PNG file',
//         defaultPath,
//         filters: [{ name: 'PNG', extensions: ['png'] }]
//     })
//     callback(results.filePaths)
// }

// async function openFileDialog(defaultPath, callback)
// {
//     const files = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), { title: 'Load PIXEL file', defaultPath, filters: [{ name: 'JSON', extensions: ['json'] }] })
//     callback(files.filePaths)
// }

// async function openDirDialog(callback)
// {
//     const dir = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), { properties: ['openDirectory'] })
//     callback(dir.filePaths)
// }

export async function readState()
{
    return await localFiles.loadJson('state.json')
}

export async function writeState(data)
{
    await localFiles.saveJson('state.json', data)
}

export async function getTempFilename()
{
    const filenames = await localFiles.dir()
    const temps = []
    for (const filename of filenames)
    {
        if (filename.includes('pixel-'))
        {
            temps.push(filename)
        }
    }
    if (temps.length)
    {
        temps.sort()
        const last = parseInt(temps[temps.length - 1].split('-')[1])
        return `pixel-${last + 1}.json`
    }
    else
    {
        return 'pixel-0.json'
    }
}

export async function readJSON(filename)
{
    return await localFiles.loadJson(filename)
}

export async function writeJSON(filename, json)
{
    await localFiles.saveJson(filename, json)
}

export async function dir()
{
    return await localFiles.dir()
}

export async function date(filename)
{
    const stats = await localFiles.stat(filename)
    if (stats)
    {
        return stats.mTimeMs
    }
    else
    {
        return 0
    }
}


// module.exports = {
//     openFileDialog,
//     openDirDialog,
//     saveFileDialog,
//     readState,
//     writeState,
//     getTempFilename,
//     readJSON,
//     writeJSON,
//     exportFileDialog,
//     writeFile: fs.writeFileSync,
//     readDir,
//     fileDate
// }