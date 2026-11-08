import { parseSprite, serializeSprite, type SpriteData } from '../model/format'

// File System Access API (Chrome and Edge). Not in TypeScript's DOM lib yet.
interface FilePickerType {
    description: string
    accept: Record<string, string[]>
}
type PermissionMode = { mode: 'read' | 'readwrite' }
declare global {
    interface Window {
        showOpenFilePicker?: (options: { types?: FilePickerType[]; multiple?: boolean }) => Promise<FileSystemFileHandle[]>
        showSaveFilePicker?: (options: { suggestedName?: string; types?: FilePickerType[] }) => Promise<FileSystemFileHandle>
        showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
    }
    interface FileSystemDirectoryHandle {
        values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>
    }
    interface FileSystemHandle {
        queryPermission?(descriptor: PermissionMode): Promise<PermissionState>
        requestPermission?(descriptor: PermissionMode): Promise<PermissionState>
    }
}

const JSON_TYPE: FilePickerType = { description: 'Pixel sprite', accept: { 'application/json': ['.json'] } }
const PNG_TYPE: FilePickerType = { description: 'PNG image', accept: { 'image/png': ['.png'] } }

/** A sprite read from disk, with the file it came from when the browser can write back to it. */
export interface OpenedSprite {
    sprite: SpriteData
    handle?: FileSystemFileHandle
}

export interface SaveResult {
    saved: boolean
    /** The file the sprite now lives in (not set when the browser could only download it). */
    handle?: FileSystemFileHandle
}

/** Ask the user for a sprite file and parse it. Resolves null if they cancel. */
export async function openSpriteFile(): Promise<OpenedSprite | null> {
    const picked = await pickFile()
    if (!picked) {
        return null
    }
    const sprite = parseSprite(JSON.parse(await picked.file.text()))
    if (sprite.name === 'untitled') {
        sprite.name = picked.file.name.replace(/\.json$/i, '')
    }
    return { sprite, handle: picked.handle }
}

/**
 * Save a sprite. With a handle (and saveAs false), writes straight back to that file; otherwise, or if that
 * file can't be written (permission refused, or it was moved or deleted), asks where to save it.
 */
export async function saveSpriteFile(sprite: SpriteData, handle?: FileSystemFileHandle | null, saveAs = false): Promise<SaveResult> {
    const blob = new Blob([JSON.stringify(serializeSprite(sprite))], { type: 'application/json' })
    if (handle && !saveAs) {
        if ((await canWrite(handle)) && (await write(handle, blob))) {
            return { saved: true, handle }
        }
    }
    const suggestedName = handle?.name ?? sprite.name + '.json'
    if (window.showSaveFilePicker) {
        let picked: FileSystemFileHandle
        try {
            picked = await window.showSaveFilePicker({ suggestedName, types: [JSON_TYPE] })
        } catch {
            return { saved: false }
        }
        return (await write(picked, blob)) ? { saved: true, handle: picked } : { saved: false }
    }
    download(blob, suggestedName)
    return { saved: true }
}

export async function savePng(blob: Blob, name: string): Promise<boolean> {
    name = name.endsWith('.png') ? name : name + '.png'
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({ suggestedName: name, types: [PNG_TYPE] })
            return await write(handle, blob)
        } catch {
            return false
        }
    }
    download(blob, name)
    return true
}

/** Every sprite file in a folder the user picks (Chrome and Edge only). */
export async function openSpriteFolder(): Promise<{ file: string; sprite: SpriteData; modified: number; handle: FileSystemFileHandle }[] | null> {
    if (!window.showDirectoryPicker) {
        return null
    }
    let dir: FileSystemDirectoryHandle
    try {
        dir = await window.showDirectoryPicker({ mode: 'read' })
    } catch {
        return null
    }
    const out = []
    for await (const entry of dir.values()) {
        if (entry.kind !== 'file' || !entry.name.endsWith('.json') || entry.name.includes('.editor.')) {
            continue
        }
        try {
            const handle = entry as FileSystemFileHandle
            const file = await handle.getFile()
            out.push({ file: entry.name, sprite: parseSprite(JSON.parse(await file.text())), modified: file.lastModified, handle })
        } catch {
            // not a sprite file
        }
    }
    return out
}

/** Whether the page may write to this file, asking the user if needed. */
async function canWrite(handle: FileSystemFileHandle): Promise<boolean> {
    try {
        const mode: PermissionMode = { mode: 'readwrite' }
        if ((await handle.queryPermission?.(mode)) === 'granted') {
            return true
        }
        return (await handle.requestPermission?.(mode)) === 'granted'
    } catch {
        return false
    }
}

async function write(handle: FileSystemFileHandle, blob: Blob): Promise<boolean> {
    try {
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        return true
    } catch {
        return false
    }
}

async function pickFile(): Promise<{ file: File; handle?: FileSystemFileHandle } | null> {
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({ types: [JSON_TYPE] })
            return { file: await handle.getFile(), handle }
        } catch {
            return null
        }
    }
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,application/json'
        input.addEventListener('change', () => resolve(input.files?.[0] ? { file: input.files[0] } : null))
        input.addEventListener('cancel', () => resolve(null))
        input.click()
    })
}

function download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}
