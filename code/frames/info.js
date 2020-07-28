import EasyEdit from 'easyedit'
import Tooltip from 'yy-tooltip'

import { state } from '../state'
import { Dice } from '../dice'
import PixelEditor from '../pixel-editor'
import * as locale from '../locale'
import * as file from '../file'
import { main } from '../index'
import { saveJson } from 'local-files/localFiles'

export class Info
{
    constructor(ui)
    {
        this.win = ui.createWindow({
            id: 'info',
            title: locale.get('InfoTitle'),
            x: 10, y: 10,
            width: 220,
            resizable: false
        })
        this.win.open()
        this.content = this.win.content
        this.content.style.padding = '0em 1em 0.5em'
        this.content.style.color = '#eeeeee'
        this.name()
        this.frameNumber()
        this.frameSize()
        this.dice = new Dice(this.content)
        this.cursorPosition()
        this.cursorSize()
        this.zoom()
        this.changed()
        this.stateSetup()
    }

    editText(parent, label, text, styles, tooltip)
    {
        styles = styles || []
        const container = document.createElement('div')
        if (tooltip)
        {
            new Tooltip(container, Array.isArray(tooltip) ? '<div>' + tooltip[0] + '</div><div>' + locale.get('shortcut') + tooltip[1] + '</div>' : tooltip)
        }
        parent.appendChild(container)
        for (let style in styles)
        {
            container.style[style] = styles[style]
        }
        if (label)
        {
            const title = document.createElement('span')
            title.innerText = label
            container.appendChild(title)
        }
        const span = document.createElement('span')
        container.appendChild(span)
        span.style.borderBottom = 'dotted 1px #eeeeee'
        span.innerHTML = text
        return new EasyEdit(span)
    }

    stack(parent)
    {
        const stack = document.createElement('div')
        parent.appendChild(stack)
        stack.style.display = 'flex'
        stack.style.justifyContent = 'space-between'
        return stack
    }

    name()
    {
        this.nameEdit = this.editText(this.content, null, 'untitled', { 'textAlign': 'center', 'padding': '0.25em' }, locale.get('nameOfSprite'))
        this.nameEdit.on('success', async value => {
            if (!await file.exists(`${value}.json`))
            {
                const filename = `${value}.json`
                const old = state.lastFile
                await PixelEditor.save(filename)
                await file.unlink(old, filename)
                await file.unlink(old.replace('.', '.editor.'))
                state.lastFile = filename
            }
            else
            {
                this.nameEdit.object.innerText = PixelEditor.name
            }
        })
    }

    frameNumber()
    {
        this.frameNumberEdit = this.editText(this.content, 'frame: ', 0, { 'textAlign': 'center', 'padding': '0.25em' }, locale.get('frameNumber'))
        this.frameNumberEdit.on('success', (value) =>
        {
            const number = parseInt(value)
            if (!isNaN(number) && number >= 0 && number < PixelEditor.imageData.length)
            {
                PixelEditor.current = number
            }
        })
    }

    frameSize()
    {
        const stack = this.stack(this.content)
        this.frameWidthEdit = this.editText(stack, 'w: ', 15, null, locale.get('frameWidth'))
        this.frameWidthEdit.on('success', (value) =>
        {
            const width = parseInt(value)
            let relative
            const split = state.relative.split('-')
            if (split[1] === 'center')
            {
                relative = 'center'
            }
            else if (split[1] === 'right')
            {
                relative = 'right'
            }
            else
            {
                relative = 'left'
            }
            PixelEditor.adjustWidth(width, relative)
        })

        this.frameHeightEdit = this.editText(stack, 'h: ', 15, null, locale.get('frameHeight'))
        this.frameHeightEdit.on('success', (value) =>
        {
            const height = parseInt(value)
            let relative
            const split = state.relative.split('-')
            if (split[0] === 'center')
            {
                relative = 'center'
            }
            else if (split[0] === 'bottom')
            {
                relative = 'bottom'
            }
            else
            {
                relative = 'top'
            }
            PixelEditor.adjustHeight(height, relative)
        })
    }

    cursorPosition()
    {
        const stack = this.stack(this.content)
        this.cursorXEdit = this.editText(stack, 'x: ', 0, null, ['x position of cursor', 'left/right arrow'])
        this.cursorXEdit.on('success', (value) =>
        {
            const position = parseInt(value)
            const split = state.relative.split('-')
            state.cursorX = split[1] === 'right' ? PixelEditor.width - position - 1 : split[1] === 'center' ? position + PixelEditor.width / 2 : position
        })
        this.cursorYEdit = this.editText(stack, 'y: ', 0, null, ['y position of cursor', 'up/down arrow'])
        this.cursorYEdit.on('success', (value) =>
        {
            const position = parseInt(value)
            const split = state.relative.split('-')
            state.cursorY = split[0] === 'bottom' ? PixelEditor.height - position - 1 : split[0] === 'center' ? position + PixelEditor.height / 2 : position
        })
    }

    cursorSize()
    {
        const stack = this.stack(this.content)
        this.cursorSizeXEdit = this.editText(stack, 'w: ', 0, null, ['width of cursor', 'shift-left/right arrow'])
        this.cursorSizeXEdit.on('success', (value) => state.cursorSizeX = parseInt(value))
        this.cursorSizeYEdit = this.editText(stack, 'h: ', 0, null, ['height of cursor', 'shift-up/down arrow'])
        this.cursorSizeYEdit.on('success', (value) => state.cursorSizeY = parseInt(value))
    }

    zoom()
    {
        this.zoomEdit = this.editText(this.content, 'zoom: ', PixelEditor.zoom, { 'text-align': 'center'}, 'scale of sprite')
        this.zoomEdit.on('success', (value) => PixelEditor.zoom = parseInt(value))
    }

    changed()
    {
        this.nameEdit.object.innerText = PixelEditor.name
        this.frameNumberEdit.object.innerText = PixelEditor.current
        this.frameWidthEdit.object.innerText = PixelEditor.width
        this.frameHeightEdit.object.innerText = PixelEditor.height
        let x, y
        const split = state.relative.split('-')
        x = split[1] === 'left' ? state.cursorX : split[0] === 'right' ? PixelEditor.width - state.cursorX : state.cursorX - PixelEditor.width / 2
        y = split[0] === 'top' ? state.cursorY : split[0] === 'bottom' ? state.cursorY - PixelEditor.height + 1 : state.cursorY - PixelEditor.height / 2
        this.cursorXEdit.object.innerText = x
        this.cursorYEdit.object.innerText = y
        this.cursorSizeXEdit.object.innerText = state.cursorSizeX
        this.cursorSizeYEdit.object.innerText = state.cursorSizeY
        this.zoomEdit.object.innerText = PixelEditor.zoom
    }

    stateSetup()
    {
        state.on('cursorX', this.changed, this)
        state.on('cursorY', this.changed, this)
        state.on('cursorSizeX', this.changed, this)
        state.on('cursorSizeY', this.changed, this)
        state.on('last-file', this.changed, this)
        state.on('relative', this.changed, this)
        PixelEditor.on('current', this.changed, this)
        PixelEditor.on('changed', this.changed, this)
    }

    keydown() { }
}