const exists = require('exists')

const Window = require('./window')
const Text = require('./text')
const Picture = require('./picture')

module.exports = class Button extends Window
{
    /**
     * @param {object} [options]
     * @param {string} [options.text]
     * @param {object} [options.textOptions]
     * @param {texture} [options.picture]
     * @param {object} [options.pictureOptions]
     * @param {texture} [options.select]
     */
    constructor(options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : false
        options.clickable = exists(options.clickable) ? options.clickable : true
        options.cursor = exists(options.cursor) ? options.cursor : 'pointer'
        super(options)
        this.types.push('Button')
        if (exists(options.text))
        {
            const textOptions = options.textOptions || {}
            textOptions.transparent = exists(textOptions.transparent) ? textOptions.transparent : true
            this.label = this.addChild(new Text(options.text, textOptions))
        }
        if (options.picture)
        {
            const pictureOptions = options.pictureOptions || {}
            pictureOptions.transparent = exists(pictureOptions.transparent) ? pictureOptions.transparent : true
            this.image = this.addChild(new Picture(options.picture, pictureOptions))
        }
        this._select = options.select
        this.layout()
    }

    get select()
    {
        return this._select
    }
    set select(value)
    {
        this._select = value
        this.background = value ? this.get('select-background-color', 'color') : this.get('background-color', 'color')
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

    calculateHeight()
    {
        if (this.label)
        {
            return this.label.height + this.get('text-padding-top') + this.get('text-padding-bottom')
        }
        else if (this.image)
        {
            return this.image.height + this.get('spacing') * 2
        }
        else
        {
            return super.calculateHeight()
        }
    }

    layout()
    {
        if (this.label)
        {
            this.label.x = this.width / 2 - this.label.width / 2
            this.label.y = this.height / 2 - this.label.height / 2
        }
        if (this.image)
        {
            this.image.x = this.width / 2 - this.image.width / 2
            this.image.y = this.height / 2 - this.image.height / 2
        }
    }

    draw()
    {
        if (this.select)
        {
            super.draw(true, true)
        }
        else
        {
            super.draw()
        }
    }
}