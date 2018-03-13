const Misc = require('./config/misc')
const Accelerator = require('./config/localAccelerator')

let Main

function setup(main)
{
    Main = main

    // debug keys
    if (Misc.isElectron)
    {
        Accelerator.register('ctrl+shift+i', () => Misc.toggleDevTools())
    }
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
    Accelerator.register('shift+arrowright', () => Main.windows.draw.moveCursorShift(1, 0))
    Accelerator.register('shift+arrowleft', () => Main.windows.draw.moveCursorShift(-1, 0))
    Accelerator.register('shift+arrowdown', () => Main.windows.draw.moveCursorShift(0, 1))
    Accelerator.register('shift+arrowup', () => Main.windows.draw.moveCursorShift(0, -1))

    // number colors
    for (let i = 1; i < 4; i++)
    {
        Accelerator.register(i, () => Main.windows.palette.switchStandardColor(i))
    }
    for (let i = 4; i < 10; i++)
    {
        Accelerator.register(i, () => Main.windows.palette.switchColor(i))
    }
    Accelerator.register(0, () => Main.windows.palette.switchColor(0))
}

module.exports = {
    setup
}