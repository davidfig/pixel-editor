const open = require('open')
const localFiles = require('local-files')
const bundler = require('./bundler')

const PORT = 9010

async function fileServer()
{
    const args = process.argv.slice(2)
    if (!args[0])
    {
        console.warn('Usage: node launcher <dir> <--log> <--error>')
    }
    else
    {
        await localFiles({ directory: args[0], log: args.includes('--log'), error: args.includes('--error') })
    }
}

async function webServer()
{
    await bundler(PORT, true)
}

async function show()
{
    await open(`http://localhost:${PORT}`)
}

async function start()
{
    await fileServer()
    await webServer()
    await show()
}

start()