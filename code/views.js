import { state } from './state'
import { BORDER } from './settings'
import { main } from './'
import * as menu from './menu'

export function init()
{
    if (state.views.length === 0)
    {
        state.views.push(
            positionDefault(),
            positionDefault(true)
        )
        state.view = 0
        state.save()
    }
}

export function apply()
{
    main.wm.load(state.views[state.view])
}

export function update()
{
    state.views[state.view] = main.wm.save()
    state.save()
}

export function resetWindows()
{
    state.views[state.view] = positionDefault()
    state.save()
    main.wm.load(state.views[state.view])
}

function positionDefault(closed)
{
    const top = 0
    const space = BORDER
    return {
        frames: { x: 0, y: window.innerHeight - space - 200, width: 200, height: 200, closed, order: 0 },
        toolbar: { x: 0, y: top + space, closed, order: 1 },
        palette: { x: window.innerWidth - space - 200, y: top + space * 2 + 300, width: 200, height: 150, closed, order: 2 },
        picker: { x: window.innerWidth - space - 200, y: top + space, width: 200, height: 300, closed, order: 3 },
        info: { x: window.innerWidth - space - 200, y: window.innerHeight - space - 205, closed, order: 4 },
        animation: { x: window.innerWidth - space * 2 - 235 - 200, y: top + space, width: 230, height: 226, closed: true, order: 5 },
        position: { x: window.innerWidth - space - 200, y: window.innerHeight - space * 2 - 205 - 60, order: 6, closed },
        manager: { x: space * 2 + 45, y: top + space, width: 194, height: 250, closed: true, order: 7 },
        keyboard: { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200, width: 600, height: 400, closed: true, order: 8 },
        outline: { x: 0, y: 0, closed: true, order: 9 },
    }
}

export function getClosed(name)
{
    const view = state.views[state.view][name]
    if (view) {
        return view.closed
    } else {
        return false
    }
}

export function toggleClosed(name)
{
    state.views[state.view][name].closed = !state.views[state.view][name].closed
    main.toggleHidden(name)
    state.save()
}

export function change(delta)
{
    state.view += delta
    state.view = state.view < 0 ? state.views.length - 1 : state.view
    state.view = state.view >= state.views.length ? 0 : state.view
    main.wm.load(state.views[state.view])
    menu.toggleAll()
    main.windows.palette.resize()
}