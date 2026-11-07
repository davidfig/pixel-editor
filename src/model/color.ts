/** A color as an 8-digit lowercase hex string: rrggbbaa. This is the format stored in app state. */
export type Hex = string

export const TRANSPARENT: Hex = '00000000'

export interface RGBA {
    r: number
    g: number
    b: number
    a: number
}

export function hexToRgba(hex: Hex): RGBA {
    const n = parseInt(hex.padEnd(8, 'f').slice(0, 8), 16)
    return { r: (n >>> 24) & 0xff, g: (n >>> 16) & 0xff, b: (n >>> 8) & 0xff, a: n & 0xff }
}

export function rgbaToHex(r: number, g: number, b: number, a: number): Hex {
    return byte(r) + byte(g) + byte(b) + byte(a)
}

/** CSS color for a hex value, e.g. for fillStyle. */
export function hexToCss(hex: Hex): string {
    const { r, g, b, a } = hexToRgba(hex)
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`
}

export function isTransparent(hex: Hex): boolean {
    return hex.slice(6, 8) === '00'
}

function byte(n: number): string {
    return (n & 0xff).toString(16).padStart(2, '0')
}

export interface HSL {
    /** 0–360 */
    h: number
    /** 0–1 */
    s: number
    /** 0–1 */
    l: number
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) {
        return { h: 0, s: 0, l }
    }
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
    return { h, s, l }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h = (((h % 360) + 360) % 360) / 360
    if (s === 0) {
        const v = Math.round(l * 255)
        return { r: v, g: v, b: v }
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    const channel = (t: number) => {
        t = t < 0 ? t + 1 : t > 1 ? t - 1 : t
        const v = t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
        return Math.round(v * 255)
    }
    return { r: channel(h + 1 / 3), g: channel(h), b: channel(h - 1 / 3) }
}

export function hexToHsl(hex: Hex): HSL {
    const { r, g, b } = hexToRgba(hex)
    return rgbToHsl(r, g, b)
}

/** A hex color from HSL, keeping `alpha` (0–255). */
export function hslToHex(hsl: HSL, alpha: number): Hex {
    const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l)
    return rgbaToHex(r, g, b, alpha)
}
