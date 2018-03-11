const Misc = require('./config/misc')
const Accelerator = require('./config/localAccelerator')

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

    // movement arrows
    Accelerator.register('arrowright', () => Main.windows.draw.moveCursor(1, 0))
    Accelerator.register('arrowleft', () => Main.windows.draw.moveCursor(-1, 0))
    Accelerator.register('arrowdown', () => Main.windows.draw.moveCursor(0, 1))
    Accelerator.register('arrowup', () => Main.windows.draw.moveCursor(0, -1))
}

module.exports = {
    setup
}