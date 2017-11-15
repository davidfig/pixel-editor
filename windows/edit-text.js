const PIXI = require('pixi.js')
const exists = require('exists')
const Input = require('yy-input')
const ClipBoard = require('electron').clipboard

const Window = require('./window')

const CURSOR_WIDTH = 3

const STOP_AT_CHARS = ',.!@#$%^&*()/?<>-+_= '

module.exports = class Text extends Window
{
    /**
     *
     * @param {string} text
     * @param {object} [options]
     * @param {string} [options.align=left] (middle or center, left, right) horizontal align
     * @param {string} [options.edit] (number, hex) type of characters allowed
     * @param {number} [options.min] minimum number of type is number
     * @param {number} [options.max] maximum number of type is number
     * @param {number} [options.count] number of characters to show
     * @param {number} [options.maxCount] maximum number of characters for editing
     * @param {object} [options.theme]
     * @param {string} [options.beforeText] add text before edit box
     * @param {string} [options.afterText] add text after edit box
     * @param {boolean} [options.fit=true]
     */
    constructor(text, options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : false
        super(options)
        this.fit = exists(options.fit) ? options.fit : true
        this.types.push('Text', 'EditText')
        this._text = text
        this._align = options.align
        this._maxCount = options.maxCount
        this._count = options.count
        this.beforeText = options.beforeText || ''
        this.afterText = options.afterText || ''
        this.min = options.min
        this.max = options.max
        this.words = this.addChild(new PIXI.Text(text))
        this.wordsEdit = this.addChild(new PIXI.Container())
        this.interactive = true
        this.on('click', this.startEdit, this)

        this.input = new Input({ noPointers: true })
        this.input.on('keydown', this.keyDown, this)
        this.input.on('down', this.down, this)
        this.layout()
    }

    get align()
    {
        return this._align
    }
    set align(value)
    {
        this._align = value
        this.layout()
    }

    get count()
    {
        return this._count
    }
    set count(value)
    {
        this._count = value
        this.layout()
    }

    set text(value)
    {
        if (this._maxCount)
        {
            this._text = (value + '').substr(0, this._maxCount)
        }
        else
        {
            this._text = '' + value
        }
        if (this.edit === 'number')
        {
            const current = parseInt(this._text)
            if (exists(this.min))
            {
                if (current < this.min)
                {
                    this._text = this.min + ''
                }
            }
            if (exists(this.max))
            {
                if (current > this.max)
                {
                    this._text = this.max + ''
                }
            }
        }
        this._cursorPlace = (this.cursorPlace >= this._text.length) ? this._text.length : this.cursorPlace
        this.layout()
    }
    get text()
    {
        return this._text
    }

    set maxCount(value)
    {
        this._maxCount = value
        this.text = this.text
    }
    get maxCount()
    {
        return this._maxCount
    }

    set cursorPlace(value)
    {
        if (value > this._text.length)
        {
            this._cursorPlace = this._text.length
        }
        else
        {
            this._cursorPlace = value
        }
    }
    get cursorPlace()
    {
        return this._cursorPlace
    }

    layout()
    {
        this.words.style.fontFamily = this.get('font-family')
        this.words.style.fontSize = this.get('font-size')
        let text = ''
        if (this.count && this._text.length < this.count)
        {
            if (this.align === 'middle' || this.align === 'center')
            {
                const first = Math.floor((this.count - this._text.length) / 2)
                for (let i = 0; i < first; i++)
                {
                    text += ' '
                }
                text += this._text
                for (let i = first + 1; i < this.count; i++)
                {
                    text += ' '
                }
            }
            else
            {
                let pad = ''
                for (let i = 0; i < this.count - this._text.length; i++)
                {
                    pad += ' '
                }
                if (this.align === 'right')
                {
                    text = pad + this._text
                }
                else
                {
                    text = this._text + pad
                }
            }
        }
        else
        {
            text = this._text
        }
        this.words.text = this.beforeText + text + this.afterText
        this.styles = {
            fontFamily: this.words.style.fontFamily,
            fontSize: this.words.style.fontSize,
        }
        let cursorStart = 0
        if (this.editing)
        {
            this.words.visible = false
            this.wordsEdit.visible = true
            this.wordsEdit.removeChildren()
            let x = 0
            const styleStatic = {}
            for (let entry in this.styles)
            {
                styleStatic[entry] = this.styles[entry]
            }
            styleStatic.fill = this.get('foreground-color')
            if (this.beforeText)
            {
                for (let i = 0; i < this.beforeText.length; i++)
                {
                    const letter = this.wordsEdit.addChild(new PIXI.Text(this.beforeText[i], styleStatic))
                    letter.x = x
                    x += letter.width
                }
                cursorStart = x
            }
            for (let i = 0; i < Math.max(this._text.length, this.count || 0); i++)
            {
                const style = {}
                for (let entry in this.styles)
                {
                    style[entry] = this.styles[entry]
                }
                if (i < this._text.length && this.select.indexOf(i) !== -1)
                {
                    style.fill = this.get('edit-foreground-select-color')
                }
                else
                {
                    style.fill = this.get('edit-foreground-color')
                }
                const bg = this.wordsEdit.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
                const show = (i < this._text.length) ? this._text[i] : ' '
                const letter = this.wordsEdit.addChild(new PIXI.Text(show, style))
                letter.isLetter = i < this._text.length
                letter.index = i
                letter.x = bg.x = x
                bg.width = letter.width
                bg.height = letter.height
                bg.tint = (this.select.indexOf(i) !== -1) ? this.get('edit-background-color') : this.get('edit-background-select-color')
                x += letter.width
            }
            if (!this.select.length)
            {
                this.textCursor = this.wordsEdit.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
                this.textCursor.height = this.lastHeight || this.wordsEdit.height
                this.lastHeight = !this.lastHeight || this.textCursor.height > this.lastHeight ? this.textCursor.height : this.lastHeight
                this.textCursor.width = CURSOR_WIDTH
                this.textCursor.tint = this.get('edit-foreground-color')
                this.textCursor.x = cursorStart
                for (let i = 0; i < this.cursorPlace; i++)
                {
                    this.textCursor.x += this.wordsEdit.children[i * 2].width
                }
            }
        }
        else
        {
            this.words.visible = true
            this.wordsEdit.visible = false
            this.words.tint = this._color || this.get('foreground-color')
            // switch (this.align)
            // {
            //     case 'middle':
            //     case 'center':
            //         // this.words.x = this.words.width / 2 - this.words.width / 2
            //         break
            //     case 'left':
            //         this.words.x = 0
            //         break
            //     case 'right':
            //         // this.words.x = this.width - this.words.width
            //         break
            // }
        }
        super.layout()
    }

    startEdit(e)
    {
        if (!this.editing)
        {
            this.emit('editing', this)
            this.editing = true
            this.original = this._text
            this.select = []
            for (let i = 0; i < this._text.length; i++)
            {
                this.select.push(i)
            }
            this.cursorPlace = this._text.length
            this.layout()
        }
        else
        {
            this.select = []
            for (let letter of this.wordsEdit.children)
            {
                if (letter.isLetter && letter.containsPoint(e.data.global))
                {
                    const local = letter.toLocal(e.data.global)
                    this.cursorPlace = letter.index + (local.x > letter.width / 2 ? 1 : 0)
                    this.layout()
                    return
                }
            }
        }
    }

    addLetter(code, shift, data)
    {
        let valid, isValid
        if (this.edit === 'hex')
        {
            valid = '1234567890abcdefABCDEF'
        }
        else if (this.edit === 'number')
        {
            valid = '1234567890-'
        }
        else
        {
            isValid =
                (code > 47 && code < 58) || // number keys
                code == 32 || // spacebar
                (code > 64 && code < 91) || // letter keys
                (code > 95 && code < 112) || // numpad keys
                (code > 185 && code < 193) || // ;=,-./` (in order)
                (code > 218 && code < 223)   // [\]' (in order)
        }
        switch (this.edit)
        {
            default:
                const letter = data.event.key || ''
                if (letter.length === 1)
                {
                    if (this.select.length)
                    {
                        if (isValid || valid.indexOf(letter) !== -1)
                        {
                            this.cursorPlace = this.select[0] + 1
                            this.text = this._text.slice(0, this.select[0]) + letter + this._text.slice(this.select[this.select.length - 1] + 1)
                            this.select = []
                            this.layout()
                        }
                    }
                    else
                    {
                        if (isValid || valid.indexOf(letter) !== -1)
                        {
                            this.text = this._text.substr(0, this.cursorPlace) + letter + this._text.substr(this.cursorPlace)
                            this.cursorPlace++
                            this.layout()
                            data.event.stopPropagation()
                        }
                    }
                }
        }
    }

    ctrl(left)
    {

    }

    keyDown(code, special, data)
    {
        if (this.editing)
        {
            if (special.shift)
            {
                switch (code)
                {
                    case 37:
                        if (!this.select.length)
                        {
                            if (this.cursorPlace !== 0)
                            {
                                this.select = [this.cursorPlace - 1]
                                this.cursorPlace--
                                this.layout()
                                data.event.stopPropagation()
                                return
                            }
                        }
                        else if (this.cursorPlace !== 0)
                        {
                            if (this.select.indexOf(this.cursorPlace - 1) !== -1)
                            {
                                this.select.splice(this.select.indexOf(this.cursorPlace - 1), 1)
                            }
                            else
                            {
                                this.select.unshift(this.cursorPlace - 1)
                            }
                            this.cursorPlace--
                            this.layout()
                            data.event.stopPropagation()
                            return
                        }
                        break
                    case 39:
                        if (!this.select.length)
                        {
                            if (this.cursorPlace !== this._text.length)
                            {
                                this.select = [this.cursorPlace]
                                this.cursorPlace++
                                this.layout()
                                data.event.stopPropagation()
                                return
                            }
                        }
                        else if (this.cursorPlace !== this._text.length)
                        {
                            if (this.select.indexOf(this.cursorPlace) !== -1)
                            {
                                this.select.splice(this.select.indexOf(this.cursorPlace), 1)
                            }
                            else
                            {
                                this.select.push(this.cursorPlace)
                            }
                            this.cursorPlace++
                            this.layout()
                            data.event.stopPropagation()
                            return
                        }
                        break
                    default:
                        this.addLetter(code, true, data)
                }
            }
            else if (special.ctrl)
            {
                switch (code)
                {
                    case 8:
                        if (this.select.length)
                        {
                            this.cursorPlace = this.select[0]
                            this.text = this._text.slice(0, this.select[0]) + this._text.slice(this.select[this.select.length - 1] + 1)
                            this.select = []
                            this.layout()
                            data.event.stopPropagation()
                            return
                        }
                        else
                        {
                            let end = this.cursorPlace
                            let start = end
                            while (start > 0 && STOP_AT_CHARS.indexOf(this._text[start - 1]) === -1)
                            {
                                start--
                            }
                            if (start === end)
                            {
                                start--
                            }
                            this.text = '' + this._text.slice(0, start) + this._text.slice(end)
                            this.layout()
                            this.cursorPlace = start
                            data.event.stopPropagation()
                            return
                        }
                        break
                    case 67: // ctrl-c
                        let copy = ''
                        if (this.select.length)
                        {
                            for (let select of this.select)
                            {
                                copy += this._text[select]
                            }
                        }
                        else
                        {
                            copy = this._text
                        }
                        ClipBoard.writeText(copy)
                        break

                    case 88: // ctrl-x
                        let cut = ''
                        if (this.select.length)
                        {
                            for (let select of this.select)
                            {
                                cut += this._text[select]
                            }
                        }
                        else
                        {
                            cut = this._text
                        }
                        ClipBoard.writeText(cut)
                        if (this.select.length)
                        {
                            this.cursorPlace = this.select[0]
                            this.text = this._text.slice(0, this.select[0]) + this._text.slice(this.select[this.select.length - 1] + 1)
                            this.select = []
                            this.layout()
                        }
                        data.event.stopPropagation()
                        break
                }
            }
            else
            {
                switch (code)
                {
                    case 8:
                        if (this.select.length)
                        {
                            this.cursorPlace = this.select[0]
                            this.text = this._text.slice(0, this.select[0]) + this._text.slice(this.select[this.select.length - 1] + 1)
                            this.select = []
                            this.layout()
                            data.event.stopPropagation()
                            return
                        }
                        else
                        {
                            if (this.cursorPlace > 0)
                            {
                                this.text = this._text.slice(0, this.cursorPlace - 1) + this._text.slice(this.cursorPlace)
                                this.layout()
                                data.event.stopPropagation()
                                return
                            }
                        }
                        break

                    case 37: // left arrow
                        if (this.select.length)
                        {
                            this.select = []
                        }
                        else
                        {
                            this.cursorPlace--
                            this.cursorPlace = this.cursorPlace < 0 ? 0 : this.cursorPlace
                        }
                        this.layout()
                        data.event.stopPropagation()
                        break

                    case 39: // right arrow
                        if (this.select.length)
                        {
                            this.select = []
                        }
                        else
                        {
                            this.cursorPlace++
                            this.cursorPlace = this.cursorPlace > this._text.length ? this._text.length : this.cursorPlace
                        }
                        this.layout()
                        data.event.stopPropagation()
                        break

                    case 13:
                        this.editing = false
                        this.emit('changed', this)
                        this.layout()
                        data.event.stopPropagation()
                        break

                    case 27:
                        this.editing = false
                        this.words.text = this.original
                        this.layout()
                        data.event.stopPropagation()
                        break

                    default:
                        this.addLetter(code, false, data)
                }
            }
        }
    }

    down(x, y)
    {
        if (this.editing)
        {
            const point = new PIXI.Point(x, y)
            if (!this.words.containsPoint(point))
            {
                this.editing = false
                this.emit('changed', this)
                this.layout()
            }
        }
    }
}