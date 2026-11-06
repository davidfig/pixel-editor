const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform)

/** Key names used in accelerator strings, mapped to KeyboardEvent.key values (lowercased). */
const ALIASES: Record<string, string> = {
    space: ' ',
    esc: 'escape',
    period: '.',
    comma: ',',
    plus: '+',
    del: 'delete',
    return: 'enter',
}

interface Parsed {
    key: string
    ctrl: boolean
    meta: boolean
    alt: boolean
    shift: boolean
}

/**
 * Parse an Electron-style accelerator such as "CommandOrControl+Shift+Z", "shift+tab" or "space".
 * Alternatives are separated by "|".
 */
export function parseAccelerator(accelerator: string): Parsed[] {
    return accelerator
        .split('|')
        .map((a) => a.trim())
        .filter(Boolean)
        .map((a) => {
            const parts = a.toLowerCase().split('+')
            // "ctrl++" means the plus key
            const key = parts.at(-1) === '' ? '+' : parts.pop()!
            const mods = new Set(parts.filter(Boolean))
            const commandOrControl = mods.has('commandorcontrol') || mods.has('cmdorctrl')
            return {
                key: ALIASES[key] ?? key,
                ctrl: mods.has('ctrl') || mods.has('control') || (commandOrControl && !IS_MAC),
                meta: mods.has('command') || mods.has('cmd') || mods.has('meta') || (commandOrControl && IS_MAC),
                alt: mods.has('alt') || mods.has('option'),
                shift: mods.has('shift'),
            }
        })
}

export function matches(e: KeyboardEvent, accelerator: string): boolean {
    const key = e.key.toLowerCase()
    return parseAccelerator(accelerator).some(
        (p) => p.key === key && p.ctrl === e.ctrlKey && p.meta === e.metaKey && p.alt === e.altKey && p.shift === e.shiftKey,
    )
}

/** Human-readable label for menus and the keyboard pane, e.g. "⌘⇧Z" or "Ctrl+Shift+Z". */
export function label(accelerator: string): string {
    const first = parseAccelerator(accelerator)[0]
    if (!first) {
        return ''
    }
    const key = first.key === ' ' ? 'Space' : first.key.length === 1 ? first.key.toUpperCase() : first.key[0].toUpperCase() + first.key.slice(1)
    if (IS_MAC) {
        return (first.ctrl ? '⌃' : '') + (first.alt ? '⌥' : '') + (first.shift ? '⇧' : '') + (first.meta ? '⌘' : '') + key
    }
    return [first.ctrl && 'Ctrl', first.alt && 'Alt', first.shift && 'Shift', first.meta && 'Win', key].filter(Boolean).join('+')
}

/** Accelerator string for a key event, for recording new bindings. */
export function fromEvent(e: KeyboardEvent): string | null {
    const key = e.key.toLowerCase()
    if (['control', 'shift', 'alt', 'meta'].includes(key)) {
        return null
    }
    const name = key === ' ' ? 'space' : key
    return [e.ctrlKey && 'ctrl', e.metaKey && 'command', e.altKey && 'alt', e.shiftKey && 'shift', name].filter(Boolean).join('+')
}
