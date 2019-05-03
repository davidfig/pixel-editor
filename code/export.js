const PIXI = require('pixi.js')
const clicked = require('clicked')
const path = require('path')

const File = require('./config/file')
const sheet = require('./pixel-sheet')
const html = require('./html')

const State = require('./state')
const PixelEditor = require('./pixel-editor')

module.exports = class Export
{
    constructor(wm)
    {
        this.win = wm.createWindow({ title: 'Export Frame to PNG', modal: true, resizable: false, maximizable: false, minimizable: false, minHeight: 0, titleCenter: true })

        let div = html({ parent: this.win.content, styles: { textAlign: 'center', margin: '1em 0.5em 0.5em' } })
        html({ parent: div, type: 'label', html: 'title', html: 'width: ', styles: { display: 'inline-block', width: '5em' } })
        this.width = html({ parent: div, type: 'input', styles: { width: '3em', textAlign: 'right' } })
        this.width.value = PixelEditor.width * PixelEditor.zoom
        this.captureKey(this.width)
        this.width.addEventListener('change', () => this.changeWidth())

        div = html({ parent: this.win.content, styles: { textAlign: 'center', margin: '0.5em' } })
        html({ parent: div, type: 'label', html: 'title', html: 'height: ', styles: { display: 'inline-block', width: '5em' } })
        this.height = html({ parent: div, type: 'input', styles: { width: '3em', textAlign: 'right' } })
        this.height.value = PixelEditor.height * PixelEditor.zoom
        this.captureKey(this.height)
        this.height.addEventListener('change', () => this.changeHeight())

        div = html({ parent: this.win.content, styles: { textAlign: 'center', margin: '0.5em' } })
        html({ parent: div, type: 'label', html: 'title', html: 'scale: ', styles: { display: 'inline-block', width: '5em' } })
        this.scale = html({ parent: div, type: 'input', styles: { width: '3em', textAlign: 'right' } })
        this.scale.value = PixelEditor.zoom
        this.captureKey(this.scale)
        this.scale.addEventListener('change', () => this.changeScale())

        const buttons = html({ parent: this.win.content, styles: { width: '100%', display: 'flex', justifyContent: 'center', margin: '0.25em' } })
        const OK = html({ parent: buttons, type: 'button', html: 'export...', styles: { width: '6em', display: 'block', margin: '0.25em' } })
        clicked(OK, () => this.OK())
        const Cancel = html({ parent: buttons, type: 'button', html: 'cancel', styles: { width: '6em', display: 'block', margin: '0.25em' } })
        clicked(Cancel, () => this.cancel())

        this.win.open()
        this.win.move(window.innerWidth / 2 - this.win.width / 2, window.innerHeight / 2 - this.win.height / 2)

        this.saveScale = PixelEditor.zoom
    }

    OK()
    {
        File.exportFileDialog(State.lastPath, this.exportFile.bind(this))
    }

    exportFile(name)
    {
        if (name)
        {
            if (path.extname(name) !== '.png')
            {
                name += '.png'
            }
            const width = Math.ceil(PixelEditor.width * this.saveScale)
            const height = Math.ceil(PixelEditor.height * this.saveScale)
            const renderer = new PIXI.WebGLRenderer({ width, height, transparent: true })
            const sprite = sheet.get(PixelEditor.name + '-' + PixelEditor.current)
            sprite.scale.set(this.saveScale)
            sprite.anchor.set(0)
            renderer.render(sprite)
            const data = renderer.view.toDataURL().replace(/^data:image\/\w+;base64,/, '')
            File.writeFile(name, new Buffer(data, 'base64'))
        }
        this.win.close()
    }

    cancel()
    {
        this.win.close()
    }

    captureKey(div)
    {
        div.addEventListener('keydown', (e) =>
        {
            if (e.code === 'Enter')
            {
                this.OK()
            }
            e.stopPropagation()
        })
        div.addEventListener('keyup', (e) => e.stopPropagation())
    }

    changeWidth()
    {
        const scale = parseInt(this.width.value) / PixelEditor.width
        if (!isNaN(scale))
        {
            this.saveScale = scale
            this.scale.value = this.fix(scale)
            this.height.value = this.fix(PixelEditor.height * scale)
        }
        else
        {
            this.width.value = ''
        }
    }

    changeHeight()
    {
        const scale = parseInt(this.height.value) / PixelEditor.height
        if (!isNaN(scale))
        {
            this.saveScale = scale
            this.scale.value = this.fix(scale)
            this.width.value = this.fix(PixelEditor.width * scale)
        }
        else
        {
            this.height.value = ''
        }
    }

    changeScale()
    {
        const scale = parseFloat(this.scale.value)
        if (!isNaN(scale))
        {
            this.saveScale = scale
            this.height.value = this.fix(PixelEditor.height * scale)
            this.width.value = this.fix(PixelEditor.width * scale)
        }
        else
        {
            this.scale.value = ''
        }
    }

    fix(n)
    {
        if (n === Math.round(n))
        {
            return n
        }
        else
        {
            return n.toFixed(2)
        }
    }
}