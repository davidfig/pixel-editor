import { EventEmitter } from 'eventemitter3'

import DEFAULT_KEYS from '../data/default-keys.json'
import type { Hex } from './model/color'

export type Tool = 'paint' | 'select' | 'fill' | 'circle' | 'ellipse' | 'line' | 'crop'
export type Relative = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

/** Saved position of one pane, as simple-window-manager's save()/load() use it. */
export interface PaneLayout {
    x?: number
    y?: number
    width?: number
    height?: number
    closed?: boolean
    order?: number
}

export interface AppState {
    tool: Tool
    cursorX: number
    cursorY: number
    cursorSizeX: number
    cursorSizeY: number
    foreground: Hex
    background: Hex
    isForeground: boolean
    /** Library id of the sprite being edited. */
    spriteId: string | null
    /** Most recently opened sprite ids, newest first. */
    recent: string[]
    manager: { zoom: number; images: boolean; alphabetical: boolean }
    /** Saved pane layouts (window id -> layout); Tab switches between them. */
    views: Record<string, PaneLayout>[]
    view: number
    relative: Relative
    keys: Record<string, string>
}

export const DEFAULT_STATE: AppState = {
    tool: 'paint',
    cursorX: 0,
    cursorY: 0,
    cursorSizeX: 1,
    cursorSizeY: 1,
    foreground: 'ffffffff',
    background: '00000000',
    isForeground: true,
    spriteId: null,
    recent: [],
    manager: { zoom: 4, images: true, alphabetical: true },
    views: [],
    view: 0,
    relative: 'top-left',
    keys: DEFAULT_KEYS,
}

const RECENT_SIZE = 10

type StateEvents = { [K in keyof AppState]: [] } & { change: [] }

/**
 * App-wide settings and editor state. `set()` emits an event named after the key
 * (plus `change`) and marks the state dirty for autosave.
 */
export class State extends EventEmitter<StateEvents> {
    dirty = false
    private state: AppState

    constructor(saved?: Partial<AppState> | null) {
        super()
        this.state = { ...structuredClone(DEFAULT_STATE), ...(saved ?? {}) }
        // keys added since the state was saved get their defaults
        this.state.keys = { ...DEFAULT_KEYS, ...this.state.keys }
        this.state.manager = { ...DEFAULT_STATE.manager, ...this.state.manager }
    }

    get<K extends keyof AppState>(key: K): AppState[K] {
        return this.state[key]
    }

    set<K extends keyof AppState>(key: K, value: AppState[K]): void {
        if (this.state[key] !== value) {
            this.state[key] = value
            this.touch(key)
        }
    }

    /** For in-place changes to object values (views, manager): mark dirty and emit. */
    touch(key: keyof AppState): void {
        this.dirty = true
        this.emit(key)
        this.emit('change')
    }

    /** The active color: foreground or background, depending on isForeground. */
    get color(): Hex {
        return this.state.isForeground ? this.state.foreground : this.state.background
    }
    set color(value: Hex) {
        this.set(this.state.isForeground ? 'foreground' : 'background', value)
    }

    setCursor(x: number, y: number, sizeX = this.state.cursorSizeX, sizeY = this.state.cursorSizeY): void {
        this.set('cursorX', x)
        this.set('cursorY', y)
        this.set('cursorSizeX', sizeX)
        this.set('cursorSizeY', sizeY)
    }

    /** Record a sprite as opened. */
    open(id: string): void {
        this.state.recent = [id, ...this.state.recent.filter((r) => r !== id)].slice(0, RECENT_SIZE)
        this.set('spriteId', id)
        this.touch('recent')
    }

    forget(id: string): void {
        this.state.recent = this.state.recent.filter((r) => r !== id)
        this.touch('recent')
    }

    resetKeys(): void {
        this.set('keys', { ...DEFAULT_KEYS })
    }

    toJSON(): AppState {
        return this.state
    }
}
