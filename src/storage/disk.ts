import { parseSprite, serializeSprite, type SpriteData } from '../model/format'

// File System Access API (Chrome and Edge). Not in TypeScript's DOM lib yet.
interface FilePickerType {
    description: string
    accept: Record<string, string[]>
}
declare global {
    interface Window {
        showOpenFilePicker?: (options: { types?: FilePickerType[]; multiple?: boolean }) => Promise<FileSystemFileHandle[]>
        showSaveFilePicker?: (options: { suggestedName?: string; types?: FilePickerType[] }) => Promise<FileSystemFileHandle>
        showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
    }
    interface FileSystemDirectoryHandle {
        values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>
    }
}

const JSON_TYPE: FilePickerType = { description: 'Pixel sprite', accept: { 'application/json': ['.json'] } }
const PNG_TYPE: FilePickerType = { description: 'PNG image', accept: { 'image/png': ['.png'] } }

/** Ask the user for a sprite file and parse it. Resolves null if they cancel. */
export async function openSpriteFile(): Promise<SpriteData | null> {
    const file = await pickFile()
    if (!file) {
        return null
    }
    const sprite = parseSprite(JSON.parse(await file.text()))
    if (sprite.name === 'untitled') {
        sprite.name = file.name.replace(/\.json$/i, '')
    }
    return sprite
}

export async function saveSpriteFile(sprite: SpriteData): Promise<boolean> {
    const json = JSON.stringify(serializeSprite(sprite))
    return saveBlob(new Blob([json], { type: 'application/json' }), sprite.name + '.json', JSON_TYPE)
}

export async function savePng(blob: Blob, name: string): Promise<boolean> {
    return saveBlob(blob, name.endsWith('.png') ? name : name + '.png', PNG_TYPE)
}

/** Every sprite file in a folder the user picks (Chrome and Edge only). */
export async function openSpriteFolder(): Promise<{ file: string; sprite: SpriteData; modified: number }[] | null> {
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
            const file = await (entry as FileSystemFileHandle).getFile()
            out.push({ file: entry.name, sprite: parseSprite(JSON.parse(await file.text())), modified: file.lastModified })
        } catch {
            // not a sprite file
        }
    }
    return out
}

async function pickFile(): Promise<File | null> {
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({ types: [JSON_TYPE] })
            return await handle.getFile()
        } catch {
            return null
        }
    }
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,application/json'
        input.addEventListener('change', () => resolve(input.files?.[0] ?? null))
        input.addEventListener('cancel', () => resolve(null))
        input.click()
    })
}

async function saveBlob(blob: Blob, name: string, type: FilePickerType): Promise<boolean> {
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({ suggestedName: name, types: [type] })
            const writable = await handle.createWritable()
            await writable.write(blob)
            await writable.close()
            return true
        } catch {
            return false
        }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
}
