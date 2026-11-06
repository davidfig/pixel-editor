/**
 * Animation entries, as stored in sprite files (unchanged from yy-pixel):
 *
 * - `3` or `[3]`: show frame 3 for 1 time unit
 * - `[3, 2]`: show frame 3 for 2 time units
 * - `[3, [1, 4]]`: show frame 3 for a random 1–4 time units
 * - `[[1, 2, 3], 2]`: show frames 1, 2 and 3 for 2 time units each
 * - `['unique', [1, 2, 3], 2]`: show a random frame from the list (never the same twice in a row)
 * - `['link', 'walk']`: switch to another animation
 * - `'loop'`: start this animation over
 */
export type Duration = number | [number, number]
export type AnimationEntry =
    | number
    | 'loop'
    | ['link', string]
    | ['unique', number[], Duration?]
    | [number | number[], Duration?]

export type Animations = Record<string, AnimationEntry[]>

/** Length of one time unit in ms (yy-pixel's default). */
export const DEFAULT_UNIT_MS = 150

export type PlayerEvent = 'frame' | 'loop' | 'link' | 'stop'

/**
 * Plays an animation: call `update(elapsedMs)` each tick and read `frame`.
 * Pure logic with an injectable random source, so it can be tested.
 */
export class AnimationPlayer {
    frame = 0
    playing = false
    name = ''

    private entries: AnimationEntry[] = []
    private index = 0
    private next = 0
    private last: number | undefined

    constructor(
        private animations: Animations,
        private unitMs = DEFAULT_UNIT_MS,
        private random: () => number = Math.random,
        private listener?: (event: PlayerEvent, player: AnimationPlayer) => void,
    ) {}

    play(name: string): void {
        const source = this.animations[name]
        if (!source || !source.length) {
            this.stop()
            return
        }
        this.name = name
        this.entries = expand(source)
        this.index = 0
        this.playing = true
        this.enter(0, 0)
    }

    stop(): void {
        this.playing = false
        this.name = ''
    }

    /** Advance by `elapsed` ms. Returns true if the displayed frame changed. */
    update(elapsed: number): boolean {
        if (!this.playing) {
            return false
        }
        this.next -= elapsed
        let changed = false
        while (this.playing && this.next <= 0) {
            this.index++
            if (this.index >= this.entries.length) {
                this.playing = false
                this.name = ''
                this.listener?.('stop', this)
                break
            }
            this.enter(this.next, 0)
            changed = true
        }
        return changed
    }

    /** Resolve the entry at `this.index`. `depth` guards against link/loop cycles with no frames. */
    private enter(leftover: number, depth: number): void {
        if (depth > 100) {
            this.stop()
            return
        }
        let entry = this.entries[this.index]
        if (entry === 'loop') {
            this.index = 0
            this.listener?.('loop', this)
            this.enter(leftover, depth + 1)
            return
        }
        let frame: number
        let duration: Duration = 1
        if (typeof entry === 'number') {
            frame = entry
        } else if (entry[0] === 'link') {
            const name = entry[1] as string
            this.entries = expand(this.animations[name] ?? [])
            this.name = name
            this.index = 0
            this.listener?.('link', this)
            if (!this.entries.length) {
                this.stop()
                return
            }
            this.enter(leftover, depth + 1)
            return
        } else if (entry[0] === 'unique') {
            const choices = entry[1] as number[]
            let pick = choices[Math.floor(this.random() * choices.length)]
            for (let tries = 0; choices.length > 1 && pick === this.last && tries < 100; tries++) {
                pick = choices[Math.floor(this.random() * choices.length)]
            }
            this.last = pick
            frame = pick
            duration = (entry[2] as Duration | undefined) ?? 1
        } else {
            frame = entry[0] as number
            duration = (entry[1] as Duration | undefined) ?? 1
        }
        const units = Array.isArray(duration) ? duration[0] + this.random() * (duration[1] - duration[0]) : duration
        this.next = this.unitMs * units + leftover
        this.frame = frame
        this.listener?.('frame', this)
    }
}

/** Expand `[[1, 2, 3], d]` entries into one entry per frame. */
function expand(source: AnimationEntry[]): AnimationEntry[] {
    const out: AnimationEntry[] = []
    for (const entry of source) {
        if (Array.isArray(entry) && Array.isArray(entry[0])) {
            for (const frame of entry[0]) {
                out.push([frame, entry[1] as Duration | undefined])
            }
        } else {
            out.push(entry)
        }
    }
    return out
}
