import type { App } from './app'
import type { Frame } from './model/frame'
import { savePng } from './storage/disk'
import { custom } from './ui/dialog'
import { el, field } from './ui/dom'

/** Render a frame scaled up (nearest neighbour) to a PNG blob. */
export function framePng(frame: Frame, scale: number): Promise<Blob> {
    const source = document.createElement('canvas')
    source.width = frame.width
    source.height = frame.height
    source.getContext('2d')!.putImageData(frame.toImageData(), 0, 0)
    const out = document.createElement('canvas')
    out.width = Math.max(1, Math.round(frame.width * scale))
    out.height = Math.max(1, Math.round(frame.height * scale))
    const c = out.getContext('2d')!
    c.imageSmoothingEnabled = false
    c.drawImage(source, 0, 0, out.width, out.height)
    return new Promise((resolve, reject) => out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'))
}

/** Export the current frame (or every frame) as PNG, at a scale set by width, height or scale. */
export async function exportDialog(app: App): Promise<void> {
    const frame = app.sprite.frame
    let scale = app.zoom
    let all = false
    let width!: HTMLInputElement, height!: HTMLInputElement, scaleInput!: HTMLInputElement
    const sync = () => {
        width.value = fix(frame.width * scale)
        height.value = fix(frame.height * scale)
        scaleInput.value = fix(scale)
    }
    const result = await custom(
        'Export to PNG',
        (body) => {
            body.classList.add('export')
            width = field(body, 'width: ', 'width in pixels', (v) => setScale(parseFloat(v) / frame.width))
            height = field(body, 'height: ', 'height in pixels', (v) => setScale(parseFloat(v) / frame.height))
            scaleInput = field(body, 'scale: ', 'scale', (v) => setScale(parseFloat(v)))
            if (app.sprite.frames.length > 1) {
                const label = el('label', { parent: body, className: 'field' })
                const check = el('input', { parent: label })
                check.type = 'checkbox'
                el('span', { parent: label, text: ` every frame (${app.sprite.frames.length} files)` })
                check.addEventListener('change', () => (all = check.checked))
            }
            sync()
        },
        [
            { label: 'Export…', value: 'ok' },
            { label: 'Cancel', value: 'cancel' },
        ],
    )
    function setScale(value: number) {
        if (value > 0 && Number.isFinite(value)) {
            scale = value
        }
        sync()
    }
    if (result !== 'ok') {
        return
    }
    const frames = all ? app.sprite.frames.map((f, i) => [f, i] as const) : [[frame, app.sprite.current] as const]
    for (const [f, i] of frames) {
        const name = frames.length > 1 ? `${app.sprite.name}-${i}` : app.sprite.name
        if (!(await savePng(await framePng(f, scale), name))) {
            break
        }
    }
}

function fix(n: number): string {
    return n === Math.round(n) ? String(n) : n.toFixed(2)
}
