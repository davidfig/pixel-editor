const electron = require('electron')
const path = require('path')
const jsonfile = require('jsonfile')

class State
{
    constructor()
    {
        this.filename = path.join(electron.app.getPath('userData'), 'window-state.json')
        this.load()
    }

    load()
    {
        try
        {
            this.state = jsonfile.readFileSync(this.filename)
        }
        catch (err)
        {
            const size = electron.screen.getPrimaryDisplay().workAreaSize
            const list = jsonfile.readFileSync('default-window-state.json')
            this.state = {}
            for (let key in list)
            {
                const entry = list[key]
                this.state[key] = {
                    x: entry.x * size.width, y: entry.y * size.height,
                    width: entry.width * size.width, height: entry.height * size.height,
                    maximize: entry.maximize
                }
            }
        }
    }

    save()
    {
        jsonfile.writeFileSync(this.filename, this.state)
    }

    addWindow(window, noResize)
    {
        if (noResize)
        {
            window.setResizable(false)
        }
        let state = this.state[window.stateID]
        if (state)
        {
            if (!noResize && state.width)
            {
                window.setContentSize(Math.round(state.width), Math.round(state.height))
            }
            if (state.x)
            {
                window.setPosition(Math.round(state.x), Math.round(state.y))
            }
            if (!noResize && state.maximize)
            {
                window.maximize()
            }
        }
        else
        {
            state = this.state[window.stateID] = {}
        }
        const that = this
        if (!noResize)
        {
            window.on('maximize',
                function ()
                {
                    state.maximize = true
                    that.save()
                })
            window.on('unmaximize',
                function ()
                {
                    state.maximize = false
                    that.save()
                })

            window.on('resize',
                function (object)
                {
                    if (!object.sender.noResizeSave)
                    {
                        const size = object.sender.getContentSize()
                        state.width = size[0]
                        state.height = size[1]
                        that.save()
                    }
                })
        }
        window.on('move',
            function (object)
            {
                const window = object.sender
                const position = window.getPosition()
                state.x = position[0]
                state.y = position[1]
                that.save()
            })
    }

    createDefaults()
    {
        const list = {}
        const size = electron.screen.getPrimaryDisplay().workAreaSize
        for (let key in this.state)
        {
            const entry = this.state[key]
            list[key] = ({
                x: entry.x / size.width, y: entry.y / size.height,
                width: entry.width / size.width, height: entry.height / size.height,
                maximize: entry.maximize
            })
        }
        jsonfile.writeFileSync('default-window-state.json', list)
    }
}

module.exports = State