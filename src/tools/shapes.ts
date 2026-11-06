import { type Hex, isTransparent } from '../model/color'
import type { Frame } from '../model/frame'

export interface Block {
    x: number
    y: number
    color: Hex
}

/** Collects blocks by position; a later write to the same pixel wins, `false` removes it. */
class Blocks {
    private map = new Map<string, Hex | false>()

    set(x: number, y: number, color: Hex | false): void {
        this.map.set(x + ',' + y, color)
    }

    toArray(width: number, height: number): Block[] {
        const out: Block[] = []
        for (const [key, color] of this.map) {
            if (color === false) {
                continue
            }
            const [x, y] = key.split(',').map(Number)
            if (x >= 0 && y >= 0 && x < width && y < height) {
                out.push({ x, y, color })
            }
        }
        return out
    }
}

/**
 * A filled circle of diameter `size` centred on (x0, y0) (midpoint algorithm, ported from the old
 * Circle tool): outline in `foreground`, inside in `background`. Transparent colors are skipped.
 */
export function circle(x0: number, y0: number, size: number, foreground: Hex, background: Hex, width: number, height: number): Block[] {
    const blocks = new Blocks()
    if (size === 3) {
        blocks.set(x0, y0 - 1, foreground)
        blocks.set(x0, y0, background)
        blocks.set(x0, y0 + 1, foreground)
        blocks.set(x0 - 1, y0, foreground)
        blocks.set(x0 + 1, y0, foreground)
    } else {
        const even = size % 2 === 0 ? 1 : 0
        if (!isTransparent(background)) {
            let x = Math.ceil(size / 2) - 1
            let y = 0
            let decision = 1 - x
            while (x >= y) {
                for (let i = 0; i <= x; i++) {
                    blocks.set(x0 + x - i, y0 + y + even, background)
                    blocks.set(x0 - x - even + i, y0 + y + even, background)
                    blocks.set(x0 - y - even, y0 + x + even - i, background)
                    blocks.set(x0 - x - even + i, y0 - y, background)
                    blocks.set(x0 + x - i, y0 - y, background)
                }
                for (let i = 0; i <= y; i++) {
                    blocks.set(x0 + y - i, y0 + x + even, background)
                    blocks.set(x0 - y - even + i, y0 - x, background)
                    blocks.set(x0 + y - i, y0 - x, background)
                }
                y++
                if (decision <= 0) {
                    decision += 2 * y + 1
                } else {
                    x--
                    decision += 2 * (y - x) + 1
                }
            }
        }
        if (!isTransparent(foreground)) {
            let x = Math.ceil(size / 2) - 1
            let y = 0
            let decision = 1 - x
            while (x >= y) {
                blocks.set(x0 + x, y0 + y + even, foreground)
                blocks.set(x0 + y, y0 + x + even, foreground)
                blocks.set(x0 - y - even, y0 + x + even, foreground)
                blocks.set(x0 - x - even, y0 + y + even, foreground)
                blocks.set(x0 - x - even, y0 - y, foreground)
                blocks.set(x0 - y - even, y0 - x, foreground)
                blocks.set(x0 + y, y0 - x, foreground)
                blocks.set(x0 + x, y0 - y, foreground)
                y++
                if (decision <= 0) {
                    decision += 2 * y + 1
                } else {
                    x--
                    decision += 2 * (y - x) + 1
                }
            }
        }
    }
    if (size === 4) {
        blocks.set(x0 - 2, y0 - 1, false)
        blocks.set(x0 + 1, y0 - 1, false)
        blocks.set(x0 - 2, y0 + 2, false)
        blocks.set(x0 + 1, y0 + 2, false)
    }
    return blocks.toArray(width, height)
}

/** A filled ellipse `sizeX` by `sizeY` centred on (xc, yc), ported from the old Ellipse tool. */
export function ellipse(xc: number, yc: number, sizeX: number, sizeY: number, foreground: Hex, background: Hex, width: number, height: number): Block[] {
    const blocks = new Blocks()
    if (sizeX === 1) {
        const h = sizeY - 1
        for (let y = -h / 2; y <= h / 2; y++) {
            blocks.set(xc, Math.round(yc + y), foreground)
        }
    } else if (sizeY === 1) {
        const w = sizeX - 1
        for (let x = -w / 2; x <= w / 2; x++) {
            blocks.set(Math.round(xc + x), yc, foreground)
        }
    } else {
        const evenX = sizeX % 2 === 0 ? 1 : 0
        const evenY = sizeY % 2 === 0 ? 1 : 0
        const a = Math.floor(sizeX / 2)
        const b = Math.floor(sizeY / 2)
        const a2 = a * a
        const b2 = b * b
        const fa2 = 4 * a2
        const fb2 = 4 * b2
        const fill = (x: number, y: number) => {
            for (let xx = -x + evenX; xx <= x; xx++) {
                blocks.set(xc + xx, yc - y, background)
                blocks.set(xc + xx, yc + y - evenY, background)
            }
        }
        const edge = (x: number, y: number) => {
            blocks.set(xc - x + evenX, yc - y, foreground)
            blocks.set(xc + x, yc - y, foreground)
            blocks.set(xc - x + evenX, yc + y - evenY, foreground)
            blocks.set(xc + x, yc + y - evenY, foreground)
        }
        const passes: ((x: number, y: number) => void)[] = []
        if (!isTransparent(background)) {
            passes.push(fill)
        }
        if (!isTransparent(foreground)) {
            passes.push(edge)
        }
        for (const plot of passes) {
            for (let x = 0, y = b, sigma = 2 * b2 + a2 * (1 - 2 * b); b2 * x <= a2 * y; x++) {
                plot(x, y)
                if (sigma >= 0) {
                    sigma += fa2 * (1 - y)
                    y--
                }
                sigma += b2 * (4 * x + 6)
            }
            for (let x = a, y = 0, sigma = 2 * a2 + b2 * (1 - 2 * a); a2 * y <= b2 * x; y++) {
                plot(x, y)
                if (sigma >= 0) {
                    sigma += fb2 * (1 - x)
                    x--
                }
                sigma += a2 * (4 * y + 6)
            }
        }
    }
    return blocks.toArray(width, height)
}

/** Points on a line from (x0, y0) to (x1, y1), inclusive (Bresenham). */
export function line(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
    const points = []
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    for (;;) {
        points.push({ x: x0, y: y0 })
        if (x0 === x1 && y0 === y1) {
            break
        }
        const e2 = 2 * err
        if (e2 > -dy) {
            err -= dy
            x0 += sx
        }
        if (e2 < dx) {
            err += dx
            y0 += sy
        }
    }
    return points
}

/** Flood fill (4-connected) from (x, y) with `color`. Iterative, so large areas can't overflow the stack. */
export function floodFill(frame: Frame, x: number, y: number, color: Hex): number {
    const target = frame.get(x, y)
    if (target === color || !frame.inBounds(x, y)) {
        return 0
    }
    let count = 0
    const stack = [x, y]
    while (stack.length) {
        const py = stack.pop()!
        const px = stack.pop()!
        if (!frame.inBounds(px, py) || frame.get(px, py) !== target) {
            continue
        }
        frame.set(px, py, color)
        count++
        stack.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1)
    }
    return count
}

/** Normalise a cursor box whose size may be negative into x, y, width, height. */
export function box(x: number, y: number, sizeX: number, sizeY: number): { x: number; y: number; width: number; height: number } {
    return {
        x: sizeX < 0 ? x + sizeX + 1 : x,
        y: sizeY < 0 ? y + sizeY + 1 : y,
        width: Math.abs(sizeX),
        height: Math.abs(sizeY),
    }
}
