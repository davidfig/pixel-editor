const remote = require('electron').remote
const path = require('path')
const UI = require('yy-ui')
const PIXI = require('pixi.js')
const fs = require('fs')

const sheet = require('./pixel-sheet')
const State = require('./state')
const PixelEditor = require('./pixel-editor')

module.exports = class Export extends UI.Stack
{
    constructor()
    {
        super({ draggable: true, modal: true, transparent: false, theme: { spacing: 10 } })
        this.add(new UI.Text('Export Frame to PNG', { align: 'center', theme: { spacing: 0 } }))
        this.add(new UI.Spacer(0, 10))
        this.editWidth = this.add(new UI.EditText(PixelEditor.width * PixelEditor.zoom, { count: 8, beforeText: 'Desired Width: ' }))
        this.editWidth.on('changed', this.changeWidth, this)
        this.editHeight = this.add(new UI.EditText(PixelEditor.height * PixelEditor.zoom, { count: 8, beforeText: 'Desired Height: ' }))
        this.editHeight.on('changed', this.changeHeight, this)
        this.editScale = this.add(new UI.EditText(PixelEditor.zoom, { count: 8, beforeText: 'Desired Scale: ' }))
        this.editScale.on('changed', this.changeScale, this)
        this.editWidth.width = this.editScale.width = this.editHeight.width
        this.exportButton = new UI.Button({ text: 'export' })
        this.exportButton.on('clicked', this.export, this)
        this.cancelButton = new UI.Button({ text: 'cancel' })
        this.cancelButton.on('clicked', this.close, this)
        this.add(new UI.Spacer(0, 10))
        this.buttons = this.add(new UI.Stack([this.exportButton, this.cancelButton], { sameWidth: true, horizontal: true }))
        this.layout()
        this.position.set(window.innerWidth / 2 - this.width / 2, window.innerHeight / 2 - this.height / 2)
        this.saveScale = PixelEditor.zoom
    }

    changeWidth()
    {
        const scale = parseInt(this.editWidth.text) / PixelEditor.width
        if (!isNaN(scale))
        {
            this.saveScale = scale
            this.editScale.text = scale.toFixed(2)
            this.editHeight.text = (PixelEditor.height * scale).toFixed(2)
        }
        else
        {
            this.editWidth.text = ''
        }
    }

    changeHeight()
    {
        const scale = parseInt(this.editHeight.text) / PixelEditor.height
        if (!isNaN(scale))
        {
            this.saveScale = scale
            this.editScale.text = scale.toFixed(2)
            this.editWidth.text = (PixelEditor.width * scale).toFixed(2)
        }
        else
        {
            this.editHeight.text = ''
        }
    }

    changeHeight()
    {
        const scale = parseFloat(this.editScale.text)
        if (!isNaN(scale))
        {
            this.saveScale = scale
            this.editHeight.text = (PixelEditor.height * scale).toFixed(2)
            this.editWidth.text = (PixelEditor.width * scale).toFixed(2)
        }
        else
        {
            this.editScale.text = ''
        }
    }

    keydown(code)
    {

    }

    export()
    {
        remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Export PNG file', defaultPath: State.lastPath }, this.exportFile.bind(this))
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
            const renderer = new PIXI.CanvasRenderer({ width, height, transparent: true })
            const sprite = sheet.get(PixelEditor.name + '-' + PixelEditor.current)
            sprite.scale.set(this.saveScale)
            sprite.anchor.set(0)
            renderer.render(sprite)
            const data = renderer.view.toDataURL().replace(/^data:image\/\w+;base64,/, '')
            fs.writeFileSync(name, new Buffer(data, 'base64'))
            this.close()
        }
    }
}