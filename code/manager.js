const path = require('path')
const clicked = require('clicked')

const Tooltip = require('./config/libraries').Tooltip
const File = require('./config/file')
const PixelEditor = require('./pixel-editor')
const locale = require('./locale')
const State = require('./state')
const html = require('./html')
const button = require('./button')

const ICONS = require('../images/manager.json')

const MIN_WIDTH = '165px'

module.exports = class Manager
{
    constructor(ui)
    {
        this.win = ui.createWindow({ x: 10, y: 10, minWidth: MIN_WIDTH, resizable: true, minimizable: false })
        this.win.open()
        this.content = this.win.content
        this.content.style.color = '#eeeeee'
        this.toolbar = html({ parent: this.content, styles: { textAlign: 'center' } })
        this.box = html({ parent: this.content })
        this.setupToolbar()
        this.populateBox()
        this.stateSetup()
    }

    setupToolbar()
    {
        clicked(button(this.toolbar, ICONS.imageData[4], { opacity: 0.6 }, locale.get('openFolder')), () =>
        {
            File.openDirDialog((dir) =>
            {
                if (dir && dir.length >= 1)
                {
                    this.populateBox(dir[0])
                }
            })
        })
        clicked(button(this.toolbar, ICONS.imageData[1], { opacity: 0.6 }, locale.get('increaseZoom')), () =>
        {
            State.manager.zoom++
            State.save()
            this.populateBox()
        })
        clicked(button(this.toolbar, ICONS.imageData[2], { opacity: 0.6 }, locale.get('decreaseZoom')), () =>
        {
            State.manager.zoom--
            State.manager.zoom = State.manager.zoom < 1 ? 1 : State.manager.zoom
            State.save()
            this.populateBox()
        })
        const images = button(this.toolbar, ICONS.imageData[0], { opacity: State.manager.images ? 0.6 : 0.4 }, locale.get('toggleImages'))
        clicked(images, () => {
            State.manager.images = !State.manager.images
            State.save()
            this.populateBox()
            images.style.opacity = State.manager.images ? 0.6 : 0.4
        })
        const alphabetical = button(this.toolbar, ICONS.imageData[3], { opacity: State.manager.alphabetical ? 0.6 : 0.4 }, locale.get('toggleSort'))
        clicked(alphabetical, () =>
        {
            State.manager.alphabetical = !State.manager.alphabetical
            State.save()
            this.populateBox()
            alphabetical.style.opacity = State.manager.alphabetical ? 0.6 : 0.4
        })
    }

    populateBox(dir)
    {
        while (this.box.firstChild)
        {
            this.box.removeChild(this.box.firstChild);
        }
        if (State.manager.images)
        {
            this.images(dir)
        }
        else
        {
            this.names(dir)
        }
    }

    images(dir)
    {
        this.box.style.width = '100%'
        this.box.style.display = 'flex'
        this.box.style.flexWrap = 'wrap'
        this.box.style.justifyContent = 'space-around'
        this.box.style.alignItems = 'center'
        this.box.style.padding = '0'

        dir = dir || path.dirname(PixelEditor.filename)
        if (dir)
        {
            File.readDir(dir, (files) =>
            {
                let images = []
                for (let file of files)
                {
                    if (file.indexOf('.json') !== -1 && file.indexOf('.editor.') === -1)
                    {
                        const filename = path.join(dir, file)
                        File.readJSON(filename, (data) =>
                        {
                            if (data.imageData)
                            {
                                const image = new Image()
                                image.sort = State.manager.alphabetical ? data.name : File.fileDate(filename)
                                image.src = 'data:image/png;base64,' + data.imageData[0][2]
                                image.width = data.imageData[0][0]
                                image.height = data.imageData[0][1]
                                image.style.width = data.imageData[0][0] * State.manager.zoom + 'px'
                                image.style.height = data.imageData[0][1] * State.manager.zoom + 'px'
                                image.style.margin = '0.25em'
                                image.style.imageRendering = 'pixelated'
                                image.addEventListener('mouseenter', () =>
                                {
                                    image.style.backgroundColor = '#aaaaaa'
                                })
                                image.addEventListener('mouseleave', () =>
                                {
                                    image.style.backgroundColor = 'transparent'
                                })
                                clicked(image, () => { PixelEditor.load(filename) })
                                new Tooltip(image, data.name)
                                images.push(image)
                            }
                        })
                    }
                }
                images = images.sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0 })
                for (let entry of images)
                {
                    this.box.appendChild(entry)
                }
            })
        }
    }

    names(dir)
    {
        this.box.style.display = 'block'
        this.box.style.padding = '0.5em'
        dir = dir || path.dirname(PixelEditor.filename)
        if (dir)
        {
            let entries = []
            File.readDir(dir, (files) =>
            {
                for (let file of files)
                {
                    const filename = path.join(dir, file)
                    if (file.indexOf('.json') !== -1 && file.indexOf('.editor.') === -1)
                    {
                        File.readJSON(filename, (data) =>
                        {
                            if (data.imageData)
                            {
                                const entry = html({ html: data.name, styles: { marginBottom: '0.25em', width: 'calc(100% - 0.25em)' } })
                                entry.sort = State.manager.alphabetical ? data.name : File.fileDate(filename)
                                entries.push(entry)
                                clicked(entry, () => { PixelEditor.load(filename) })
                                entry.addEventListener('mouseenter', () =>
                                {
                                    entry.style.backgroundColor = '#aaaaaa'
                                    entry.style.color = 'black'
                                })
                                entry.addEventListener('mouseleave', () =>
                                {
                                    entry.style.backgroundColor = 'transparent'
                                    entry.style.color = ''
                                })
                                new Tooltip(entry, filename)
                            }
                        })
                    }
                }
                entries = entries.sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0 })
                for (let entry of entries)
                {
                    this.box.appendChild(entry)
                }
            })
        }
    }

    stateSetup()
    {
        this.win.on('move-end', () => State.set())
        State.on('last-file', () => this.populateBox())
    }

    keydown(e)
    {
        const code = e.keyCode
        if (code === 77 && !e.ctrlKey && !e.altKey && !e.shiftKey)
        {
            if (this.win.closed)
            {
                this.win.open()
                State.set()
            }
            else
            {
                this.win.close()
                State.set()
            }
            e.preventDefault()
            e.stopPropagation()
        }
    }
}