const PIXI = require('pixi.js')
const exists = require('exists')
const pointInTriangle = require('point-in-triangle')

const THEME = require('./theme.json')

module.exports = class Window extends PIXI.Container
{
    /**
     * @param {object} options
     * @param {number} [options.width]
     * @param {number} [options.height]
     * @param {boolean} [options.fullscreen]
     * @param {boolean} [options.draggable]
     * @param {boolean} [options.resizeable]
     * @param {boolean} [options.clickable]
     * @param {object} [options.theme]
     */
    constructor(options)
    {
        super()
        this.types = ['Window']
        options = options || {}
        this.sg = super.addChild(new PIXI.Graphics())
        this.g = super.addChild(new PIXI.Graphics())
        this.content = super.addChild(new PIXI.Container())
        const mask = this.content.addChild(new PIXI.Graphics())
        this.content.mask = mask
        this._resizeable = options.resizeable
        this._clickable = options.clickable
        this.theme = options.theme || {}
        this.cursor = options.cursor
        this.draggable = options.draggable
        this._windowWidth = options.width || this.get('minimum-width')
        this._windowHeight = options.height || this.get('minimum-height')
        this.dirty = true

        this.changeInteractive()
        this.on('pointerdown', this.down, this)
        this.on('pointermove', this.move, this)
        this.on('pointerup', this.up, this)
        this.on('pointerupoutside', this.up, this)
    }

    changeInteractive()
    {
        this.interactive = this.draggable || this.resizeable || this.clickable
    }

    getTheme()
    {
        let parent = this.parent
        while (parent && parent.type !== 'UI')
        {
            parent = parent.parent
        }
        if (parent)
        {
            return parent.theme
        }
    }

    get(name)
    {
        let result = exists(this.theme[name]) ? this.theme[name] : this._get(name)
        if (name.indexOf('color') !== -1)
        {
            result = isNaN(result) ? parseInt(result.substring(1), 16) : result
        }
        return result
    }

    _get(name)
    {
        if (exists(this[name]))
        {
            return this[name]
        }
        const theme = this.getTheme()
        for (let i = this.types.length - 1; i >= 0; i--)
        {
            const current = this.types[i]
            if (theme && exists(theme[current][name]))
            {
                return theme[current][name]
            }
            else if (exists(THEME[current][name]))
            {
                return THEME[current][name]
            }
        }
    }

    get resizeable()
    {
        return this._resizeable
    }
    set resizeable(value)
    {
        this._resizeable = value
        this.changeInteractive()
    }

    get draggable()
    {
        return this._draggable
    }
    set draggable(value)
    {
        this._draggable = value
        this.changeInteractive()
    }

    get clickable()
    {
        return this._clickable
    }
    set clickable(value)
    {
        this._clickable = value
        this.changeInteractive()
    }

    set width(value)
    {
        this._windowWidth = value
    }
    get width()
    {
        return this._windowWidth
    }

    set height(value)
    {
        this._windowHeight = value
    }
    get height()
    {
        return this._windowHeight
    }

    draw()
    {
        const background = this.get('background-color')
        const radius = this.get('corners')
        if (!this.transparent)
        {
            const size = this.get('shadow-size')
            this.sg
                .clear()
                .beginFill(0, this.get('shadow-alpha'))
                .drawRoundedRect(-size, -size, this.width + size * 2, this.height + size * 2, radius)
                .endFill()
            this.sg.visible = true
        }
        else
        {
            this.sg.visible = false
        }
        this.g
            .clear()
            .beginFill(background, this.transparent ? 0 : 1)
            .drawRoundedRect(0, 0, this.width, this.height, this.get('corners'))
            .endFill()
        if (this.resizeable)
        {
            const size = this.get('resize-border-size')
            this.g
                .beginFill(this.get('resize-border-color', 'color'))
                .moveTo(this.width, this.height - size)
                .lineTo(this.width, this.height)
                .lineTo(this.width - size, this.height)
                .endFill()
        }
        const spacing = this.get('spacing')
        this.content.mask
            .clear()
            .beginFill(0xffffff)
            .drawRect(spacing, spacing, this.width - spacing * 2, this.height - spacing * 2)
            .endFill()
    }

    down(e)
    {
        const point = e.data.global
        if (this.resizeable)
        {
            const size = this.get('resize-border-size')
            const local = super.toLocal(point)
            if (pointInTriangle([local.x, local.y], [[this.width, this.height - size], [this.width, this.y + this.height], [this.width - size, this.height]]))
            {
                this.isDown = { x: point.x, y: point.y }
                this.resizing = { width: this.width, height: this.height }
                e.stopPropagation
                return
            }
            this.parent.addChild(this)
        }
        if (this.draggable)
        {
            this.isDown = { x: this.x - point.x, y: this.y - point.y }
            this.parent.addChild(this)
            e.stopPropagation()
        }
    }

    move(e)
    {
        if (this.oldCursor !== null)
        {
            this.cursor = this.oldCursor
            this.oldCursor = null
        }
        if (this.cursor)
        {
            document.body.style.cursor = this.cursor
        }
        if (this.resizing && this.isDown)
        {
            const minWidth = this.get('minimum-width')
            const minHeight = this.get('minimum-height')
            this._windowWidth = this.resizing.width + e.data.global.x - this.isDown.x
            this._windowWidth = this._windowWidth < minWidth ? minWidth : this._windowWidth
            this._windowHeight = this.resizing.height + e.data.global.y - this.isDown.y
            this._windowHeight = this._windowHeight < minHeight ? minHeight : this._windowHeight
            this.dirty = true
            this.emit('resizing', this)
            e.stopPropagation()
        }
        else if (this.draggable && this.isDown)
        {
            this.x = e.data.global.x + this.isDown.x
            this.y = e.data.global.y + this.isDown.y
            this.dirtyRenderer = true
            e.stopPropagation()
        }
        else if (this.draggable)
        {
            const point = e.data.global
            const size = this.get('resize-border-size')
            const local = super.toLocal(point)
            if (pointInTriangle([local.x, local.y], [[this.width, this.height - size], [this.width, this.y + this.height], [this.width - size, this.height]]))
            {
                this.oldCursor = this.cursor
                this.cursor = 'se-resize'
            }
        }
    }

    up()
    {
        if (this.resizing)
        {
            this.resizing = false
            this.isDown = false
            this.dirtyRenderer = true
            this.emit('resize-end')
        }
        if (this.draggable && this.isDown)
        {
            this.isDown = false
            this.dirtyRenderer = true
            this.emit('drag-end')
        }
    }

    layout() {}

    addChild() { return this.content.addChild(...arguments) }
    addChildAt() { return this.content.addChild(...arguments) }
    removeChildren() { return this.content.removeChildren(...arguments) }
    removeChildAt() { return this.content.removeChildAt(...arguments) }
    removeChild() { return this.content.removeChild(...arguments) }
    setChildIndex() { return this.content.setChildIndex(...arguments) }
    swapChildren() { return this.content.swapChildren(...arguments) }
    toLocal() { return this.content.toLocal(...arguments) }
    toGlobal() { return this.content.toGlobal(...arguments) }
    getChild() { return this.content.getChild(...arguments) }
    getChildAt() { return this.content.getChildAt(...arguments) }
}