const remote = require('electron').remote
const fs = require('fs')
const jsonfile = require('jsonfile')
const path = require('path')
const Settings = require('./settings')
const Pixel = require(Settings.YY_PIXEL).Pixel
const exists = require('exists')
const Color = require('yy-color')

const sheet = require('./pixel-sheet')

const DEFAULT = [15, 15]
const UNDO_SIZE = 50

class PixelEditor extends Pixel
{
    constructor(filename)
    {
        super()
        this.sheet = sheet
        this.tempCanvas = document.createElement('canvas')
        this.tempCanvas.c = this.tempCanvas.getContext('2d')
        this.create(filename)
    }

    create(filename)
    {
        if (!filename)
        {
            this.imageData = [[DEFAULT[0], DEFAULT[1], this.blank(DEFAULT[0], DEFAULT[1])]]
            this.animations = { 'idle': [[0, 0]] }
            let i = 0
            do
            {
                i++
                filename = path.join(remote.app.getPath('temp'), 'pixel-' + i + '.json')
            }
            while (fs.existsSync(filename))
            this.filename = filename
            this.name = path.basename(filename, '.json')
            this.editor = { zoom: 10, current: 0, imageData: [{ undo: [], redo: [] }] }
            Pixel.addFrame(0, this.getData(), sheet)
            sheet.render(() => this.save())
        }
        else
        {
            this.filename = filename
            this.load()
            this.name = this.name || path.basename(filename, '.json')
        }
    }

    blank(width, height)
    {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        return canvas.toDataURL().replace(/^data:image\/(png|jpg);base64,/, '')
    }

    canvasURL(canvas, frame)
    {
        this.tempCanvas.width = frame.width
        this.tempCanvas.height = frame.height
        const data = canvas.getContext('2d').getImageData(frame.x, frame.y, frame.width, frame.height)
        this.tempCanvas.c.putImageData(data, 0, 0)
        return this.tempCanvas.toDataURL().replace(/^data:image\/(png|jpg);base64,/, '')
    }

    add(index)
    {
        const add = [this.width, this.height, this.blank(this.width, this.height)]
        if (typeof index !== 'undefined')
        {
            this.imageData.splice(index, 0, add)
            this.editor.imageData.splice(index, 0, { undo: [], redo: [] })
            Pixel.addFrame(index, this.getData(), sheet)
            sheet.render(() =>
            {
                this.emit('changed')
                this.current = index
                this.save()
            })
        }
        else
        {
            this.imageData.push(add)
            this.editor.imageData.push({ undo: [], redo: [] })
            Pixel.addFrame(this.imageData.length - 1, this.getData(), sheet)
            sheet.render(() =>
            {
                this.emit('changed')
                this.current = this.imageData.length - 1
                this.save()
            })
        }
    }

    remove(index)
    {
        if (index < this.imageData.length)
        {
            this.imageData.splice(index, 1)
            this.save()
        }
    }

    duplicate()
    {
        const frame = this.imageData[this.current]
        this.imageData.push([frame[0], frame[1], frame[2]])
        this.editor.imageData.push({ undo: [], redo: [] })
        Pixel.addFrame(this.imageData.length - 1, this.getData(), sheet)
        sheet.render(() =>
        {
            this.emit('changed')
            this.current = this.imageData.length - 1
        })
    }

    remove(index)
    {
        if (index < this.imageData.length && this.imageData.length > 1)
        {
            this.imageData.splice(index, 1)
            this.editor.imageData.splice(index, 1)
            this.current = (index < this.imageData.length) ? index : 0
            this.emit('changed')
        }
    }

    get count()
    {
        return this.imageData.length
    }

    get largestWidth()
    {
        let width = 0
        for (let frame of this.imageData)
        {
            width = frame[0] > width ? frame[0] : width
        }
        return width
    }

    get largestHeight()
    {
        let height = 0
        for (let frame of this.imageData)
        {
            height = frame[1] > height ? frame[1] : height
        }
        return height
    }

