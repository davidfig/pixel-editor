import { createStore, del, entries, get, set, type UseStore } from 'idb-keyval'

import type { AppState } from '../state'
import { parseSprite, serializeSprite, type SpriteData, type SpriteFileV2 } from '../model/format'

/** Per-sprite editor settings, stored next to the sprite (replaces the old .editor.json). */
export interface EditorState {
    current: number
    /** Thumbnail scale in the frames, animation and export panes. */
    zoom?: number
    /** Draw pane viewport: world position at the screen's top-left, and pixels per sprite pixel. */
    viewport?: { x: number; y: number; scale: number }
}

interface SpriteRecord {
    id: string
    file: SpriteFileV2
    editor: EditorState
    modified: number
}

export interface SpriteSummary {
    id: string
    name: string
    modified: number
    /** First frame, for thumbnails. */
    width: number
    height: number
    png: string
}

const STATE_KEY = 'state'
const SPRITE_PREFIX = 'sprite:'

let store: UseStore | undefined

function db(): UseStore {
    store ??= createStore('pixel-editor-v2', 'kv')
    return store
}

export async function loadState(): Promise<Partial<AppState> | null> {
    return (await get(STATE_KEY, db())) ?? null
}

export async function saveState(state: AppState): Promise<void> {
    await set(STATE_KEY, state, db())
}

export function newId(): string {
    return crypto.randomUUID()
}

export async function loadSprite(id: string): Promise<{ sprite: SpriteData; editor: EditorState } | null> {
    const record = await get<SpriteRecord>(SPRITE_PREFIX + id, db())
    if (!record) {
        return null
    }
    return { sprite: parseSprite(record.file), editor: record.editor }
}

export async function saveSprite(id: string, sprite: SpriteData, editor: EditorState): Promise<void> {
    const record: SpriteRecord = { id, file: serializeSprite(sprite), editor, modified: Date.now() }
    await set(SPRITE_PREFIX + id, record, db())
}

export async function deleteSprite(id: string): Promise<void> {
    await del(SPRITE_PREFIX + id, db())
}

export async function listSprites(): Promise<SpriteSummary[]> {
    const all = await entries<string, SpriteRecord>(db())
    const out: SpriteSummary[] = []
    for (const [key, record] of all) {
        if (typeof key === 'string' && key.startsWith(SPRITE_PREFIX) && record.file.frames.length) {
            const first = record.file.frames[0]
            out.push({ id: record.id, name: record.file.name, modified: record.modified, width: first.width, height: first.height, png: first.png })
        }
    }
    return out
}

/**
 * One-time import of sprites saved by the old web build, which used localforage
 * (IndexedDB database "pixel-editor", store "keyvaluepairs", values as JSON strings).
 * Returns how many sprites were imported. Safe to call more than once.
 */
export async function importLegacy(): Promise<number> {
    if (await get('legacy-imported', db())) {
        return 0
    }
    let count = 0
    try {
        const legacy = createStore('pixel-editor', 'keyvaluepairs')
        for (const [key, value] of await entries<string, string>(legacy)) {
            if (typeof key !== 'string' || !key.endsWith('.json') || key.includes('.editor.')) {
                continue
            }
            try {
                const sprite = parseSprite(JSON.parse(value))
                await saveSprite(newId(), sprite, { current: 0 })
                count++
            } catch {
                // not a sprite; skip it
            }
        }
    } catch {
        // no legacy database
    }
    await set('legacy-imported', true, db())
    return count
}
