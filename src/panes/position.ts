import type { WindowManager } from 'simple-window-manager'

import type { App } from '../app'
import { type Icon, iconButton } from '../ui/dom'
import { Pane } from './pane'
import ICONS from '../../images/position.json'

/** Buttons that fit or move the draw pane's view of the sprite. */
export class Position extends Pane {
    constructor(app: App, wm: WindowManager) {
        super(app, wm, 'position', { title: 'Position', resizable: false, minWidth: '0', minHeight: '0' })
        this.content.style.display = 'flex'
        const actions: [string, () => void][] = [
            ['25% of screen size', () => app.draw.fit(0.25)],
            ['50% of screen size', () => app.draw.fit(0.5)],
            ['75% of screen size', () => app.draw.fit(0.75)],
            ['center in viewport', () => app.draw.center()],
            ['top-left in viewport', () => app.draw.corner()],
        ]
        actions.forEach(([title, action], i) => iconButton(this.content, ICONS.imageData[i] as Icon, title, action))
    }
}
