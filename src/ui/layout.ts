import { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { exportDialog } from '../export'
import { Animation } from '../panes/animation'
import { Frames } from '../panes/frames'
import { Info } from '../panes/info'
import { Keyboard } from '../panes/keyboard'
import { Manager } from '../panes/manager'
import { Palette } from '../panes/palette'
import { type Pane, WINDOW_THEME } from '../panes/pane'
import { Picker } from '../panes/picker'
import { Position } from '../panes/position'
import { Toolbar } from '../panes/toolbar'
import type { PaneLayout } from '../state'
import { listSprites } from '../storage/library'
import { MenuBar, type MenuEntry } from './menu'

/** Panes in menu order, with their key-binding names for show/hide. */
const PANES = [
    ['frames', 'Frames', 'FramesWindow'],
    ['toolbar', 'Toolbar', 'ToolbarWindow'],
    ['palette', 'Palette', 'PaletteWindow'],
    ['picker', 'Picker', 'PickerWindow'],
    ['info', 'Info', 'InfoWindow'],
    ['animation', 'Animation', 'AnimationWindow'],
    ['position', 'Position', 'PositionWindow'],
    ['manager', 'Sprites', 'ManagerWindow'],
    ['keyboard', 'Keyboard', 'KeyboardWindow'],
] as const

/** Default positions (ported from the old views.js). `closed` hides every pane, for the second view. */
function defaultLayout(top: number, closed = false): Record<string, PaneLayout> {
    const space = 5
    const w = window.innerWidth
    const h = window.innerHeight
    return {
        frames: { x: space, y: h - space - 200, width: 200, height: 200, closed },
        toolbar: { x: space, y: top + space, closed },
        palette: { x: w - space - 200, y: top + space * 2 + 370, width: 200, height: 150, closed },
        picker: { x: w - space - 200, y: top + space, width: 200, height: 370, closed },
        info: { x: w - space * 2 - 200 - 220, y: h - space - 260, closed },
        animation: { x: w - space * 2 - 235 - 200, y: top + space, width: 230, height: 260, closed: true },
        position: { x: w - space - 200, y: h - space - 60, closed },
        manager: { x: space * 2 + 55, y: top + space, width: 200, height: 250, closed: true },
        keyboard: { x: w / 2 - 200, y: h / 2 - 200, width: 400, height: 400, closed: true },
    }
}

/** Creates the window manager, panes and menu, and saves pane layouts to state. */
export class Layout {
    readonly wm: WindowManager
    readonly panes: Record<string, Pane>
    readonly menu: MenuBar
    private loading = false

    constructor(private app: App) {
        const state = app.state
        this.menu = new MenuBar(this.menuGroups(), () => state.get('keys'), (command) => app.commands[command]?.())
        const top = this.menu.height

        const container = document.createElement('div')
        Object.assign(container.style, { position: 'fixed', left: '0', right: '0', bottom: '0', top: top + 'px' })
        document.body.appendChild(container)
        this.wm = new WindowManager({ parent: container, quiet: true, noAccelerator: true, snap: { spacing: 5 } }, WINDOW_THEME)
        // the draw canvas sits under the panes
        this.wm.wallpaper.appendChild(app.draw.canvas)
        app.draw.canvas.style.top = top + 'px'

        this.panes = {
            frames: new Frames(app, this.wm),
            toolbar: new Toolbar(app, this.wm),
            palette: new Palette(app, this.wm),
            picker: new Picker(app, this.wm),
            info: new Info(app, this.wm),
            animation: new Animation(app, this.wm),
            position: new Position(app, this.wm),
            manager: new Manager(app, this.wm),
            keyboard: new Keyboard(app, this.wm),
        }

        if (!state.get('views').length) {
            state.set('views', [defaultLayout(0), defaultLayout(0, true)])
        }
        this.load()
        for (const pane of Object.values(this.panes)) {
            for (const event of ['move-end', 'resize-end', 'open', 'close']) {
                pane.win.on(event, () => this.save())
            }
        }
        this.registerCommands()
        this.refreshRecent()
        app.on('sprite', () => this.refreshRecent())
    }

    private get view(): Record<string, PaneLayout> {
        const s = this.app.state
        return s.get('views')[s.get('view')] ?? {}
    }

    private load(): void {
        this.loading = true
        const view = this.view
        const defaults = defaultLayout(0)
        for (const [id, pane] of Object.entries(this.panes)) {
            pane.win.load({ ...defaults[id], ...view[id] })
        }
        this.loading = false
    }

    private save(): void {
        if (this.loading) {
            return
        }
        const s = this.app.state
        const views = s.get('views')
        views[s.get('view')] = this.wm.save()
        s.touch('views')
    }

    private toggle(id: string): void {
        const win = this.panes[id].win
        if (win.closed) {
            win.open()
        } else {
            win.close()
        }
    }

    private changeView(delta: number): void {
        const s = this.app.state
        const count = s.get('views').length
        s.set('view', (s.get('view') + delta + count) % count)
        this.load()
    }

    private resetView(): void {
        const s = this.app.state
        s.get('views')[s.get('view')] = defaultLayout(0)
        s.touch('views')
        this.load()
    }

    private registerCommands(): void {
        const c = this.app.commands
        for (const [id, , command] of PANES) {
            c[command] = () => this.toggle(id)
        }
        c.NextView = () => this.changeView(1)
        c.PreviousView = () => this.changeView(-1)
        c.ResetWindows = () => this.resetView()
        c.Export = () => exportDialog(this.app)
    }

    private menuGroups() {
        const app = this.app
        const sep: MenuEntry = { separator: true }
        return [
            {
                label: 'File',
                entries: () => {
                    const entries: MenuEntry[] = [
                        { label: 'New', command: 'New' },
                        { label: 'Open File…', command: 'Open' },
                        { label: 'Save File As…', command: 'Save' },
                        { label: 'Export PNG…', command: 'Export' },
                    ]
                    const recent = this.recentNames.filter((r) => r.id !== app.spriteId)
                    if (recent.length) {
                        entries.push(sep, ...recent.map((r) => ({ label: r.name, action: () => app.load(r.id) })))
                    }
                    this.refreshRecent()
                    return entries
                },
            },
            {
                label: 'Edit',
                entries: (): MenuEntry[] => [
                    { label: 'Undo', command: 'Undo' },
                    { label: 'Redo', command: 'Redo' },
                    sep,
                    { label: 'Copy', command: 'Copy' },
                    { label: 'Cut', command: 'Cut' },
                    { label: 'Paste', command: 'Paste' },
                    sep,
                    { label: 'Select All', command: 'SelectAll' },
                ],
            },
            {
                label: 'Draw',
                entries: (): MenuEntry[] => {
                    const tool = app.state.get('tool')
                    return [
                        { label: 'Draw', command: 'Draw' },
                        { label: 'Erase', command: 'Erase' },
                        { label: 'Sample Color', command: 'Dropper' },
                        { label: 'Reset Cursor', command: 'Clear' },
                        { label: 'Swap Foreground/Background', command: 'SwapForeground' },
                        sep,
                        ...(['Select', 'Paint', 'Fill', 'Circle', 'Ellipse', 'Line', 'Crop'] as const).map((t) => ({
                            label: t + ' Tool',
                            command: t + 'Tool',
                            checked: () => tool === t.toLowerCase(),
                        })),
                    ]
                },
            },
            {
                label: 'View',
                entries: (): MenuEntry[] => [
                    { label: 'Next View', command: 'NextView' },
                    { label: 'Previous View', command: 'PreviousView' },
                    { label: 'Reset Panes', command: 'ResetWindows' },
                    sep,
                    ...PANES.map(([id, name, command]) => ({ label: name, command, checked: () => !this.panes[id].win.closed })),
                ],
            },
            {
                label: 'Frames',
                entries: (): MenuEntry[] => [
                    { label: 'New Frame', command: 'NewFrame' },
                    { label: 'Duplicate Frame', command: 'Duplicate' },
                    { label: 'Delete Frame', command: 'Delete' },
                    sep,
                    { label: 'Next Frame', command: 'NextFrame' },
                    { label: 'Previous Frame', command: 'PreviousFrame' },
                    sep,
                    { label: 'Rotate Clockwise', command: 'Clockwise' },
                    { label: 'Rotate Counter-Clockwise', command: 'CounterClockwise' },
                    { label: 'Flip Horizontal', command: 'FlipHorizontal' },
                    { label: 'Flip Vertical', command: 'FlipVertical' },
                ],
            },
        ]
    }

    private recentNames: { id: string; name: string }[] = []

    /** Recent files' names come from the library, which is async; refreshed each time the File menu opens. */
    private refreshRecent(): void {
        listSprites().then((all) => {
            const byId = new Map(all.map((s) => [s.id, s.name]))
            this.recentNames = this.app.state
                .get('recent')
                .filter((id) => byId.has(id))
                .map((id) => ({ id, name: byId.get(id)! }))
        })
    }
}
