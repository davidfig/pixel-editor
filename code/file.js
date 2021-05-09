import * as localFiles from 'local-files'

export async function readState() {
    return await localFiles.loadJson('state.json')
}

export async function writeState(data) {
    await localFiles.saveJson('state.json', data)
}

export async function getTempFilename() {
    const filenames = await localFiles.dir()
    let last = -1
    for (const filename of filenames) {
        if (filename.includes('pixel-')) {
            const n = parseInt(filename.split('-')[1])
            last = n > last ? n : last
        }
    }
    return `pixel-${last + 1}.json`
}

export async function readJSON(filename) {
    return await localFiles.loadJson(filename)
}

export async function writeJSON(filename, json) {
    await localFiles.saveJson(filename, json)
}

export async function unlink(filename) {
    await localFiles.unlink(filename)
}

export async function dir() {
    return await localFiles.dir()
}

export async function rename(oldFilename, newFilename) {
    return await localFiles.rename(oldFilename, newFilename)
}

export async function exists(filename) {
    return await localFiles.exists(filename)
}

export async function date(filename) {
    const stats = await localFiles.stat(filename)
    if (stats) {
        return stats.mTimeMs
    }
    else {
        return 0
    }
}