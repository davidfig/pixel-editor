const remote = require('electron').remote
const fs = require('fs')
const jsonfile = require('jsonfile')
const path = require('path')
const Pixel = require('../../components/pixel').Pixel
const exists = require('exists')

const sheet = require('./pixel-sheet')

const DEFAULT = [15, 15]

class PixelEditor extends Pixel
{
    constructor(filename)
    {
        super()
        this.sheet = sheet
        this.create(filename)
    }

    create(filename)
    {
        if (!filename)
        {
            this.frames = [{ width: DEFAULT[0], height: DEFAULT[1], data: [] }]
            this.animations = {'idle': [[0,0]]}
            for (let i = 0; i < DEFAULT[0] * DEFAULT[1]; i++)
            {
                this.frames[0].data[i] = null
            }
            let i = 0
            do
            {
                i++
                filename = path.join(remote.app.getPath('temp'), 'pixel-' + i + '.json')
            }
            while (fs.existsSync(filename))
            this.filename = filename
            this.name = path.basename(filename, '.json')
            this.editor = { zoom: 10, current: 0, frames: [{ undo: [], redo: [] }] }
            this.save()
        }
        else
        {
            this.filename = filename
            this.load()
            this.name = this.name || path.basename(filename, '.json')
        }
    }

    add(index)
    {
        const add = { width: DEFAULT[0], height: DEFAULT[1], data: [] }
        for (let i = 0; i < DEFAULT[0] * DEFAULT[0]; i++)
        {
            add.data[i] = null
        }
        if (typeof index !== 'undefined')
        {
            this.frames.splice(index, 0, add)
            this.editor.frames.splice(index, 0, { undo: [], redo: [] })
            Pixel.addFrame(index, this.getData(), sheet)
            sheet.render()
            this.current = index
        }
        else
        {
            this.frames.push(add)
            this.editor.frames.push({ undo: [], redo: [] })
            Pixel.addFrame(this.frames.length - 1, this.getData(), sheet)
            sheet.render()
            this.current = this.frames.length - 1
        }
        this.save()
    }

    remove(index)
    {
        if (index < this.frames.length)
        {
            this.frames.splice(index, 1)
            this.save()
        }
    }

    duplicate(index)
    {
        if (index < this.frames.length)
        {
            const frame = this.frames[index]
            this.frames.push({ width: frame.width, height: frame.height, data: frame.data.slice(0) })
            const editor = this.editor.frames[index]
            this.editor.frames.push({ undo: editor.undo, redo: editor.redo })
            Pixel.addFrame(this.frames.length - 1, this.getData(), sheet)
            sheet.render()
            this.current = this.frames.length - 1
            this.save()
        }
    }

    remove(index)
    {
        if (index < this.frames.length && this.frames.length > 1)
        {
            this.frames.splice(index, 1)
            this.editor.frames.splice(index, 1)
            this.current = (index < this.frames.length) ? index : 0
            this.save()
        }
    }

    get count()
    {
        return this.frames.length
    }

    move(index, newIndex)
    {
        if (index < this.frames.length)
        {
            const frame = this.frames.splice(index, 1)[0]
            const editor = this.editor.frames.splice(index, 1)[0]
            if (newIndex > index)
            {
                newIndex--
            }
            this.frames.splice(newIndex, 0, frame)
            this.editor.frames.splice(newIndex, 0, editor)
            this.save()
        }
    }

    rotate(reverse)
    {
        this.undoSave()
        const data = []
        for (let y = 0; y < this.height; y++)
        {
            const x2 = (reverse) ? y : this.height - y - 1
            for (let x = 0; x < this.width; x++)
            {
                const y2 = (reverse) ? (this.width - x - 1) * this.height : x * this.height
                data[x2 + y2] = this.get(x, y)
            }
        }
        const current = this.frames[this.editor.current]
        current.data = data
        const swap = current.height
        current.height = current.width
        current.width = swap
        this.save()
    }

