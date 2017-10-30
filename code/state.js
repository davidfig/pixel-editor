const electron = require('electron')
const path = require('path')
const jsonfile = require('jsonfile')

class State
{
    constructor()
    {
        const app = electron.remote ? electron.remote.app : electron.app
        this.filename = path.join(app.getPath('userData'), 'state.json')
        this.load()
        this.state.lastFiles = this.state.lastFiles || []
        this.state.windows = this.state.windows || {}
        this.state.cursorX = this.state.cursorY = 0
        this.state.cursorSizeX = this.state.cursorSizeY = 1
    }

    load()
    {
        try
        {
            this.state = jsonfile.readFileSync(this.filename)
        }
        catch (err)
        {
            this.state = { pixels: 5, tool: 'paint', cursorX: 0, cursorY: 0, cursorSizeX: 1, cursorSizeY: 1, color: 0, foreground: 0, isForeground: 0, background: null, lastFiles: [], windows: {} }
        }
    }

    set(name, x, y, width, height)
    {
        this.state.windows[name] = { x, y, width, height }
        this.save()
    }

    get(name)
    {
        return this.state.windows[name]
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
        }
    }

    get transparentColor()
    {
        return this.state.transparentColor
    }
    set transparentColor(value)
    {
        if (this.state.transparentColor !== value)
        {
            this.state.transparentColor = value
            this.save()
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
        }
    }

    get color()
    {
        return this.state.color
    }
    set color(value)
    {
        if (this.state.color !== value)
        {
            this.state.color = value
            this.save()
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
    }

    get background()
    {
        return this.state.background
    }
    set background(value)
    {
        this.state.background = value
        this.save()
    }

    get tool()
    {
        return this.state.tool
    }
    set tool(value)
    {
        this.state.tool = value
        this.save()
    }

    get pixels()
    {
        return this.state.pixels
    }
    set pixels(value)
    {
        value = parseInt(value)
        if (!isNaN(value) && value > 0 && value !== this.state.pixels)
        {
            this.state.pixels = value
            this.save()
        }
    }

    save()
    {
        jsonfile.writeFileSync(this.filename, this.state)
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
}

module.exports = State