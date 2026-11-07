import type { Animations } from './animation'
import { Frame } from './frame'

export const FORMAT_VERSION = 2

/** The original format: frames as [width, height, base64 PNG]. */
export interface SpriteFileV1 {
    name: string
    imageData: [number, number, string][]
    animations: Animations
}

export interface SpriteFileV2 {
    version: 2
    name: string
    frames: { width: number; height: number; png: string }[]
    animations: Animations
}

export interface SpriteData {
    name: string
    frames: Frame[]
    animations: Animations
}

/** Parse either file version. Throws on anything unrecognised. */
export function parseSprite(json: unknown): SpriteData {
    if (!json || typeof json !== 'object') {
        throw new Error('not a sprite file')
    }
    const file = json as Partial<SpriteFileV1 & SpriteFileV2> & { version?: number }
    const animations = (file.animations && typeof file.animations === 'object') ? file.animations : {}
    const name = typeof file.name === 'string' ? file.name : 'untitled'
    if (file.version === 2 && Array.isArray(file.frames)) {
        return {
            name,
            animations,
            frames: file.frames.map((f) => checkSize(Frame.fromPngBase64(f.png), f.width, f.height)),
        }
    }
    if (file.version === undefined && Array.isArray(file.imageData)) {
        return {
            name,
            animations,
            frames: file.imageData.map(([width, height, png]) => checkSize(Frame.fromPngBase64(png), width, height)),
        }
    }
    if (typeof file.version === 'number' && file.version > FORMAT_VERSION) {
        throw new Error(`sprite file version ${file.version} is newer than this editor supports`)
    }
    throw new Error('not a sprite file')
}

export function serializeSprite(sprite: SpriteData): SpriteFileV2 {
    return {
        version: 2,
        name: sprite.name,
        frames: sprite.frames.map((f) => ({ width: f.width, height: f.height, png: f.toPngBase64() })),
        animations: sprite.animations,
    }
}

/** The stored size wins if the PNG disagrees (v1 files could get out of sync). */
function checkSize(frame: Frame, width: number, height: number): Frame {
    return frame.width === width && frame.height === height ? frame : frame.region(0, 0, width, height)
}
