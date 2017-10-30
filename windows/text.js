const PIXI = require('pixi.js')
const Ease = require('pixi-ease')
const exists = require('exists')

const Window = require('./window')

const CURSOR_WIDTH = 3

module.exports = class Text extends Window
{
    /**
     *
     * @param {string} text
     * @param {object} [options]
     * @param {number} [options.wrap]
     * @param {number} [options.center]
     * @param {boolean} [options.edit]
     */
    constructor(text, options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : true
        super(options)
        this.types.push('Text')
        this._text = text
        this._fontFamily = options.fontFamily
        this._fontSize = options.fontSize
        this._center = options.center
        this._wrap = options.wrap
        this.edit = options.edit
        this.words = this.addChild(new PIXI.Text(text))
        this.on('click', this.startEdit, this)
    }

    get fontFamily()
    {
        return this._fontFamily || this.get('font-family')
    }
    set fontFamily(value)
    {
        this._fontFamily = value
        this.dirty = true
    }

    get fontSize()
    {
        return this._fontSize || this.get('font-size')
    }
    set fontSize(value)
    {
        this._fontSize = value
        this.dirty = true
    }

    get color()
    {
        return exists(this._color) ? this._color : this.get('foreground-color', 'color')
    }
    set color(value)
    {
        this._color = value
        this.dirty = true
    }

    get wrap()
    {
        return exists(this._wrap) ? this._wrap : this.get('wrap')
    }
    set wrap(value)
    {
        this._wrap = value
        this.dirty = true
    }

    get edit()
    {
        return this._edit
    }
    set edit(value)
    {
        this._edit = value
        this.interactive = value
        if (value && !this.wordsEdit)
        {
            this.wordsEdit = this.addChild(new PIXI.Container())
            this.wordsEdit.visible = false
        }
    }

    get center()
    {
        return this._center
    }
    set center(value)
    {
        this._center = value
        this.dirty = true
    }

    get width()
    {
        return this._windowWidth || this.words.width + this.get('text-padding-left') + this.get('text-padding-right')
    }

    get height()
    {
        return this._windowWidth || this.words.height + this.get('text-padding-top') + this.get('text-padding-bottom')
    }

    layout()
    {
        this.words.style.fontFamily = this._fontFamily || this.get('font-family')
        this.words.style.fontSize = this._fontSize || this.get('font-size')
        this.words.text = this._text
        if (this._wrap || !this.width || this.words.width > this.width || this.words.width > this._wrap)
        {
            this.words.style.wordWrap = true
            this.words.style.wordWrapWidth = (this._wrap || this.width) + this.get('text-padding-left') + this.get('text-padding-right')
        }
        else
        {
            this.words.style.wordWrap = false
        }
        this.x = this.get('text-padding-left')
        this.y = this.get('text-padding-top')
    }

    draw()
    {
        if (this.editing)
        {
            this.words.visible = false
            this.wordsEdit.visible = true
            this.wordsEdit.removeChildren()
            let x = 0
            for (let i = 0; i < this.words.text.length; i++)
            {
                const style = {}
                for (let entry in this.words.style)
                {
                    style[entry] = this.words.style[entry]
                }
                if (this.select !== false && this.select === true || this.select[i])
                {
                    style.fill = this.get('edit-foreground-select', 'color')
                }
                else
                {
                    style.fill = this.get('edit-foreground', 'color')
                }
                const bg = this.wordsEdit.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
                const letter = this.wordsEdit.addChild(new PIXI.Text(this.words.text[i], style))
                letter.isLetter = true
                letter.x = bg.x = x
                bg.width = letter.width
                bg.height = letter.height
                bg.tint = (this.select !== false && this.select === true || this.select[i]) ? this.get('edit-background', 'color') : this.get('edit-background-select', 'color')
                x += letter.width
            }
            this.cursor = this.wordsEdit.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
            this.cursor.height = this.wordsEdit.height
            this.cursor.width = CURSOR_WIDTH
            this.cursor.tint = this.get('edit-foreground', 'color')
            this.cursor.x = this.wordsEdit.width
            this.cursorEase = new Ease.tint(this.cursor, 0 /*[this.get('edit-foreground', 'color')*/, 1000, { reverse: true, repeat: true })
        }
        else
        {
            this.words.visible = true
            this.wordsEdit.visible = false
            this.words.tint = this._color || this.get('foreground-color', 'color')
        }
        super.draw()
    }

    startEdit(e)
    {
        if (this.edit)
        {
            if (!this.editing)
            {
                this.editing = true
                this.select = true
                this.dirty = true
            }
            else
            {
                for (let letter of this.wordsEdit.children)
                {
                    if (letter.isLetter && letter.containsPoint(e.data.global))
                    {
                        console.log(letter)
                    }
                }
            }
        }
    }

    update(elapsed)
    {
        if (this.cursorEase)
        {
            this.cursorEase.update(elapsed)
            this.dirty = true
        }
    }
}