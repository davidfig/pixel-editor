const electron = require('electron')
const path = require('path')
const jsonfile = require('jsonfile')
const Events = require('eventemitter3')

const TIME_BETWEEN_SAVES = 250

class State extends Events
{
    constructor()
    {
        super()
        const app = electron.remote ? electron.remote.app : electron.app
        this.filename = path.join(app.getPath('userData'), 'state.json')
        try
        {
            this.state = jsonfile.readFileSync(this.filename)
            if (typeof this.state.foreground !== 'string')
            {
                this.state.foreground = 'ffffffff'
            }
            if (typeof this.state.background !== 'string')
            {
                this.state.background = '00000000'
            }
        }
        catch (err)
        {
            this.state = { tool: 'paint', cursorX: 0, cursorY: 0, cursorSizeX: 1, cursorSizeY: 1, foreground: 0, isForeground: 0, background: null, lastFiles: [], windows: {} }
        }
        this.state.lastFiles = this.state.lastFiles || []
        this.state.windows = this.state.windows || {}
        this.state.relative = this.state.relative || 'top-left'
        this.time = 0
        this.last = 0
    }

    position(wm)
    {
        if (this.state.windows)
        {
            wm.load(this.state.windows)
        }
        this.wm = wm
        window.setInterval(() => this.update(), TIME_BETWEEN_SAVES)
    }

    mainResize(object)
    {
        const main = this.state.main
        if (!main.maximize)
        {
            const size = object.sender.getContentSize()
            main.width = size[0]
            main.height = size[1]
            this.save()
        }
    }

    mainMove(object)
    {
        const main = this.state.main
        const window = object.sender
        const position = window.getPosition()
        main.x = position[0]
        main.y = position[1]
        this.save()
    }

    setupMain(window)
    {
        let main = this.state.main
        if (!main)
        {
            main = this.state.main = {}
        }
        window.on('maximize', () => { main.maximize = true; this.save() })
        window.on('unmaximize', () => { main.maximize = false; this.save() })
        window.on('resize', this.mainResize.bind(this))
        window.on('move', this.mainMove.bind(this))
    }

    set()
    {
        this.state.windows = this.wm.save()
        this.save()
    }

    get(name)
    {
        return this.state.windows[name]
    }

    setHidden(name, hidden)
    {
        this.state.windows[name].hidden = hidden
        this.save()
    }

    getHidden(name)
    {
        return false//this.state.windows[name].hidden
    }

    toggleHidden(name)
    {
        this.state.windows[name].hidden = !this.state.windows[name].hidden
        this.save()
    }

    get windows()
    {
        return this.state.windows
    }
    set windows(value)
    {
        this.state.window = value
        this.save()
    }

    get isForeground()
    {
        return this.state.isForeground
    }
    set isForeground(value)
    {
        if (this.state.isForeground !== value)
        {
            this.state.isForeground = value
            this.save()
            this.emit('isForeground')
        }
    }

    get openCircle()
    {
        return this.state.openCircle
    }
    set openCircle(value)
    {
        if (this.state.openCircle !== value)
        {
            this.state.openCircle = value
            this.save()
            this.emit('open-circle')
        }
    }
    get openEllipse()
    {
        return this.state.openEllipse
    }
    set openEllipse(value)
    {
        if (this.state.openEllipse !== value)
        {
            this.state.openEllipse = value
            this.save()
            this.emit('open-ellipse')
        }
    }

    get cursorX()
    {
        return this.state.cursorX
    }
    set cursorX(value)
    {
        if (this.state.cursorX !== value)
        {
            this.state.cursorX = value
            this.save()
            this.emit('cursorX')
        }
    }

    get cursorY()
    {
        return this.state.cursorY
    }
    set cursorY(value)
    {
        if (this.state.cursorY !== value)
        {
            this.state.cursorY = value
            this.save()
            this.emit('cursorY')
        }
    }

    get cursorSizeX()
    {
        return this.state.cursorSizeX
    }
    set cursorSizeX(value)
    {
        if (this.state.cursorSizeX !== value)
        {
            this.state.cursorSizeX = value
            this.save()
            this.emit('cursorSizeX')
        }
    }

    get cursorSizeY()
    {
        return this.state.cursorSizeY
    }
    set cursorSizeY(value)
    {
        if (this.state.cursorSizeY !== value)
        {
            this.state.cursorSizeY = value
            this.save()
            this.emit('cursorSizeY')
        }
    }

    get color()
    {
        return this.isForeground ? this.foreground : this.background
    }
    set color(value)
    {
        if (this.isForeground)
        {
            if (this.foreground !== value)
            {
                this.foreground = value
                this.save()
                this.emit('foreground')
            }
        }
        else
        {
            if (this.background !== value)
            {
                this.background = value
                this.save()
                this.emit('background')
            }
        }
    }

    get foreground()
    {
        return this.state.foreground
    }
    set foreground(value)
    {
        this.state.foreground = value
        this.save()
        this.emit('foreground')
    }

    get background()
    {
        return this.state.background
    }
    set background(value)
    {
        this.state.background = value
        this.save()
        this.emit('background')
    }

    get tool()
    {
        return this.state.tool
    }
    set tool(value)
    {
        this.state.tool = value
        this.save()
        this.emit('tool')
    }

    get relative()
    {
        return this.state.relative
    }
    set relative(value)
    {
        this.state.relative = value
        this.save()
        this.emit('relative')
    }

    save()
    {
        this.dirty = true
    }

    get lastFile()
    {
        return this.state.lastFile
    }
    set lastFile(value)
    {
        if (this.state.lastFile !== value)
        {
            this.state.lastFile = value
            const index = this.state.lastFiles.indexOf(value)
            if (index !== -1)
            {
                this.state.lastFiles.splice(index, 1)
            }
            this.state.lastFiles.unshift(value)
            while (this.state.lastFiles.length > 11)
            {
                this.state.lastFiles.pop()
            }
            this.save()
            this.emit('last-file')
        }
    }

    get lastFiles()
    {
        return this.state.lastFiles
    }
    set lastFiles(value)
    {
        this.state.lastFiles = value
    }

    update()
    {
        const now = performance.now()
        const elapsed = now - this.last
        this.last = now
        this.time += elapsed
        if (this.dirty && this.time > TIME_BETWEEN_SAVES)
        {
            jsonfile.writeFileSync(this.filename, this.state)
            this.time = 0
            this.dirty = false
        }
    }
}

module.exports = new State()