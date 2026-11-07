export const MIN_SCALE = 1
export const MAX_SCALE = 200

/**
 * Maps world coordinates (sprite pixels) to screen coordinates (CSS pixels):
 * screen = (world - (x, y)) * scale.
 */
export class Viewport {
    /** World coordinate at the screen's top-left. */
    x = 0
    y = 0
    /** Screen pixels per sprite pixel. */
    scale = 20
    screenWidth = 1
    screenHeight = 1

    toWorld(sx: number, sy: number): { x: number; y: number } {
        return { x: sx / this.scale + this.x, y: sy / this.scale + this.y }
    }

    toScreen(wx: number, wy: number): { x: number; y: number } {
        return { x: (wx - this.x) * this.scale, y: (wy - this.y) * this.scale }
    }

    /** Move by a screen-pixel delta (dragging). */
    pan(dx: number, dy: number): void {
        this.x -= dx / this.scale
        this.y -= dy / this.scale
    }

    /** Zoom by `factor`, keeping the world point under (sx, sy) fixed. */
    zoomAt(sx: number, sy: number, factor: number): void {
        const before = this.toWorld(sx, sy)
        this.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.scale * factor))
        this.x = before.x - sx / this.scale
        this.y = before.y - sy / this.scale
    }

    /** Put world point (wx, wy) in the middle of the screen. */
    centerOn(wx: number, wy: number): void {
        this.x = wx - this.screenWidth / 2 / this.scale
        this.y = wy - this.screenHeight / 2 / this.scale
    }

    /** Scale so a `width` x `height` world area fills `fraction` of the screen, centred. */
    fit(width: number, height: number, fraction = 0.5): void {
        const scale = Math.min((this.screenWidth * fraction) / width, (this.screenHeight * fraction) / height)
        this.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
        this.centerOn(width / 2, height / 2)
    }

    /** Put the world origin at the screen's top-left, with a small margin. */
    corner(margin = 20): void {
        this.x = -margin / this.scale
        this.y = -margin / this.scale
    }
}
