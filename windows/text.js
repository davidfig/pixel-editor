const PIXI = require('pixi.js')
const exists = require('exists')

const Window = require('./window')

module.exports = class Text extends Window
{
    /**
     *
     * @param {string} text
     * @param {object} [options]
    //  * @param {number} [options.wrap]
     * @param {string} [options.align=left] (middle or center, left, right) horizontal align
     * @param {number} [options.count] number of characters to show
     * @param {object} [options.theme]
     */
    constructor(text, options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : false
        super(options)
        this.types.push('Text')
        this.text = text
        this._align = options.align
        this._wrap = options.wrap
        this._count = options.count
        this.words = this.addChild(new PIXI.Text(text))
        this.layout()
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

    get align()
    {
        return this._align
    }
    set align(value)
    {
        this._align = value
        this.dirty = true
    }

    get count()
    {
        return this._count
    }
    set count(value)
    {
        this._count = value
        this.dirty = true
    }

    get width()
    {
        return this._windowWidth || this.words.width
    }

    get height()
    {
        return this._windowWidth || this.words.height
    }

    set text(value)
    {
        this._text = '' + value
        this.dirty = true
    }
    get text()
    {
        return this._text
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
        this.words.text = text
    }

    draw()
    {
        super.draw()
        this.words.visible = true
        this.words.tint = this._color || this.get('foreground-color', 'color')
        switch (this.align)
        {
            case 'middle':
            case 'center':
                this.words.x = this.width / 2 - this.words.width / 2
                break
            case 'left':
                this.words.x = 0
                break
            case 'right':
                this.words.x = this.width - this.words.width
                break
        }
    }
}