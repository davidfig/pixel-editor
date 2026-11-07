import { describe, expect, it } from 'vitest'

import { Frame } from '../src/model/frame'
import { box, circle, ellipse, floodFill, line } from '../src/tools/shapes'

const FG = 'ffffffff'
const BG = '00000000'
const RED = 'ff0000ff'

describe('shapes', () => {
    it('draws a Bresenham line including both ends', () => {
        expect(line(0, 0, 3, 1)).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }])
        expect(line(2, 2, 2, 2)).toEqual([{ x: 2, y: 2 }])
    })

    it('normalises negative boxes to include the cursor', () => {
        expect(box(5, 5, 3, 2)).toEqual({ x: 5, y: 5, width: 3, height: 2 })
        expect(box(5, 5, -3, -2)).toEqual({ x: 3, y: 4, width: 3, height: 2 })
    })

    it('makes a size-3 circle a plus sign, with a transparent centre skipped', () => {
        const blocks = circle(5, 5, 3, FG, BG, 20, 20)
        expect(blocks.filter((b) => b.color === FG).length).toBe(4)
    })

    it('draws a symmetric circle outline and clips it to the sprite', () => {
        const blocks = circle(5, 5, 7, FG, BG, 20, 20)
        const set = new Set(blocks.map((b) => `${b.x},${b.y}`))
        for (const b of blocks) {
            expect(set.has(`${10 - b.x},${b.y}`)).toBe(true)
            expect(set.has(`${b.x},${10 - b.y}`)).toBe(true)
        }
        expect(circle(0, 0, 7, FG, BG, 20, 20).every((b) => b.x >= 0 && b.y >= 0)).toBe(true)
    })

    it('fills an ellipse inside with the background color', () => {
        const blocks = ellipse(5, 5, 7, 5, FG, RED, 20, 20)
        expect(blocks.some((b) => b.x === 5 && b.y === 5 && b.color === RED)).toBe(true)
        expect(blocks.some((b) => b.color === FG)).toBe(true)
    })

    it('flood fills a bounded region only', () => {
        const f = new Frame(5, 5)
        for (let y = 0; y < 5; y++) {
            f.set(2, y, RED)
        }
        expect(floodFill(f, 0, 0, FG)).toBe(10)
        expect(f.get(1, 4)).toBe(FG)
        expect(f.get(3, 0)).toBe(BG)
        expect(floodFill(f, 0, 0, FG)).toBe(0)
    })

    it('flood fills a large frame without overflowing the stack', () => {
        const f = new Frame(512, 512)
        expect(floodFill(f, 0, 0, FG)).toBe(512 * 512)
    })
})
