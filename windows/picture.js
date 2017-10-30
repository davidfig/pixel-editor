const PIXI = require('pixi.js')
const exists = require('exists')

const Window = require('./window')

module.exports = class Picture extends Window
{
    /**
     *
     * @param {PIXI.Texture} texture
     * @param {object} [options]
     */
    constructor(texture, options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : false
        super(options)
        this.types.push('Picture')
        this._texture = texture
        this.sprite = this.addChild(new PIXI.Sprite(this._texture))
    }

    /**
     * change size without regard to aspect ratio of texture
     * @param {number} width
     * @param {number} height
     */
    resize(width, height)
    {
        this.sprite.width = this._windowWidth = width
        this.sprite.height = this._windowHeight = height
        this.dirty = true
    }

    get width()
    {
        return this._windowWidth || (this.sprite.width + this.get('spacing') * 2)
    }
    set width(value)
    {
        this.sprite.width = value
        this.sprite.scale.y = this.sprite.scale.x
        this.dirty = true
    }

    get height()
    {
        return this._windowWidth || (this.sprite.height + this.get('spacing') * 2)
    }
    set height(value)
    {
        this.sprite.height = value
        this.sprite.scale.x = this.sprite.scale.y
        this.dirty = true
    }

    layout()
    {
        this.sprite.x = this.sprite.y = this.get('spacing')
    }
}