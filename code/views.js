const State = require('./state')
const Settings = require('./settings')

const Views = {

    init: function (wm)
    {
        Views.wm = wm
        if (!State.views)
        {
            State.views = [
                ['toolbar', 'info', 'palette', 'picker', 'frames', 'position'],
                []
            ]
            State.view = 0
        }
        if (!this.state.windows)
        {
            this.positionDefault()
        }
        wm.load(this.state.windows)
        this.wm = wm
    },

    update()
    {
    },

    resetWindows: function ()
    {
    },

    positionDefault: function()
    {
        const top = 20
        const space = Settings.BORDER
        this.state.windows = [
            { x: space, y: window.innerHeight - space - 200, width: 200, height: 200 }, // show
            { x: space, y: top + space }, // toolbar
            { x: window.innerWidth - space - 200, y: top + space * 2 + 300, width: 200, height: 150 }, // palette
            { x: window.innerWidth - space - 200, y: top + space, width: 200, height: 300 }, // picker
            { x: window.innerWidth - space - 200, y: window.innerHeight - space - 205 }, // info
            { x: window.innerWidth - space * 2 - 235 - 200, y: top + space, width: 230, height: 226 }, // animation (230, 226)
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