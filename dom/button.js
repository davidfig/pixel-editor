const exists = require('exists')

const Window = require('./window')
const Picture = require('./picture')

const STYLES = {
    'margin': '1em'
}

module.exports = class Button extends Window
{
    /**
     * @param {object} [options]
     * @param {string} [options.text]
     * @param {texture} [options.picture]
     * @param {texture} [options.select]
     */
    constructor(options)
    {
        options = options || {}
        options.clickable = exists(options.clickable) ? options.clickable : true
        options.cursor = exists(options.cursor) ? options.cursor : 'pointer'
        options.transparent = exists(options.transparent) ? options.tranparent : false
        super(STYLES, options)
        // if (options.text)
        // {
        //     this.label = this.addChild(new Text(options.text))
        // }
        if (options.picture)
        {
            this.image = this.add(new Picture(options.picture, { transparent: true }))
        }
        this._select = options.select
    }

    get select()
    {
        return this._select
    }
    set select(value)
    {
        this._select = value
        this.dirty = true
    }

    get text()
    {
        return this._text
    }
    set text(value)
    {
        this._text = value
        this.dirty = true
    }

    get picture()
    {
        return this.image.texture
    }
    set picture(value)
    {
        this.image.texture = value
        this.dirty = true
    }

    down(e)
    {
        this.isDown = true
        this.shadowOff = true
        this.dirty = true
        this.emit('pressed', this)
        e.stopPropagation()
    }

    move(e)
    {
        if (this.isDown)
        {
            if (!this.g.containsPoint(e.data.global))
            {
                this.isDown = false
                this.shadowOff = false
                this.dirty = true
            }
            e.stopPropagation()
        }
    }

    up()
    {
        if (this.isDown)
        {
            this.emit('clicked', this)
        }
        this.isDown = false
        this.shadowOff = false
        this.dirty = true
    }

    calculateWidth()
    {
        if (this.label)
        {
            return this.label.width + this.get('text-padding-left') + this.get('text-padding-right')
        }
        else if (this.image)
        {
            return this.image.width + this.get('spacing') * 2
        }
        else
        {
            return super.calculateWidth()
        }
    }
}