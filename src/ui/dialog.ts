import { el, isolateKeys } from './dom'

/** A modal dialog built on <dialog>. Resolves with the button's value, or null if dismissed. */
function show(title: string, build: (body: HTMLElement) => void, buttons: { label: string; value: string; danger?: boolean }[]): Promise<string | null> {
    return new Promise((resolve) => {
        const dialog = el('dialog', { parent: document.body, className: 'modal' })
        isolateKeys(dialog)
        el('h2', { parent: dialog, text: title })
        const body = el('div', { parent: dialog })
        build(body)
        const row = el('div', { parent: dialog, className: 'buttons' })
        let result: string | null = null
        for (const b of buttons) {
            const button = el('button', { parent: row, text: b.label, className: b.danger ? 'danger' : '' })
            button.addEventListener('click', () => {
                result = b.value
                dialog.close()
            })
        }
        dialog.addEventListener('close', () => {
            dialog.remove()
            resolve(result)
        })
        dialog.showModal()
        ;(dialog.querySelector('input') as HTMLInputElement | null)?.focus()
    })
}

export async function prompt(title: string, label: string, initial = ''): Promise<string | null> {
    let input!: HTMLInputElement
    const result = await show(
        title,
        (body) => {
            const wrap = el('label', { parent: body, className: 'field' })
            el('span', { parent: wrap, text: label })
            input = el('input', { parent: wrap })
            input.value = initial
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    ;(input.closest('dialog')!.querySelector('.buttons button') as HTMLButtonElement).click()
                }
            })
        },
        [{ label: 'OK', value: 'ok' }, { label: 'Cancel', value: 'cancel' }],
    )
    return result === 'ok' ? input.value.trim() || null : null
}

export async function confirm(title: string, message: string, okLabel = 'OK'): Promise<boolean> {
    const result = await show(title, (body) => el('p', { parent: body, text: message }), [
        { label: okLabel, value: 'ok', danger: true },
        { label: 'Cancel', value: 'cancel' },
    ])
    return result === 'ok'
}

/** Show arbitrary content with a Close button. `build` may return a cleanup function. */
export async function custom(title: string, build: (body: HTMLElement, close: () => void) => void, buttons = [{ label: 'Close', value: 'close' }]): Promise<string | null> {
    let closeFn = () => {}
    const result = show(
        title,
        (body) => {
            closeFn = () => (body.closest('dialog') as HTMLDialogElement).close()
            build(body, () => closeFn())
        },
        buttons,
    )
    return result
}
