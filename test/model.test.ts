import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { AnimationPlayer, type Animations } from '../src/model/animation'
import { hexToRgba, rgbaToHex } from '../src/model/color'
import { parseSprite, serializeSprite } from '../src/model/format'
import { Frame } from '../src/model/frame'
import { Sprite } from '../src/model/sprite'

const RED = 'ff0000ff'
const BLUE = '0000ffff'
const CLEAR = '00000000'

/** A 3x2 frame:  R . .
 *                . . B */
function sample(): Frame {
    const f = new Frame(3, 2)
    f.set(0, 0, RED)
    f.set(2, 1, BLUE)
    return f
}

describe('color', () => {
    it('round-trips hex and rgba', () => {
        expect(rgbaToHex(1, 2, 255, 128)).toBe('0102ff80')
        expect(hexToRgba('0102ff80')).toEqual({ r: 1, g: 2, b: 255, a: 128 })
    })
})

describe('Frame', () => {
    it('gets and sets pixels, ignoring out-of-bounds', () => {
        const f = sample()
        expect(f.get(0, 0)).toBe(RED)
        expect(f.get(1, 0)).toBe(CLEAR)
        expect(f.set(5, 5, RED)).toBe(false)
        expect(f.get(-1, 0)).toBe(CLEAR)
    })

    it('rotates clockwise and counter-clockwise', () => {
        const cw = sample().rotate()
        expect([cw.width, cw.height]).toEqual([2, 3])
        // clockwise: top-left goes to top-right
        expect(cw.get(1, 0)).toBe(RED)
        expect(cw.get(0, 2)).toBe(BLUE)
        const ccw = sample().rotate(true)
        expect(ccw.get(0, 2)).toBe(RED)
        expect(ccw.get(1, 0)).toBe(BLUE)
        expect(sample().rotate().rotate(true).equals(sample())).toBe(true)
    })

    it('flips', () => {
        const h = sample().flipHorizontal()
        expect(h.get(2, 0)).toBe(RED)
        expect(h.get(0, 1)).toBe(BLUE)
        const v = sample().flipVertical()
        expect(v.get(0, 1)).toBe(RED)
        expect(v.get(2, 0)).toBe(BLUE)
    })

    it('crops and resizes with alignment', () => {
        const c = sample().region(1, 1, 2, 1)
        expect([c.width, c.height]).toEqual([2, 1])
        expect(c.get(1, 0)).toBe(BLUE)
        const grown = sample().resize(5, 2, 'right')
        expect(grown.get(2, 0)).toBe(RED)
        expect(grown.get(4, 1)).toBe(BLUE)
        const shrunk = sample().resize(3, 1, 'left', 'bottom')
        expect(shrunk.get(2, 0)).toBe(BLUE)
    })

    it('round-trips through PNG', () => {
        const f = sample()
        expect(Frame.fromPngBase64(f.toPngBase64()).equals(f)).toBe(true)
    })
})

describe('format', () => {
    const dir = join(import.meta.dirname, '..', 'images')
    const files = readdirSync(dir).filter((n) => n.endsWith('.json') && !n.includes('.editor.'))

    it.each(files)('loads v1 file %s and round-trips it through v2', (file) => {
        const v1 = JSON.parse(readFileSync(join(dir, file), 'utf8'))
        const sprite = parseSprite(v1)
        expect(sprite.frames.length).toBe(v1.imageData.length)
        sprite.frames.forEach((f, i) => {
            expect(f.width).toBe(v1.imageData[i][0])
            expect(f.height).toBe(v1.imageData[i][1])
        })
        const v2 = JSON.parse(JSON.stringify(serializeSprite(sprite)))
        expect(v2.version).toBe(2)
        const again = parseSprite(v2)
        expect(again.name).toBe(sprite.name)
        expect(again.animations).toEqual(sprite.animations)
        again.frames.forEach((f, i) => expect(f.equals(sprite.frames[i])).toBe(true))
    })

    it('rejects other JSON and newer versions', () => {
        expect(() => parseSprite({ foo: 1 })).toThrow()
        expect(() => parseSprite({ version: 3, frames: [] })).toThrow(/newer/)
    })
})

