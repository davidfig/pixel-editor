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
     * @param {number} [options.fit]
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
        this.fit = options.fit
        this.drawWindowShape()

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
        this.drawWindowShape()
    }
    get width()
    {
        return this._windowWidth
    }

    get center()
    {
        const spacing = this.get('spacing') * 2
        return { x: (this._windowWidth - spacing) / 2, y: (this._windowHeight - spacing) / 2}
    }

    get left() { return 0 }
    get top() { return 0 }
    get right() { return this._windowWidth - this.get('spacing') * 2 }
    get bottom() { return this._windowHeight - this.get('spacing') * 2 }

    set height(value)
    {
        this._windowHeight = value
        this.drawWindowShape()
    }
    get height()
    {
        return this._windowHeight
    }

    drawWindowShape()
    {
        this.sg
            .clear()
            .beginFill(0, this.get('shadow-alpha'))
            .drawRoundedRect(0, 0, this._windowWidth, this._windowHeight, this.get('corners'))
            .endFill()
        this.sg.visible = true
        const shadow = this.get('shadow-size')
        this.g
            .clear()
            .beginFill(this.get('background-color'))
            .drawRoundedRect(shadow, shadow, this._windowWidth - shadow * 2, this._windowHeight - shadow * 2, this.get('corners'))
            .endFill()
        if (this.resizeable)
        {
            const size = this.get('resize-border-size')
            this.g
                .beginFill(this.get('resize-border-color', 'color'))
                .moveTo(this._windowWidth, this._windowHeight - size)
                .lineTo(this._windowWidth, this._windowHeight)
                .lineTo(this._windowWidth - size, this._windowHeight)
                .endFill()
        }
        const spacing = this.get('spacing')
        this.content.mask
            .clear()
            .beginFill(0xffffff)
            .drawRect(0, 0, this._windowWidth - spacing * 2, this._windowHeight - spacing * 2)
            .endFill()
        this.content.position.set(spacing, spacing)
        this.dirty = true
    }

    down(e)
    {
        const point = e.data.global
        if (this.resizeable)
        {
            const size = this.get('resize-border-size')
            const local = super.toLocal(point)
            if (pointInTriangle([local.x, local.y], [[this._windowWidth, this._windowHeight - size], [this._windowWidth, this.y + this._windowHeight], [this._windowWidth - size, this._windowHeight]]))
            {
                this.isDown = { x: point.x, y: point.y }
                this.resizing = { width: this._windowWidth, height: this._windowHeight }
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
            this.layout()
            this.emit('resizing', this)
            e.stopPropagation()
        }
        else if (this.draggable && this.isDown)
        {
            this.x = e.data.global.x + this.isDown.x
            this.y = e.data.global.y + this.isDown.y
            this.dirty = true
            e.stopPropagation()
        }
        else if (this.draggable)
        {
            const point = e.data.global
            const size = this.get('resize-border-size')
            const local = super.toLocal(point)
            if (pointInTriangle([local.x, local.y], [[this._windowWidth, this._windowHeight - size], [this._windowWidth, this.y + this._windowHeight], [this._windowWidth - size, this._windowHeight]]))
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

    getSize()
    {
        const child = this.content
        const sizes = this._wbs
        let x, y
        if (child.anchor)
        {
            x = child.x + child.x * child.anchor.x
            y = child.y + child.y * child.anchor.y
        }
        else
        {
            x = child.x
            y = child.y
        }
        const width = child.width
        const height = child.height
        sizes.x = (x + width > sizes.x) ? x + width : sizes.x
        sizes.y = (y + height > sizes.y) ? y + height : sizes.y
    }

    layout()
    {
        if (this.fit)
        {
            const spacing = this.get('spacing')
            this._wbs = { x: 0, y: 0 }
            this.getSize()
            this._windowWidth = this._wbs.x + spacing
            this._windowHeight = this._wbs.y + spacing
        }
        this.drawWindowShape()
    }

    fontStyle()
    {
        const style = {}
        style.fontFamily = this.get('font-family')
        style.fontSize = this.get('font-size')
        style.fill = this.get('foreground-color')
        return style
    }

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