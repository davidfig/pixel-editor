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
            this.save()
        }
        else
        {
            this.filename = filename
            this.load()
            this.name = this.name || path.basename(filename, '.json')
        }
        this.createCanvases()
    }

    createCanvases()
    {
        this.canvases = []
        for (let frame of this.imageData)
        {
            const canvas = document.createElement('canvas')
            canvas.style.imageRendering = 'pixelated'
            canvas.width = frame[0]
            canvas.height = frame[1]
            canvas.c = canvas.getContext('2d')
            const image = new Image(frame[0], frame[1])
            image.src = 'data:image/png;base64,' + frame[2]
            image.onload = () => canvas.c.drawImage(image, 0, 0)
            this.canvases.push(canvas)
canvas.style.position = 'fixed'
document.body.appendChild(canvas)
        }
    }

    blank(width, height)
    {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        return this.canvasURL(canvas)
    }

    canvasURL(canvas)
    {
        return canvas.toDataURL().replace(/^data:image\/(png|jpg);base64,/, '')
    }

    add(index)
    {
        const add = [DEFAULT[0], DEFAULT[1], this.blank(DEFAULT[0], DEFAULT[1])]
        if (typeof index !== 'undefined')
        {
            this.imageData.splice(index, 0, add)
            this.editor.imageData.splice(index, 0, { undo: [], redo: [] })
            Pixel.addFrame(index, this.getData(), sheet)
            sheet.render()
            this.current = index
        }
        else
        {
            this.imageData.push(add)
            this.editor.imageData.push({ undo: [], redo: [] })
            Pixel.addFrame(this.imageData.length - 1, this.getData(), sheet)
            sheet.render()
            this.current = this.imageData.length - 1
        }
        this.save()
    }

    remove(index)
    {
        if (index < this.imageData.length)
        {
            this.imageData.splice(index, 1)
            this.save()
        }
    }

    duplicate(index)
    {
        if (index < this.imageData.length)
        {
            const frame = this.imageData[index]
            this.imageData.push([frame[0], frame[1], frame[2].slice(0)])
            const editor = this.editor.imageData[index]
            this.editor.imageData.push({ undo: editor.undo, redo: editor.redo })
            Pixel.addFrame(this.imageData.length - 1, this.getData(), sheet)
            sheet.render()
            this.current = this.imageData.length - 1
            this.save()
        }
    }

    remove(index)
    {
        if (index < this.imageData.length && this.imageData.length > 1)
        {
            this.imageData.splice(index, 1)
            this.editor.imageData.splice(index, 1)
            this.current = (index < this.imageData.length) ? index : 0
            this.save()
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
            sheet.render()
            this.save()
        }
    }

    rotate(reverse)
    {
        console.log('not working...')
        return
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
        sheet.render()
        this.save()
    }

    flipHorizontal()
    {
        console.log('not working...')
        return
        this.undoSave()
        const canvas = document.createElement('canvas')
        const data = []
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                data[this.width - x - 1 + y * this.width] = this.get(x, y)
            }
        }
        this.data = data
        sheet.render()
        this.save()
    }

    flipVertical()
    {
        console.log('not working...')
        return
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
        sheet.render()
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
            const canvas = this.canvases[this.current]
            const c = canvas.c
            const hex = parseInt(value, 16)
            const alpha = hex & 0xff
            const rgb = Color.hexToRgb(hex >>> 8)
            const imageData = c.getImageData(0, 0, this.width, this.height)
            const index = (y * (imageData.width * 4)) + (x * 4)
            imageData.data[index] = rgb.r
            imageData.data[index + 1] = rgb.g
            imageData.data[index + 2] = rgb.b
            imageData.data[index + 3] = alpha
            c.putImageData(imageData, 0, 0)
            this.imageData[this.current][2] = this.canvasURL(canvas)
            Pixel.addFrame(this.current, this, this.sheet)
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
            const data = this.canvases[this.current].c.getImageData(x, y, 1, 1).data
            return data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3]
        }
        else
        {
            return 0
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
            this.save()
        }
    }

    get maxWidth()
    {
        let width = 0
        for (let frame of this.imageData)
        {
            width = frame.width > width ? frame.width : width
        }
        return width
    }

    get width()
    {
        return this.imageData[this.editor.current][0]
    }
    set width(value)
    {
        value = parseInt(value)
        if (this.width !== value && !isNaN(value) && value > 0)
        {
            console.log('...not working')
            return
            this.undoSave()
            const data = []
            for (let y = 0; y < this.height; y++)
            {
                for (let x = 0; x < value; x++)
                {
                    data[x + y * value] = (x < this.width) ? this.get(x, y) : null
                }
            }
            this.imageData[this.editor.current].data = data
            this.imageData[this.editor.current].width = value
            this.save()
        }
    }

    adjustWidth(width, align)
    {
        console.log('...not working')
        return
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
        console.log('...not working')
        return
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
        console.log('...not working')
        return
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
        for (let frame of this.imageData)
        {
            height = frame.height > height ? frame.height : height
        }
        return height
    }

    get height()
    {
        return this.imageData[this.editor.current][1]
    }
    set height(value)
    {
        console.log('...not working')
        return
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
    }

    undoSave()
    {
        console.log('...not working')
        return
        this.undo.push({ width: this.width, height: this.height, data: this.data })
        while (this.undo.length > UNDO_SIZE)
        {
            this.undo.shift()
        }
        this.redo = []
        this.save()
    }

    undoOne()
    {
        console.log('...not working')
        return
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
        console.log('...not working')
        return
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
            if (!load.imageData.length || !load.animations || load.imageData[0].length !== 3)
            {
                return
            }
            this.imageData = load.imageData
            this.animations = load.animations
            this.name = load.name
            this.render(true)
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
        const changed = this.filename !== filename
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