describe('Sprite', () => {
    it('undoes and redoes per frame', () => {
        const s = new Sprite({ name: 't', frames: [sample()], animations: {} })
        s.checkpoint()
        s.set(1, 0, BLUE)
        s.flipHorizontal()
        expect(s.get(2, 0)).toBe(RED)
        s.undo()
        expect(s.get(1, 0)).toBe(BLUE)
        expect(s.get(0, 0)).toBe(RED)
        s.undo()
        expect(s.get(1, 0)).toBe(CLEAR)
        expect(s.canUndo).toBe(false)
        s.redo()
        expect(s.get(1, 0)).toBe(BLUE)
    })

    it('resizes height (the old .height bug)', () => {
        const s = new Sprite({ name: 't', frames: [sample()], animations: {} })
        s.resize(3, 4)
        expect(s.height).toBe(4)
        expect(s.get(2, 1)).toBe(BLUE)
    })

    it('adds, duplicates, moves and removes frames, keeping the selection', () => {
        const s = new Sprite({ name: 't', frames: [sample()], animations: {} })
        s.duplicateFrame()
        expect(s.frames.length).toBe(2)
        expect(s.current).toBe(1)
        s.set(1, 1, RED)
        expect(s.frames[0].get(1, 1)).toBe(CLEAR)
        s.addFrame(0)
        expect(s.current).toBe(0)
        s.current = 2
        s.moveFrame(2, 0)
        expect(s.current).toBe(0)
        expect(s.frame.get(1, 1)).toBe(RED)
        s.removeFrame(0)
        expect(s.frames.length).toBe(2)
        s.removeFrame(0)
        s.removeFrame(0)
        expect(s.frames.length).toBe(1)
    })
})

describe('AnimationPlayer', () => {
    const animations: Animations = {
        idle: [[0, 2], 1, 'loop'],
        once: [[[3, 4], 1]],
        jump: [[5, 1], ['link', 'idle']],
        rand: [['unique', [1, 2], 1], 'loop'],
    }

    it('plays durations and loops', () => {
        const p = new AnimationPlayer(animations, 100)
        p.play('idle')
        expect(p.frame).toBe(0)
        p.update(150)
        expect(p.frame).toBe(0)
        p.update(60)
        expect(p.frame).toBe(1)
        p.update(100)
        expect(p.frame).toBe(0)
        expect(p.playing).toBe(true)
    })

    it('expands frame lists and stops at the end', () => {
        const events: string[] = []
        const p = new AnimationPlayer(animations, 100, Math.random, (e) => events.push(e))
        p.play('once')
        expect(p.frame).toBe(3)
        p.update(100)
        expect(p.frame).toBe(4)
        p.update(100)
        expect(p.playing).toBe(false)
        expect(events).toContain('stop')
    })

    it('follows links', () => {
        const p = new AnimationPlayer(animations, 100)
        p.play('jump')
        p.update(100)
        expect(p.name).toBe('idle')
        expect(p.frame).toBe(0)
    })

    it('never repeats a unique pick', () => {
        let i = 0
        const sequence = [0, 0, 0.9, 0.9, 0.1]
        const p = new AnimationPlayer(animations, 100, () => sequence[i++ % sequence.length])
        p.play('rand')
        const first = p.frame
        p.update(100)
        expect(p.frame).not.toBe(first)
    })
})

describe('hsl', () => {
    it('round-trips colors through HSL', async () => {
        const { hexToHsl, hslToHex } = await import('../src/model/color')
        for (const hex of ['ff0000ff', '00ff0080', '123456ff', '808080ff', 'ffffff00', 'd2691eff']) {
            expect(hslToHex(hexToHsl(hex), parseInt(hex.slice(6), 16))).toBe(hex)
        }
    })
})
