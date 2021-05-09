import { localFilesServer } from 'local-files'
import { bundler } from './bundler.js'

const PORT = 9010

async function fileServer() {
    const args = process.argv.slice(2)
    if (!args[0]) {
        console.warn('Usage: node launcher <dir> <--log> <--error>')
    }
    else {
        const options = {
            directory: args[0]
        }
        if (!args.includes('--log')) {
            options.log = false
        }
        if (!args.includes('--error')) {
            options.error = false
        }
        await localFilesServer(options)
    }
}

async function webServer() {
    await bundler(PORT, true)
}

async function start() {
    await fileServer()
    await webServer()
}

start()