import type { Window, WindowManager, WindowOptions } from 'simple-window-manager'

import type { App } from '../app'

/** Theme colors for simple-window-manager, which takes them as options rather than CSS. */
export const WINDOW_THEME: WindowOptions = {
    backgroundWindow: '#333333',
    backgroundTitlebarActive: '#555555',
    backgroundTitlebarInactive: '#444444',
    foregroundTitle: '#bbbbbb',
    foregroundButton: '#bbbbbb',
    titlebarHeight: '1.5rem',
    borderRadius: 0,
    maximizable: false,
}

/** A floating pane. Subclasses fill `content` and listen to the app for changes. */
export abstract class Pane {
    readonly win: Window
    readonly content: HTMLElement

    constructor(
        protected app: App,
        wm: WindowManager,
        readonly id: string,
        options: WindowOptions,
    ) {
        this.win = wm.createWindow({ id, openOnCreate: false, ...options })
        // simple-window-manager styles its own content element inline, so panes use a child
        this.content = document.createElement('div')
        this.content.classList.add('pane', 'pane-' + id)
        this.win.content.appendChild(this.content)
    }

    get sprite() {
        return this.app.sprite
    }

    get state() {
        return this.app.state
    }
}
