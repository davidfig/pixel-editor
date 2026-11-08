import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { saveSpriteFile } from '../src/storage/disk'
import { Frame } from '../src/model/frame'
import type { SpriteData } from '../src/model/format'

/** A stand-in for the browser's FileSystemFileHandle that records what was written. */
function fakeHandle(name: string, { permission = 'granted', requested = 'granted', failWrite = false } = {}) {
    const written: string[] = []
    const handle = {
        kind: 'file',
        name,
        written,
        requests: 0,
        queryPermission: vi.fn(async () => permission),
        requestPermission: vi.fn(async () => {
            handle.requests++
            return requested
        }),
        createWritable: vi.fn(async () => {
            if (failWrite) {
                throw new DOMException('gone', 'NotFoundError')
            }
            let data = ''
            return {
                write: async (blob: Blob) => {
                    data = await blob.text()
                },
                close: async () => {
                    written.push(data)
                },
            }
        }),
    }
    return handle
}

const sprite: SpriteData = { name: 'hero', frames: [new Frame(2, 2)], animations: { idle: [[0, 0]] } }

let picker: ReturnType<typeof vi.fn>
let picked: ReturnType<typeof fakeHandle>

beforeEach(() => {
    picked = fakeHandle('picked.json')
    picker = vi.fn(async () => picked)
    vi.stubGlobal('window', { showSaveFilePicker: picker })
})

afterEach(() => vi.unstubAllGlobals())

describe('saveSpriteFile', () => {
    it('writes back to the file it was opened from, without asking', async () => {
        const handle = fakeHandle('hero.json')
        const result = await saveSpriteFile(sprite, handle as unknown as FileSystemFileHandle)

        expect(result).toEqual({ saved: true, handle })
        expect(picker).not.toHaveBeenCalled()
        expect(JSON.parse(handle.written[0])).toMatchObject({ version: 2, name: 'hero' })
    })

    it('asks for permission again after a reload, and writes once granted', async () => {
        const handle = fakeHandle('hero.json', { permission: 'prompt', requested: 'granted' })
        const result = await saveSpriteFile(sprite, handle as unknown as FileSystemFileHandle)

        expect(handle.requests).toBe(1)
        expect(result.handle).toBe(handle)
        expect(handle.written).toHaveLength(1)
        expect(picker).not.toHaveBeenCalled()
    })

    it('asks where to save when there is no file yet, and returns that file', async () => {
        const result = await saveSpriteFile(sprite, null)

        expect(picker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: 'hero.json' }))
        expect(result).toEqual({ saved: true, handle: picked })
        expect(picked.written).toHaveLength(1)
    })

    it('always asks with Save As, suggesting the current file name', async () => {
        const handle = fakeHandle('hero-v1.json')
        const result = await saveSpriteFile(sprite, handle as unknown as FileSystemFileHandle, true)

        expect(picker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: 'hero-v1.json' }))
        expect(handle.written).toHaveLength(0)
        expect(result.handle).toBe(picked)
    })

    it('asks where to save if permission is refused', async () => {
        const handle = fakeHandle('hero.json', { permission: 'prompt', requested: 'denied' })
        const result = await saveSpriteFile(sprite, handle as unknown as FileSystemFileHandle)

        expect(handle.written).toHaveLength(0)
        expect(picker).toHaveBeenCalled()
        expect(result.handle).toBe(picked)
    })

    it('asks where to save if the file was moved or deleted', async () => {
        const handle = fakeHandle('hero.json', { failWrite: true })
        const result = await saveSpriteFile(sprite, handle as unknown as FileSystemFileHandle)

        expect(picker).toHaveBeenCalled()
        expect(result.handle).toBe(picked)
    })

    it('reports nothing saved when the user cancels the picker', async () => {
        picker.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'))
        const result = await saveSpriteFile(sprite, null)

        expect(result).toEqual({ saved: false })
    })
})
