const State = require('./state')
const Settings = require('./settings')

const Views = {

    init: function (wm)
    {
        Views.wm = wm
        if (State.views.length === 0)
        {
            State.views.push(
                this.positionDefault(),
                this.positionDefault(true)
            )
            State.view = 0
        }
        Views.wm.load(State.views[State.view])
    },

    update()
    {
    },

    resetWindows: function ()
    {
    },

    positionDefault: function(closed)
    {
        const top = 20
        const space = Settings.BORDER
        closed = !closed
        return [
            { x: space, y: window.innerHeight - space - 200, width: 200, height: 200, closed }, // show
            { x: space, y: top + space, closed }, // toolbar
            { x: window.innerWidth - space - 200, y: top + space * 2 + 300, width: 200, height: 150, closed }, // palette
            { x: window.innerWidth - space - 200, y: top + space, width: 200, height: 300, closed }, // picker
            { x: window.innerWidth - space - 200, y: window.innerHeight - space - 205, closed }, // info
            { x: window.innerWidth - space * 2 - 235 - 200, y: top + space, width: 230, height: 226, closed: true }, // animation (230, 226)
            { x: window.innerWidth - space - 200, y: window.innerHeight - space * 2 - 205 - 60 }, // position (195, 60)
            { x: space * 2 + 45, y: top + space, width: 194, height: 250, closed: true }
        ]
    },

    change(delta)
    {
        State.view += delta
        State.view = State.view < 0 ? State.views.length - 1 : State.view
        State.view = State.view >= State.views.length ? 0 : State.view
    }
}

module.exports = Views