    move(index, newIndex)
    {
        if (index < this.imageData.length)
        {
            const frame = this.imageData.splice(index, 1)[0]
            const editor = this.editor.imageData.splice(index, 1)[0]
            if (newIndex > index)
            {
                newIndex--
            }
            this.imageData.splice(newIndex, 0, frame)
            this.editor.imageData.splice(newIndex, 0, editor)
            sheet.render(() => this.save())
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
        const current = this.imageData[this.editor.current]
        current.data = data
        const swap = current[1]
        current[1] = current[0]
        current[0] = swap
        sheet.render(() => this.save)
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
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                this.set(x, y, data[x + y * this.width], true)
            }
        }
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
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                this.set(x, y, data[x + y * this.width], true)
            }
        }
        this.save()
    }

    set(x, y, value, noUndo)
    {
        if (x < this.width && x >= 0 && y < this.height && y >= 0)
        {
            if (!noUndo)
            {
                this.undoSave()
            }
            const texture = sheet.textures[this.name + '-' + this.current].texture
            const canvas = texture.baseTexture.source
            const c = canvas.getContext('2d')
            const frame = texture.frame
            const hex = parseInt(value, 16)
            const alpha = hex & 0xff
            const rgb = Color.hexToRgb(hex >>> 8)
            const imageData = c.getImageData(frame.x, frame.y, this.width, this.height)
            const index = (y * (imageData.width * 4)) + (x * 4)
            imageData.data[index] = rgb.r
            imageData.data[index + 1] = rgb.g
            imageData.data[index + 2] = rgb.b
            imageData.data[index + 3] = alpha
            c.putImageData(imageData, frame.x, frame.y)
            texture.baseTexture.update()
            this.imageData[this.current][2] = this.canvasURL(canvas, frame)
        }
        if (!noUndo)
        {
            this.save()
        }
    }

    get(x, y)
    {
        function hex(n)
        {
            const hex = n.toString(16)
            return hex.length === 2 ? hex : '0' + hex
        }

        if (x >= 0 && y >= 0 && x < this.width && y < this.height)
        {
            const texture = sheet.textures[this.name + '-' + this.current].texture
            const canvas = texture.baseTexture.source
            const c = canvas.getContext('2d')
            const frame = texture.frame
            const data = c.getImageData(frame.x + x, frame.y + y, 1, 1).data
            return hex(data[0]) + hex(data[1]) + hex(data[2]) + hex(data[3])
        }
        else
        {
            return '00000000'
        }
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
            this.emit('current')
            this.save()
        }
    }

    get maxWidth()
    {
        let width = 0
        for (let frame of this.imageData)
        {
            width = frame[0] > width ? frame[0] : width
        }
        return width
    }

    get width()
    {
        return this.imageData[this.current][0]
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
                    data[x + y * value] = (x < this.width) ? this.get(x, y) : '00000000'
                }
            }
            this.imageData[this.current][0] = value
            this.imageData[this.current][2] = this.blank(value, this.height)
            Pixel.addFrame(this.current, this.getData(), sheet)
            sheet.render(() =>
            {
                for (let y = 0; y < this.height; y++)
                {
                    for (let x = 0; x < value; x++)
                    {
                        this.set(x, y, data[x + y * value], true)
                    }
                }
                this.saveAndRender()
            })
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
            this.imageData[this.current][0] = width
            this.imageData[this.current][2] = this.blank(width, this.height)
            Pixel.addFrame(this.current, this.getData(), sheet)
            sheet.render(() =>
            {
                for (let y = 0; y < this.height; y++)
                {
                    for (let x = 0; x < width; x++)
                    {
                        this.set(x, y, data[x + y * width], true)
                    }
                }
                this.saveAndRender()
            })
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
            this.imageData[this.current][1] = height
            this.imageData[this.current][2] = this.blank(this.width, height)
            Pixel.addFrame(this.current, this.getData(), sheet)
            sheet.render(() =>
            {
                for (let y = 0; y < height; y++)
                {
                    for (let x = 0; x < this.width; x++)
                    {
                        this.set(x, y, data[x + y * this.width], true)
                    }
                }
                this.saveAndRender()
            })
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
        this.imageData[this.editor.current][0] = width
        this.imageData[this.editor.current][1] = height
        this.imageData[this.current][2] = this.blank(width, height)
        Pixel.addFrame(this.current, this.getData(), sheet)
        sheet.render(() =>
        {
            for (let y = 0; y < height; y++)
            {
                for (let x = 0; x < width; x++)
                {
                    this.set(x, y, data[x + y * width], true)
                }
            }
            this.saveAndRender()
        })
    }

    get maxHeight()
    {
        let height = 0
        for (let frame of this.imageData)
        {
            height = frame[1] > height ? frame[1] : height
        }
        return height
    }

    get height()
    {
        return this.imageData[this.editor.current][1]
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
            this.imageData[this.current].height = value
            this.imageData[this.current][2] = this.blank(this.width, value)
            Pixel.addFrame(this.current, this.getData(), sheet)
            sheet.render(() =>
            {
                for (let y = 0; y < value; y++)
                {
                    for (let x = 0; x < this.width; x++)
                    {
                        this.set(x, y, data[x + y * this.width], true)
                    }
                }
                this.saveAndRender()
            })
        }
    }

    saveAndRender()
    {
        Pixel.addFrame(this.current, this.getData(), sheet)
        sheet.render(() =>
        {
            this.save()
            this.emit('changed')
        })
    }

    get undo()
    {
        return this.editor.imageData[this.editor.current].undo
    }
    set undo(value)
    {
        this.editor.imageData[this.editor.current].undo = value
        this.save()
    }

    get redo()
    {
        return this.editor.imageData[this.editor.current].redo
    }
    set redo(value)
    {
        this.editor.imageData[this.editor.current].redo = value
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
        this.emit('changed')
    }

    undoSave()
    {
        this.undo.push({ width: this.width, height: this.height, data: this.imageData[this.current][2] })
        while (this.undo.length > UNDO_SIZE)
        {
            this.undo.shift()
        }
        this.redo = []
        this.save()
    }

    undoOne()
    {
        if (this.undo.length)
        {
            this.redo.push({ width: this.width, height: this.height, data: this.imageData[this.current][2] })
            const undo = this.undo.pop()
            this.imageData[this.current][0] = undo.width
            this.imageData[this.current][1] = undo.height
            this.imageData[this.current][2] = undo.data
            this.render(true)
            sheet.render(() => this.emit('changed'))
        }
    }

    redoOne()
    {
        if (this.redo.length)
        {
            const redo = this.redo.pop()
            this.imageData[this.current][0] = redo.width
            this.imageData[this.current][1] = redo.height
            this.imageData[this.current][2] = redo.data
            this.undo.push({ width: this.width, height: this.height, data: this.imageData[this.current][2] })
            this.render(true)
            sheet.render(() => this.emit('changed'))
        }
    }

    load(filename)
    {
        filename = filename || this.filename
        try
        {
            const load = jsonfile.readFileSync(filename)
            if (!load.imageData.length || !load.animations || load.imageData[0].length !== 3)
            {
                return
            }
            this.imageData = load.imageData
            this.animations = load.animations
            this.name = load.name
            this.render(true)
            sheet.render(() => this.emit('changed'))
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
            for (let frame of this.editor.imageData)
            {
                if (frame.undo.length > UNDO_SIZE)
                {
                    while (frame.undo.length > UNDO_SIZE)
                    {
                        frame.undo.shift()
                    }
                }
            }
        }
        catch (e)
        {
            this.editor = {}
            this.editor.imageData = []
            for (let i = 0; i < this.imageData.length; i++)
            {
                this.editor.imageData.push({ undo: [], redo: [] })
            }
            this.editor.current = 0
            this.editor.zoom = 10
            this.save()
        }
    }

    save(filename)
    {
        const changed = exists(filename) && this.filename !== filename
        this.filename = filename || this.filename
        jsonfile.writeFileSync(this.filename, { name: this.name, imageData: this.imageData, animations: this.animations })
        if (this.editor)
        {
            jsonfile.writeFileSync(this.filename.replace('.json', '.editor.json'), this.editor)
        }
        if (changed)
        {
            Pixel.add(this.getData(), sheet)
            sheet.render(() => this.emit('changed'))
        }
    }

    getData()
    {
        return { name: this.name, imageData: this.imageData, animations: this.animations }
    }
}

module.exports = new PixelEditor()