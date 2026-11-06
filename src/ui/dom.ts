/** Small DOM helpers shared by the panes. */

export interface ElOptions {
    parent?: HTMLElement
    className?: string
    text?: string
    title?: string
    style?: Partial<CSSStyleDeclaration>
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, options: ElOptions = {}): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag)
    if (options.className) {
        e.className = options.className
    }
    if (options.text !== undefined) {
        e.textContent = options.text
    }
    if (options.title) {
        e.title = options.title
    }
    if (options.style) {
        Object.assign(e.style, options.style)
    }
    options.parent?.appendChild(e)
    return e
}

/** An icon from a v1 sprite file's frame: [width, height, base64 PNG]. */
export type Icon = [number, number, string]

export function iconUrl(icon: Icon): string {
    return 'data:image/png;base64,' + icon[2]
}

/** A button showing a pixel-art icon at 2x. */
export function iconButton(parent: HTMLElement, icon: Icon, title: string, onClick: () => void): HTMLButtonElement {
    const button = el('button', { parent, className: 'icon-button', title })
    const img = el('img', { parent: button })
    img.src = iconUrl(icon)
    img.width = icon[0] * 2
    img.height = icon[1] * 2
    button.addEventListener('click', onClick)
    return button
}

export function setIcon(button: HTMLButtonElement, icon: Icon): void {
    button.querySelector('img')!.src = iconUrl(icon)
}

/**
 * A labelled inline number/text field. Enter or blur commits; Escape reverts.
 * Keys typed here don't reach the editor's shortcuts.
 */
export function field(parent: HTMLElement, label: string, title: string, onCommit: (value: string) => void, width = '3em'): HTMLInputElement {
    const wrap = el('label', { parent, className: 'field', title })
    if (label) {
        el('span', { parent: wrap, text: label })
    }
    const input = el('input', { parent: wrap, style: { width } })
    let original = ''
    input.addEventListener('focus', () => {
        original = input.value
        input.select()
    })
    input.addEventListener('keydown', (e) => {
        e.stopPropagation()
        if (e.key === 'Enter') {
            input.blur()
        } else if (e.key === 'Escape') {
            input.value = original
            input.blur()
        }
    })
    input.addEventListener('change', () => onCommit(input.value))
    return input
}

/** Set a field's value unless the user is typing in it. */
export function setField(input: HTMLInputElement, value: string | number): void {
    if (document.activeElement !== input) {
        input.value = String(value)
    }
}

/** Stop key events in form controls from triggering editor shortcuts. */
export function isolateKeys(element: HTMLElement): void {
    element.addEventListener('keydown', (e) => e.stopPropagation())
    element.addEventListener('keyup', (e) => e.stopPropagation())
}

/** Checkerboard background for showing transparency behind swatches. */
export const CHECKER_CSS = 'repeating-conic-gradient(#999999 0% 25%, #e6e6e6 0% 50%) 0 0 / 10px 10px'
