import { clicked }  from 'clicked'
import Tooltip from 'yy-tooltip'

import * as file from '../file'
import PixelEditor from '../pixel-editor'
import * as locale from '../locale'
import { state } from '../state'
import { html } from '../html'
import { button } from '../button'
import { Dialog } from '../dialog'
import { main } from '../index'

import ICONS from '../../images/manager.json'

const MIN_WIDTH = '165px'

export class Manager
{
    constructor(ui)
    {
        this.win = ui.createWindow({
            id: 'manager',
            title: locale.get('ManagerTitle'),
            x: 10, y: 10,
            minWidth: MIN_WIDTH,
            resizable: true,
        })
        this.win.open()
        this.win.content.addEventListener('wheel', e => e.stopPropagation())
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
        clicked(button(this.toolbar, ICONS.imageData[1], { opacity: 0.6 }, locale.get('increaseZoom')), () =>
        {
            state.manager.zoom++
            state.save()
            this.populateBox()
        })
        clicked(button(this.toolbar, ICONS.imageData[2], { opacity: 0.6 }, locale.get('decreaseZoom')), () =>
        {
            state.manager.zoom--
            state.manager.zoom = state.manager.zoom < 1 ? 1 : state.manager.zoom
            state.save()
            this.populateBox()
        })
        const images = button(this.toolbar, ICONS.imageData[0], { opacity: state.manager.images ? 0.6 : 0.4 }, locale.get('toggleImages'))
        clicked(images, () => {
            state.manager.images = !state.manager.images
            state.save()
            this.populateBox()
            images.style.opacity = state.manager.images ? 0.6 : 0.4
        })
        const alphabetical = button(this.toolbar, ICONS.imageData[3], { opacity: state.manager.alphabetical ? 0.6 : 0.4 }, locale.get('toggleSort'))
        clicked(alphabetical, () =>
        {
            state.manager.alphabetical = !state.manager.alphabetical
            state.save()
            this.populateBox()
            alphabetical.style.opacity = state.manager.alphabetical ? 0.6 : 0.4
        })
        clicked(button(this.toolbar, ICONS.imageData[4], { opacity: 0.6}, locale.get('deleteFile')), () =>
        {
            new Dialog(this.win, 'Delete File', 'confirmation', `Are you sure you want to delete the current file ${state.lastFile}?`, async () => {
                await file.unlink(state.lastFile)
                main.loadFirstFile()
            })
        })
    }

    populateBox(dir)
    {
        while (this.box.firstChild)
        {
            this.box.removeChild(this.box.firstChild)
        }
        if (state.manager.images)
        {
            this.drawImages(dir)
        }
        else
        {
            this.drawNames(dir)
        }
    }

    imagesComplete()
    {
        const images = this.images.sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0 })
        for (let entry of images)
        {
            this.box.appendChild(entry)
        }
    }

    async nextImageFile(filename)
    {
        if (filename.indexOf('.json') !== -1 && filename.indexOf('.editor.') === -1)
        {
            const data = await file.readJSON(filename)
            if (data && data.imageData)
            {
                const image = new Image()
                image.sort = state.manager.alphabetical ? data.name : (await file.date(filename) || this.index++)
                image.src = 'data:image/png;base64,' + data.imageData[0][2]
                image.width = data.imageData[0][0]
                image.height = data.imageData[0][1]
                image.style.width = data.imageData[0][0] * state.manager.zoom + 'px'
                image.style.height = data.imageData[0][1] * state.manager.zoom + 'px'
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
                clicked(image, async () =>
                {
                    await PixelEditor.load(filename)
                    state.lastFile = filename
                    state.current = 0
                    if (state.cursorX >= PixelEditor.width)
                    {
                        state.cursorX = 0
                    }
                    if (state.cursorY >= PixelEditor.height)
                    {
                        state.cursorY = 0
                    }
                })
                new Tooltip(image, `${data.name} (${filename})`)
                this.images.push(image)
            }
        }
    }

    async drawImages(dir)
    {
        this.box.style.width = '100%'
        this.box.style.display = 'flex'
        this.box.style.flexWrap = 'wrap'
        this.box.style.justifyContent = 'space-around'
        this.box.style.alignItems = 'center'
        this.box.style.padding = '0'

        this.index = 0
        this.images = []
        this.files = await file.dir()
        for (const filename of this.files)
        {
            await this.nextImageFile(filename)
        }
        this.imagesComplete()
    }

    async nextNameFile()
    {
        if (this.files.length)
        {
            const filename = this.files.pop()
            if (filename.indexOf('.json') !== -1 && filename.indexOf('.editor.') === -1)
            {
                const data = await file.readJSON(filename)
                if (data.imageData)
                {
                    const entry = html({ html: `${data.name} (${filename})`, styles: { marginBottom: '0.25em', width: 'calc(100% - 0.25em)' } })
                    entry.sort = state.manager.alphabetical ? data.name : (await file.date(filename) || this.index++)
                    clicked(entry, () => PixelEditor.load(filename))
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
                    this.entries.push(entry)
                }
                this.nextNameFile()
            }
            else
            {
                this.nextNameFile()
            }
        }
        else
        {
            this.nameComplete()
        }
    }

    nameComplete()
    {
        const entries = this.entries.sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0 })
        for (let entry of entries)
        {
            this.box.appendChild(entry)
        }
    }

    async drawNames(dir)
    {
        this.box.style.display = 'block'
        this.box.style.padding = '0.5em'
        this.index = 0
        this.entries = []
        this.files = await file.dir()
        this.nextNameFile()
    }

    stateSetup()
    {
        state.on('last-file', () => this.populateBox())
    }
}