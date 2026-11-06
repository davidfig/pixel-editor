import { decode, encode } from 'fast-png'

import { type Hex, TRANSPARENT, hexToRgba, rgbaToHex } from './color'

export type HAlign = 'left' | 'center' | 'right'
export type VAlign = 'top' | 'center' | 'bottom'

/** One frame of a sprite: RGBA pixels, 4 bytes per pixel, row by row. */
export class Frame {
    readonly width: number
    readonly height: number
    readonly data: Uint8ClampedArray

    constructor(width: number, height: number, data?: Uint8ClampedArray) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
            throw new Error(`invalid frame size ${width}x${height}`)
        }
        this.width = width
        this.height = height
        this.data = data ?? new Uint8ClampedArray(width * height * 4)
        if (this.data.length !== width * height * 4) {
            throw new Error(`frame data length ${this.data.length} doesn't match ${width}x${height}`)
        }
    }

    inBounds(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.width && y < this.height
    }

    get(x: number, y: number): Hex {
        if (!this.inBounds(x, y)) {
            return TRANSPARENT
        }
        const i = (y * this.width + x) * 4
        return rgbaToHex(this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3])
    }

    /** Returns false if (x, y) is outside the frame. */
    set(x: number, y: number, color: Hex): boolean {
        if (!this.inBounds(x, y)) {
            return false
        }
        const { r, g, b, a } = hexToRgba(color)
        const i = (y * this.width + x) * 4
        this.data[i] = r
        this.data[i + 1] = g
        this.data[i + 2] = b
        this.data[i + 3] = a
        return true
    }

    clone(): Frame {
        return new Frame(this.width, this.height, this.data.slice())
    }

    equals(other: Frame): boolean {
        if (other.width !== this.width || other.height !== this.height) {
            return false
        }
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] !== other.data[i]) {
                return false
            }
        }
        return true
    }

    /**
     * A new frame of the given size, copying this frame's pixels from (x, y) onward.
     * Areas outside this frame are transparent. Used for crop and resize.
     */
    region(x: number, y: number, width: number, height: number): Frame {
        const out = new Frame(width, height)
        for (let row = 0; row < height; row++) {
            const sy = y + row
            if (sy < 0 || sy >= this.height) {
                continue
            }
            for (let col = 0; col < width; col++) {
                const sx = x + col
                if (sx < 0 || sx >= this.width) {
                    continue
                }
                const from = (sy * this.width + sx) * 4
                const to = (row * width + col) * 4
                out.data.set(this.data.subarray(from, from + 4), to)
            }
        }
        return out
    }

    /** Resize, keeping the pixels anchored at the given side. */
    resize(width: number, height: number, hAlign: HAlign = 'left', vAlign: VAlign = 'top'): Frame {
        return this.region(offset(this.width, width, hAlign), offset(this.height, height, vAlign), width, height)
    }

    /** Rotate 90° clockwise, or counter-clockwise if `counter` is true. */
    rotate(counter = false): Frame {
        const out = new Frame(this.height, this.width)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const nx = counter ? y : this.height - 1 - y
                const ny = counter ? this.width - 1 - x : x
                copyPixel(this, x, y, out, nx, ny)
            }
        }
        return out
    }

    flipHorizontal(): Frame {
        const out = new Frame(this.width, this.height)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                copyPixel(this, x, y, out, this.width - 1 - x, y)
            }
        }
        return out
    }

    flipVertical(): Frame {
        const out = new Frame(this.width, this.height)
        for (let y = 0; y < this.height; y++) {
            const from = y * this.width * 4
            out.data.set(this.data.subarray(from, from + this.width * 4), (this.height - 1 - y) * this.width * 4)
        }
        return out
    }

    /** Copy pixels into an ImageData for drawing on a canvas. */
    toImageData(): ImageData {
        return new ImageData(new Uint8ClampedArray(this.data), this.width, this.height)
    }

    toPngBase64(): string {
        const png = encode({ width: this.width, height: this.height, data: new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength), channels: 4, depth: 8 })
        return bytesToBase64(png)
    }

    static fromPngBase64(base64: string): Frame {
        const png = decode(base64ToBytes(base64))
        const { width, height, channels } = png
        const out = new Frame(width, height)
        const src = png.data
        if (png.depth !== 8) {
            throw new Error(`unsupported PNG bit depth ${png.depth}`)
        }
        for (let i = 0, j = 0; i < width * height; i++, j += channels) {
            const o = i * 4
            if (channels === 4) {
                out.data[o] = src[j]
                out.data[o + 1] = src[j + 1]
                out.data[o + 2] = src[j + 2]
                out.data[o + 3] = src[j + 3]
            } else if (channels === 3) {
                out.data[o] = src[j]
                out.data[o + 1] = src[j + 1]
                out.data[o + 2] = src[j + 2]
                out.data[o + 3] = 255
            } else if (channels === 2) {
                out.data[o] = out.data[o + 1] = out.data[o + 2] = src[j]
                out.data[o + 3] = src[j + 1]
            } else {
                out.data[o] = out.data[o + 1] = out.data[o + 2] = src[j]
                out.data[o + 3] = 255
            }
        }
        return out
    }
}

function offset(from: number, to: number, align: HAlign | VAlign): number {
    if (align === 'center') {
        return Math.floor(from / 2) - Math.floor(to / 2)
    }
    if (align === 'right' || align === 'bottom') {
        return from - to
    }
    return 0
}

function copyPixel(src: Frame, sx: number, sy: number, dst: Frame, dx: number, dy: number): void {
    const from = (sy * src.width + sx) * 4
    dst.data.set(src.data.subarray(from, from + 4), (dy * dst.width + dx) * 4)
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    }
    return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64.replace(/^data:image\/\w+;base64,/, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}
