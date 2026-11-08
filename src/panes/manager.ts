import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { Sprite } from '../model/sprite'
import { openSpriteFolder } from '../storage/disk'
import { type SpriteSummary, deleteSprite, listSprites, newId, saveHandle, saveSprite } from '../storage/library'
import { confirm } from '../ui/dialog'
import { type Icon, el, iconButton } from '../ui/dom'
import { Pane } from './pane'
import ICONS from '../../images/manager.json'

const icon = (i: number) => ICONS.imageData[i] as Icon

/** The sprite library: every sprite saved in this browser. Click one to open it. */
export class Manager extends Pane {
    private box: HTMLElement
    private imagesButton: HTMLButtonElement
    private sortButton: HTMLButtonElement
    private queued = false

    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'manager', { title: 'Sprites', width: 200, height: 250, minWidth: '165px' })
        const toolbar = el('div', { parent: this.content, className: 'buttons' })
        const manager = this.state.get('manager')
        const update = () => {
            this.state.touch('manager')
            this.refresh()
        }
        if (window.showDirectoryPicker) {
            iconButton(toolbar, icon(4), 'import every sprite in a folder', () => this.importFolder())
        }
        iconButton(toolbar, icon(1), 'larger thumbnails', () => {
            manager.zoom++
            update()
        })
        iconButton(toolbar, icon(2), 'smaller thumbnails', () => {
            manager.zoom = Math.max(1, manager.zoom - 1)
            update()
        })
        this.imagesButton = iconButton(toolbar, icon(0), 'show images or names', () => {
            manager.images = !manager.images
            update()
        })
        this.sortButton = iconButton(toolbar, icon(3), 'sort by name or by last modified', () => {
            manager.alphabetical = !manager.alphabetical
            update()
        })
        this.box = el('div', { parent: this.content, className: 'manager-list' })
        app.on('sprite', () => this.refresh())
        this.win.on('open', () => this.refresh())
        // the library changes on every autosave; refresh at most every few seconds while open
        setInterval(() => !this.win.closed && this.refresh(), 3000)
        this.refresh()
    }

    refresh(): void {
        if (this.queued) {
            return
        }
        this.queued = true
        listSprites().then((sprites) => {
            this.queued = false
            this.render(sprites)
        })
    }

    private render(sprites: SpriteSummary[]): void {
        const { images, alphabetical, zoom } = this.state.get('manager')
        this.imagesButton.classList.toggle('selected', images)
        this.sortButton.classList.toggle('selected', alphabetical)
        sprites.sort(alphabetical ? (a, b) => a.name.localeCompare(b.name) : (a, b) => b.modified - a.modified)
        this.box.classList.toggle('images', images)
        this.box.replaceChildren()
        for (const s of sprites) {
            const item = el('div', { parent: this.box, className: 'manager-item', title: `${s.name} (${new Date(s.modified).toLocaleString()})` })
            item.classList.toggle('selected', s.id === this.app.spriteId)
            if (images) {
                const img = el('img', { parent: item })
                img.src = 'data:image/png;base64,' + s.png
                img.style.width = s.width * zoom + 'px'
                img.style.height = s.height * zoom + 'px'
            } else {
                el('span', { parent: item, text: s.name })
            }
            item.addEventListener('click', () => this.app.load(s.id))
            item.addEventListener('contextmenu', async (e) => {
                e.preventDefault()
                if (s.id !== this.app.spriteId && (await confirm('Delete Sprite?', `Delete ${s.name} from this browser? This can't be undone.`, 'Delete'))) {
                    await deleteSprite(s.id)
                    this.state.forget(s.id)
                    this.refresh()
                }
            })
        }
    }

    private async importFolder(): Promise<void> {
        const files = await openSpriteFolder()
        if (!files) {
            return
        }
        const existing = new Set((await listSprites()).map((s) => s.name))
        let count = 0
        for (const { sprite, handle } of files) {
            if (!existing.has(sprite.name)) {
                const id = newId()
                await saveSprite(id, new Sprite(sprite), { current: 0 })
                await saveHandle(id, handle)
                count++
            }
        }
        this.refresh()
        if (files.length && !count) {
            alert('Every sprite in that folder is already in the library.')
        }
    }
}
