const PIXI = require('pixi.js')
const exists = require('exists')
const pointInTriangle = require('point-in-triangle')

const THEME = require('./theme.json')

const MINIMUM_SIZE = 50

module.exports = class Window extends PIXI.Container
{
    /**
     * @param {object} options
     * @param {number} [options.width]
     * @param {number} [options.height]
     * @param {boolean} [options.fullscreen]
     * @param {number} [options.background]
     * @param {boolean} [options.draggable]
     * @param {boolean} [options.resizeable]
     * @param {boolean} [options.clickable]
     * @param {boolean} [options.clip]
     * @param {boolean} [options.spacing]
     * @param {boolean} [options.cursor]
     * @param {boolean} [options.radius]
     * @param {object} [options.theme]
     */
    constructor(options)
    {
        super()
        this.types = ['Window']
        options = options || {}
        this.sg = this.addChild(new PIXI.Graphics())
        this.g = this.addChild(new PIXI.Graphics())
        this._windowWidth = options.width
        this._windowHeight = options.height
        this._background = options.background
        this._resizeable = options.resizeable
        this._clickable = options.clickable
        this._radius = options.radius
        this.theme = options.theme || {}
        this.cursor = options.cursor
        if (exists(options.spacing))
        {
            this.spacing = options.spacing
        }
        this.draggable = exists(options.draggable) ? options.draggable : false
        this.clip = typeof options.clip === 'undefined' ? false : options.clip
        this.transparent = options.transparent
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

    get(name, type)
    {
        let result = exists(this.theme[name]) ? this.theme[name] : this._get(name)
        switch (type)
        {
            case 'color':
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

    get radius()
    {
        return this._radius || this.get('corners')
    }
    set radius(value)
    {
        this._radius = value
        this.dirty = true
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

    get background()
    {
        return exists(this._background) ? this._background : this.get('background-color', 'color')
    }
    set background(value)
    {
        this._background = value
        this.dirty = true
    }

    set width(value)
    {
        this._windowWidth = value
    }
    get width()
    {
        return this._windowWidth || this.calculateWidth()
    }

    set height(value)
    {
        this._windowHeight = value
    }
    get height()
    {
        return this._windowHeight || this.calculateHeight()
    }

    calculateWidth()
    {
        return 0
    }
    calculateHeight()
    {
        return 0
    }

    draw(isDown, shadowOff)
    {
        const background = exists(this._background) ? this._background : this.get('background-color', 'color')
        const radius = this.get('corners')
        if ((!this.shadowOff && !shadowOff) && !this.transparent && this.get('shadow-size'))
        {
            const size = this.get('shadow-size')
            this.sg
                .clear()
                .beginFill(0, this.get('shadow-alpha'))
                .drawRoundedRect(-size, -size, this.width + size * 2, this.height + size * 2, radius)
                .endFill()
            // this.sg.filters = [new PIXI.filters.BlurFilter(this.get('shadow-blur'))]
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
        if (this.isDown || isDown)
        {
            const size = this.get('selected-border-size') / 2
            this.g
                .lineStyle(size, this.get('selected-border-color', 'color'))
                .drawRoundedRect(size, size, this.width - size * 2, this.height - size * 2, radius)
        }
        if (this.clip)
        {
            if (!this.clipMask)
            {
                this.clipMask = this.g.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
            }
            this.clipMask.visible = true
            this.clipMask.width = this.width
            this.clipMask.height = this.height
            this.g.mask = this.clipMask
        }
        else
        {
            this.g.mask = null
            if (this.clipMask)
            {
                this.clipMask.visible = false
            }
        }
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
    }

    down(e)
    {
        const point = e.data.global
        if (this.resizeable)
        {
            const size = this.get('resize-border-size')
            const local = this.toLocal(point)
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
            this._windowWidth = this.resizing.width + e.data.global.x - this.isDown.x
            this._windowWidth = this._windowWidth < MINIMUM_SIZE ? MINIMUM_SIZE : this._windowWidth
            this._windowHeight = this.resizing.height + e.data.global.y - this.isDown.y
            this._windowHeight = this._windowHeight < MINIMUM_SIZE ? MINIMUM_SIZE : this._windowHeight
            this.dirty = true
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
            const local = this.toLocal(point)
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
            this.dirty = true
            this.emit('resize-end')
        }
        if (this.draggable && this.isDown)
        {
            this.isDown = false
            this.dirty = true
            this.emit('drag-end')
        }
    }

    layout() {}

    // if (this.fit)
    // {
    //     const measuring = {left: Infinity, right: 0, top: Infinity, bottom: 0}
    //     for (let w of this.children)
    //     {
    //         if (w.types)
    //         {
    //             measuring.left = (w.x < measuring.left) ? w.x : measuring.left
    //             measuring.right = (w.x + w.width > measuring.right) ? w.x + w.width : measuring.right
    //             measuring.top = (w.y < measuring.top) ? w.y : measuring.top
    //             measuring.bottom = (w.y + w.height > measuring.bottom) ? w.y + w.height : measuring.bottom
    //         }
    //     }
    //     this._windowWidth = measuring.right - measuring.left + this.spacing * 2
    //     this.height = measuring.bottom - measuring.top + this.spacing * 2
    //     if (measuring.left !== this.spacing)
    //     {
    //         for (let w of this.children)
    //         {
    //             if (w.types)
    //             {
    //                 w.x += this.spacing - measuring.left
    //             }
    //         }
    //     }
    //     if (measuring.top !== this.spacing)
    //     {
    //         for (let w of this.children)
    //         {
    //             if (w.types)
    //             {
    //                 w.y += this.spacing - measuring.top
    //             }
    //         }
    //     }
    //     for (let w of this.children)
    //     {
    //         if (w.types) w.layout()
    //     }
    // }
}