    flipHorizontal()
    {
        this.undoSave()
        const data = []
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                data[this.width - x - 1 + y * this.width] = this.get(x, y)
            }
        }
        this.data = data
        this.save()
    }

    flipVertical()
    {
        this.undoSave()
        const data = []
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                data[x + (this.height - y - 1) * this.width] = this.get(x, y)
            }
        }
        this.data = data
        this.save()
    }

    blank()
    {
        const data = []
        for (let i = 0; i < this.width * this.height; i++)
        {
            data.push(null)
        }
        this.frames.push({ width: this.width, height: this.height, data })
        this.editor.frames.push({ undo: [], redo: [] })
    }

    set(x, y, value, noUndo)
    {
        if (x < this.width && x >= 0 && y < this.height && y >= 0)
        {
            if (!noUndo)
            {
                this.undoSave()
            }
            this.data[x + y * this.width] = value
        }
        if (!noUndo)
        {
            this.save()
        }
    }
    get(x, y)
    {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height)
        {
            return this.data[x + y * this.width]
        }
        else
        {
            return null
        }
    }

    get data()
    {
        return this.frames[this.editor.current].data
    }
    set data(value)
    {
        this.frames[this.editor.current].data = value
        this.save()
    }

    get current()
    {
        return this.editor.current
    }
    set current(value)
    {
        if (this.editor.current !== value)
        {
            this.editor.current = value
            this.save()
        }
    }

    get maxWidth()
    {
        let width = 0
        for (let frame of this.frames)
        {
            width = frame.width > width ? frame.width : width
        }
        return width
    }

    get width()
    {
        return this.frames[this.editor.current].width
    }
    set width(value)
    {
        value = parseInt(value)
        if (this.width !== value && !isNaN(value) && value > 0)
        {
            this.undoSave()
            const data = []
            for (let y = 0; y < this.height; y++)
            {
                for (let x = 0; x < value; x++)
                {
                    data[x + y * value] = (x < this.width) ? this.get(x, y) : null
                }
            }
            this.frames[this.editor.current].data = data
            this.frames[this.editor.current].width = value
            this.save()
        }
    }

    adjustWidth(width, align)
    {
        if (this.width !== width)
        {
            let start = 0
            if (align === 'center')
            {
                start = Math.floor(this.width / 2) - Math.floor(width / 2)
            }
            else if (align === 'right')
            {
                start = this.width - width
            }
            this.undoSave()
            const data = []
            for (let y = 0; y < this.height; y++)
            {
                for (let x = start; x < width + start; x++)
                {
                    data[x - start + y * width] = this.get(x, y)
                }
            }
            this.frames[this.editor.current].data = data
            this.frames[this.editor.current].width = width
            this.sheet.render()
            this.save()
        }
    }

    adjustHeight(height, align)
    {
        if (this.height !== height)
        {
            let start = 0
            if (align === 'center')
            {
                start = Math.floor(this.height / 2) - Math.floor(height / 2)
            }
            else if (align === 'bottom')
            {
                start = this.height - height
            }
            this.undoSave()
            const data = []
            for (let y = start; y < height + start; y++)
            {
                for (let x = 0; x < this.width; x++)
                {
                    data[x + (y - start) * this.width] = this.get(x, y)
                }
            }
            this.frames[this.editor.current].data = data
            this.frames[this.editor.current].height = height
            this.sheet.render()
            this.save()
        }
    }

    crop(xStart, yStart, width, height)
    {
        this.undoSave()
        const data = []
        for (let y = yStart; y < yStart + height; y++)
        {
            for (let x = xStart; x < xStart + width; x++)
            {
                data[x - xStart + (y - yStart) * width] = this.get(x, y)
            }
        }
        this.frames[this.editor.current].data = data
        this.frames[this.editor.current].width = width
        this.frames[this.editor.current].height = height
        this.sheet.render()
        this.save()
    }

    get maxHeight()
    {
        let height = 0
        for (let frame of this.frames)
        {
            height = frame.height > height ? frame.height : height
        }
        return height
    }

    get height()
    {
        return this.frames[this.editor.current].height
    }
    set height(value)
    {
        value = parseInt(value)
        if (this.height !== value && !isNaN(value) && value > 0)
        {
            this.undoSave()
            const data = []
            for (let y = 0; y < value; y++)
            {
                for (let x = 0; x < this.width; x++)
                {
                    data[x + y * this.width] = (y < this.height) ? this.get(x, y) : null
                }
            }
            this.frames[this.editor.current].data = data
            this.frames[this.editor.current].height = value
            this.save()
        }
    }

    get undo()
    {
        return this.editor.frames[this.editor.current].undo
    }
    set undo(value)
    {
        this.editor.frames[this.editor.current].undo = value
        this.save()
    }

    get redo()
    {
        return this.editor.frames[this.editor.current].redo
    }
    set redo(value)
    {
        this.editor.frames[this.editor.current].redo = value
        this.save()
    }

    get zoom()
    {
        return this.editor.zoom
    }
    set zoom(value)
    {
        this.editor.zoom = value
        this.save()
    }

    undoSave()
    {
        while (this.undo.length > 10000)
        {
            this.undo.shift()
        }
        this.undo.push({ width: this.width, height: this.height, data: this.data.slice(0) })
        this.redo = []
        this.save()
    }

    undoOne()
    {
        if (this.undo.length)
        {
            this.redo.push({ width: this.width, height: this.height, data: this.data.slice(0) })
            const undo = this.undo.pop()
            this.frames[this.editor.current].width = undo.width
            this.frames[this.editor.current].height = undo.height
            this.frames[this.editor.current].data = undo.data
            this.save()
            sheet.render()
        }
    }

    redoOne()
    {
        if (this.redo.length)
        {
            const redo = this.redo.pop()
            this.frames[this.editor.current].width = redo.width
            this.frames[this.editor.current].height = redo.height
            this.frames[this.editor.current].data = redo.data
            this.undo.push({ width: this.width, height: this.height, data: this.data.slice(0) })
            this.save()
            sheet.render()
        }
    }

    load(filename)
    {
        filename = filename || this.filename
        try
        {
            const load = jsonfile.readFileSync(filename)
            if (!load.frames.length || !load.animations || !load.frames[0].width || !load.frames[0].height)
            {
                return
            }
            this.frames = load.frames
            this.animations = load.animations
            this.name = load.name
            this.render(true)
            sheet.render()
        }
        catch (e)
        {
            return
        }
        this.filename = filename
        try
        {
            this.editor = jsonfile.readFileSync(this.filename.replace('.json', '.editor.json'))
            this.editor.current = 0
            this.editor.zoom = exists(this.editor.zoom) ? this.editor.zoom : 10
        }
        catch (e)
        {
            this.editor = {}
            this.editor.frames = []
            for (let i = 0; i < this.frames.length; i++)
            {
                this.editor.frames.push({ undo: [], redo: [] })
            }
            this.editor.current = 0
            this.editor.zoom = 10
            this.save()
        }
        this.emit('changed')
    }

    save(filename)
    {
        this.filename = filename || this.filename
        jsonfile.writeFileSync(this.filename, { name: this.name, frames: this.frames, animations: this.animations })
        if (this.editor)
        {
            jsonfile.writeFileSync(this.filename.replace('.json', '.editor.json'), this.editor)
        }
        this.emit('changed')
    }

    getData()
    {
        return { name: this.name, frames: this.frames, animations: this.animations }
    }

    export()
    {
        const result = { data: [], colors: [] }
        const frame = this.frames[this.editor.current]
        for (let y = 0; y < frame.height; y++)
        {
            for (let x = 0; x < frame.width; x++)
            {
                let index
                const color = this.get(x, y)
                if (color !== null)
                {
                    for (let i = 0; i < result.colors.length; i++)
                    {
                        if (result.colors[i] === color)
                        {
                            index = i
                            break
                        }
                    }
                    if (!exists(index))
                    {
                        result.colors.push(color)
                        index = result.colors.length - 1
                    }
                }
                result.data.push(index)
            }
        }
        return JSON.stringify(result, null, 0).replace(/"/g, '\'')
    }
}
module.exports = new PixelEditor()