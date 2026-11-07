import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { label } from '../keys'
import type { Tool } from '../state'
import { type Icon, iconButton } from '../ui/dom'
import { Pane } from './pane'
import ICONS from '../../images/editor.json'

/** Tools in icon order (images/editor.json), with the key-binding name for each. */
const TOOLS: [Tool, string, string][] = [
    ['select', 'select', 'SelectTool'],
    ['paint', 'draw', 'PaintTool'],
    ['fill', 'fill', 'FillTool'],
    ['circle', 'circle', 'CircleTool'],
    ['ellipse', 'ellipse', 'EllipseTool'],
    ['line', 'line', 'LineTool'],
    ['crop', 'crop', 'CropTool'],
]

export class Toolbar extends Pane {
    private buttons = new Map<Tool, HTMLButtonElement>()

    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'toolbar', { title: '', resizable: false, minWidth: '0', minHeight: '0' })
        this.render()
        this.state.on('tool', this.select, this)
        this.state.on('keys', this.render, this)
    }

    private render(): void {
        this.content.replaceChildren()
        this.buttons.clear()
        const keys = this.state.get('keys')
        TOOLS.forEach(([tool, name, key], i) => {
            const shortcut = keys[key] ? ` (${label(keys[key])})` : ''
            const button = iconButton(this.content, ICONS.imageData[i] as Icon, `${name} mode${shortcut}`, () => this.state.set('tool', tool))
            button.style.display = 'block'
            this.buttons.set(tool, button)
        })
        this.select()
    }

    private select(): void {
        for (const [tool, button] of this.buttons) {
            button.classList.toggle('selected', tool === this.state.get('tool'))
        }
    }
}
