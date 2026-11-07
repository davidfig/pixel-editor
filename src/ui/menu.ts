import { label } from '../keys'
import { el } from './dom'

export type MenuEntry =
    | { label: string; command?: string; action?: () => void; checked?: () => boolean }
    | { separator: true }

export interface MenuGroup {
    label: string
    entries: () => MenuEntry[]
}

/**
 * A menu bar along the top of the window. Entries are rebuilt each time a menu opens,
 * so labels, checkmarks and key labels are always current.
 */
export class MenuBar {
    readonly element: HTMLElement
    private open: HTMLElement | null = null

    constructor(
        groups: MenuGroup[],
        private keys: () => Record<string, string>,
        private run: (command: string) => void,
    ) {
        this.element = el('nav', { parent: document.body, className: 'menubar' })
        for (const group of groups) {
            const button = el('button', { parent: this.element, text: group.label })
            button.addEventListener('pointerdown', (e) => {
                e.preventDefault()
                this.toggle(group, button)
            })
            button.addEventListener('pointerenter', () => {
                if (this.open && this.open.dataset.group !== group.label) {
                    this.show(group, button)
                }
            })
        }
        document.addEventListener('pointerdown', (e) => {
            if (this.open && !this.element.contains(e.target as Node)) {
                this.close()
            }
        })
        window.addEventListener('keydown', (e) => e.key === 'Escape' && this.close(), true)
    }

    get height(): number {
        return this.element.offsetHeight
    }

    private toggle(group: MenuGroup, button: HTMLElement): void {
        if (this.open?.dataset.group === group.label) {
            this.close()
        } else {
            this.show(group, button)
        }
    }

    private show(group: MenuGroup, button: HTMLElement): void {
        this.close()
        const menu = el('div', { parent: this.element, className: 'menu' })
        menu.dataset.group = group.label
        menu.style.left = button.offsetLeft + 'px'
        button.classList.add('open')
        const keys = this.keys()
        for (const entry of group.entries()) {
            if ('separator' in entry) {
                el('hr', { parent: menu })
                continue
            }
            const item = el('button', { parent: menu, className: 'menu-item' })
            el('span', { parent: item, className: 'check', text: entry.checked?.() ? '✓' : '' })
            el('span', { parent: item, text: entry.label })
            el('span', { parent: item, className: 'shortcut', text: entry.command && keys[entry.command] ? label(keys[entry.command]) : '' })
            item.addEventListener('click', () => {
                this.close()
                if (entry.command) {
                    this.run(entry.command)
                }
                entry.action?.()
            })
        }
        this.open = menu
    }

    private close(): void {
        this.open?.remove()
        this.open = null
        for (const b of this.element.querySelectorAll('button.open')) {
            b.classList.remove('open')
        }
    }
}
