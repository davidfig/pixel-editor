const Misc = require('./config/misc')
const Accelerator = require('./config/localAccelerator')

const State = require('./state')

let Main

function setup(main)
{
    Main = main

    // debug keys
    Accelerator.register('ctrl+shift+i', () => Misc.toggleDevTools())
    Accelerator.register('ctrl+r', (e) =>
    {
        e.preventDefault()
        window.location.reload()
    })

    // ctrl 1 - 9 for last files
    for (let i = 1; i < 9; i++)
    {
        Accelerator.register('ctrl+' + i, () =>
        {
            if (i < State.lastFiles.length)
            {
                Main.load([State.lastFiles[i]])
            }
        })
    }

    // movement arrows
    Accelerator.register('arrowright', () => Main.windows.draw.moveCursor(1, 0))
    Accelerator.register('arrowleft', () => Main.windows.draw.moveCursor(-1, 0))
    Accelerator.register('arrowdown', () => Main.windows.draw.moveCursor(0, 1))
    Accelerator.register('arrowup', () => Main.windows.draw.moveCursor(0, -1))

    Accelerator.register('space', () => Main.windows.draw.pressSpace())

    // Accelerator.register(State.keys.ColorDropper)
}

module.exports = {
    setup
}