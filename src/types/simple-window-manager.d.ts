// Minimal types for the parts of simple-window-manager 2.x that pixel-editor uses.
declare module 'simple-window-manager' {
    import type { EventEmitter } from 'eventemitter3'

    export interface WindowOptions {
        id?: string
        title?: string
        x?: number
        y?: number
        width?: number
        height?: number
        minWidth?: string
        minHeight?: string
        modal?: boolean
        openOnCreate?: boolean
        resizable?: boolean
        maximizable?: boolean
        closable?: boolean
        movable?: boolean
        titlebar?: boolean
        titlebarHeight?: string
        noSnap?: boolean
        borderRadius?: number | string
        backgroundWindow?: string
        backgroundTitlebarActive?: string
        backgroundTitlebarInactive?: string
        foregroundButton?: string
        foregroundTitle?: string
        styles?: Record<string, string>
    }

    export interface WindowLayout {
        x?: number
        y?: number
        width?: number
        height?: number
        closed?: boolean
        order?: number
    }

    export class Window extends EventEmitter {
        readonly id: string
        readonly win: HTMLElement
        readonly content: HTMLElement
        readonly winTitlebar: HTMLElement
        readonly closed: boolean
        x: number
        y: number
        width: number
        height: number
        title: string
        open(noFocus?: boolean, noAnimate?: boolean): void
        close(noAnimate?: boolean): void
        focus(): void
        move(x: number, y: number): void
        resize(width: number, height: number): void
        center(win?: Window): void
        save(): WindowLayout
        load(data: WindowLayout): void
    }

    export interface WindowManagerOptions {
        parent?: HTMLElement
        quiet?: boolean
        keepInside?: boolean | 'horizontal' | 'vertical'
        snap?: boolean | { screen?: boolean; windows?: boolean; snap?: number; color?: string; spacing?: number }
        noAccelerator?: boolean
        styles?: Record<string, string>
        backgroundModal?: string
    }

    export class WindowManager {
        constructor(options?: WindowManagerOptions, windowOptions?: WindowOptions)
        readonly win: HTMLElement
        readonly wallpaper: HTMLElement
        readonly windows: Window[]
        createWindow(options?: WindowOptions): Window
        save(): Record<string, WindowLayout>
        load(data: Record<string, WindowLayout>): void
        getWindowById(id: string): Window | undefined
    }
}
