import PixelEditor from '../pixel-editor'
import * as locale from '../locale'
import hull from '../hull'
import concaveman from '../concaveman'
import simplify from 'simplify-geometry'

export class Outline
{
    constructor(ui)
    {
        this.win = ui.createWindow({
            id: 'outline',
            title: locale.get('OutlineTitle'),
            x: 10, y: 10,
            width: 220,
            resizable: false
        })
        this.win.open()
        this.content = this.win.content
        this.content.style.padding = '0em 1em 0.5em'
        this.content.style.color = '#eeeeee'
        this.draw()
    }

    draw() {
        const div = document.createElement('div')
        this.polygon = document.createElement('textarea')
        this.polygon.innerHTML = 'this is a test.'
        this.polygon.readOnly = true
        this.polygon.style.marginTop = '1rem'
        div.appendChild(this.polygon)
        const buttons = document.createElement('div')
        div.appendChild(buttons)
        buttons.style.display = 'flex'
        buttons.style.justifyContent = 'center'
        const outline = document.createElement('button')
        outline.style.margin = '0.5rem'
        outline.innerHTML = 'outline'
        outline.addEventListener('click', () => {
            copy.disabled = false
            this.outline()
        })
        buttons.appendChild(outline)
        const copy = document.createElement('button')
        copy.disabled = true
        copy.innerHTML = 'copy'
        copy.style.margin = '0.5rem'
        copy.addEventListener('click', () => this.copy())
        buttons.appendChild(copy)
        this.content.appendChild(div)
    }

    isPixel(x, y) {
        return PixelEditor.get(x, y).substr(6,2) !== '00'
    }

    simplify(points) {
        const index = i => {
            return i >= points.length ? i - points.length : i
        }
        for (let i = 0; i < points.length; i++) {
            let p1 = points[i]
            let p2 = points[index(i + 1)]
            let j = i
            if (p1[1] === p2[1]) {
                while (points[index(i + 1)][1] === p1[1]) {
                    i++
                }
            } else if (p1[0] === p2[0]) {
                while (points[index(i + 1)][0] === p1[0]) {
                    i++
                }
            }
            if (i !== j) {
                const n = i - j - 1
                points.splice(j + 1, n)
                i -= n + 1
            }
        }
        return points
    }

    removeDuplicates(points) {
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                if (points[i][0] === points[j][0] && points[i][1] === points[j][1]) {
                    points.splice(j, 1)
                    j--
                }
            }
        }
    }

    outline() {
        const points = []
        for (let y = 0; y < PixelEditor.height; y++) {
            for (let x = 0 ; x < PixelEditor.width; x++) {
                if (this.isPixel(x, y)) {
                    points.push(
                        [x, y],
                        [x + 1, y],
                        [x + 1, y + 1],
                        [x, y + 1])
                }
            }
        }
        this.removeDuplicates(points)
        const pixels = concaveman(points, 0.5)
        const s = this.simplify(pixels)
        const polygon = []
        for (const p of s) {
            polygon.push(p[0], p[1])
        }
        this.polygon.innerHTML = `[${polygon}]`
    }

    copy() {
        this.polygon.select()
        this.polygon.setSelectionRange(0, 99999)
        document.execCommand('copy')
        window.getSelection().removeAllRanges()
    }

    keydown() { }
}