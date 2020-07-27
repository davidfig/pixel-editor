import { accelerator } from 'simple-window-manager'

export function setupKeys(main)
{
    accelerator.register('ctrl+r', (e) =>
    {
        e.preventDefault()
        window.location.reload()
    })

    // movement arrows
    accelerator.register('arrowright', () => main.windows.draw.moveCursor(1, 0))
    accelerator.register('arrowleft', () => main.windows.draw.moveCursor(-1, 0))
    accelerator.register('arrowdown', () => main.windows.draw.moveCursor(0, 1))
    accelerator.register('arrowup', () => main.windows.draw.moveCursor(0, -1))
    accelerator.register('shift+arrowright', () => main.windows.draw.moveCursorShift(1, 0))
    accelerator.register('shift+arrowleft', () => main.windows.draw.moveCursorShift(-1, 0))
    accelerator.register('shift+arrowdown', () => main.windows.draw.moveCursorShift(0, 1))
    accelerator.register('shift+arrowup', () => main.windows.draw.moveCursorShift(0, -1))

    // number colors
    for (let i = 1; i < 4; i++)
    {
        accelerator.register(i, () => main.windows.palette.switchStandardColor(i))
    }
    for (let i = 4; i < 10; i++)
    {
        accelerator.register(i, () => main.windows.palette.switchColor(i))
    }
    accelerator.register(0, () => main.windows.palette.switchColor(0))
}