const State = require('./state')
const Settings = require('./settings')
const Menu = require('./menu')

const Views = {

    init: function (wm, main)
    {
        Views.wm = wm
        Views.main = main
        if (State.views.length === 0)
        {
            State.views.push(
                this.positionDefault(),
                this.positionDefault(true)
            )
            State.view = 0
            State.save()
        }
        Views.wm.load(State.views[State.view])
    },

    update()
    {
        State.views[State.view] = Views.wm.save()
        State.save()
    },

    resetWindows: function ()
    {
        State.views[State.view] = Views.positionDefault()
        State.save()
        Views.wm.load(State.views[State.view])
    },

    positionDefault: function(closed)
    {
        const top = 20
        const space = Settings.BORDER
        return [
            { x: space, y: window.innerHeight - space - 200, width: 200, height: 200, closed, order: 0 }, // show
            { x: space, y: top + space, closed, order: 1 }, // toolbar
            { x: window.innerWidth - space - 200, y: top + space * 2 + 300, width: 200, height: 150, closed, order: 2 }, // palette
            { x: window.innerWidth - space - 200, y: top + space, width: 200, height: 300, closed, order: 3 }, // picker
            { x: window.innerWidth - space - 200, y: window.innerHeight - space - 205, closed, order: 4 }, // info
            { x: window.innerWidth - space * 2 - 235 - 200, y: top + space, width: 230, height: 226, closed: true, order: 5 }, // animation (230, 226)
            { x: window.innerWidth - space - 200, y: window.innerHeight - space * 2 - 205 - 60, order: 6, closed }, // position (195, 60)
            { x: space * 2 + 45, y: top + space, width: 194, height: 250, closed: true, order: 7 },
            { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200, width: 600, height: 400, closed: true, order: 8 } // keys
        ]
    },

    getClosed(i)
    {
        return State.views[State.view][i].closed
    },

    toggleClosed(name, i)
    {
        State.views[State.view][i].closed = !State.views[State.view][i].closed
        Views.main.toggleHidden(name)
        State.save()
    },

    change(delta)
    {
        State.view += delta
        State.view = State.view < 0 ? State.views.length - 1 : State.view
        State.view = State.view >= State.views.length ? 0 : State.view
        Views.wm.load(State.views[State.view])
        Menu.toggleAll()
        Views.main.windows.palette.resize()
    }
}

module.exports = Views