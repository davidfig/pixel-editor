const exists = require('exists')
const pointInTriangle = require('point-in-triangle')
const Input = require('yy-input')

const STYLES = {
    'background': 'rgb(200, 200, 200)',
    'box-shadow': '5px 5px  15px rgba(0,0,0,0.1)',
    'padding': '10px',
    'border-radius': '10px',
    'position': 'absolute'
}

const TRANSPARENT = {
    'background': 'transparent',
    'box-shadow': 'none'
}

const TITLE_BAR = {
    'background': '#559955',
    'color': 'white',
    'height': '1.5em',
    'line-height': '1.5em'
}

const TITLE_BAR_TEXT = {
    'padding-left': '0.25em',
    'color': 'white',
    'maxWidth': '85',
    'overflow': 'hidden'
}

const RESIZE_CORNER_COLOR = '#559955'

module.exports = class Window
{
    /**
     * @param {object} [options]
     * @param {number} [options.width]
     * @param {number} [options.height]
     * @param {number} [options.minWidth=50]
     * @param {number} [options.minHeight=50]
     * @param {number} [options.x=0]
     * @param {number} [options.y=0]
     * @param {object} [options.styles]
     * @param {boolean} [options.fullscreen]
     * @param {number} [options.background]
     * @param {boolean} [options.draggable=true]
     * @param {boolean} [options.resizeable]
     * @param {boolean} [options.clickable]
     * @param {boolean} [options.cursor]
     * @param {boolean} [options.radius]
     * @param {boolean} [options.titlebar]
     */
    constructor(styles, options)
    {
        this.children = []
        options = options || {}
        this.div = document.createElement('div')
        this.parent = options.parent || document.body
        this.parent.appendChild(this.div)
        if (options.width)
        {
            this.div.style.width = options.width + 'px'
        }
        else
        {
            this.div.style.width = 'fit-content'
            this.div.style.minWidth = exists(options.minWidth) ? options.minWidth : 50 + 'px'
        }
        if (options.height)
        {
            this.div.style.height = options.height + 'px'
        }
        else
        {
            this.div.style.height = 'fit-content'
            this.div.style.minHeight = exists(options.minHeight) ? options.minHeight : 50 + 'px'
        }
        for (let style in STYLES)
        {
            this.div.style[style] = STYLES[style]
        }
        if (options.transparent)
        {
            for (let style in TRANSPARENT)
            {
                this.div.style[style] = TRANSPARENT[style]
            }
        }
        if (options.styles)
        {
            for (let style in options.styles)
            {
                this.div.style[style] = options.styles[style]
            }
        }
        if (exists(options.background))
        {
            this.div.style.background = options.background
        }
        this.x = exists(options.x) ? options.x : 0
        this.y = exists(options.y) ? options.y : 0
        this.draggable = typeof options.draggable !== 'undefined' ? options.draggable : true
        this.resizeable = options.resizeable
        this.fullScreen = options.fullScreen
        this.titlebar = options.titlebar
        this.minWidth = exists(options.minWidth) ? options.minHeight : 50
        this.minHeight = exists(options.minHeight) ? options.minHeight : 50
        this.input = new Input()
        this.input.on('down', this.down.bind(this))
        this.input.on('up', this.up.bind(this))
        this.input.on('move', this.move.bind(this))
    }

    set x(value)
    {
        this.div.style.left = value + 'px'
    }
    get x()
    {
        return this.div.offsetLeft
    }

    set y(value)
    {
        this.div.style.top = value + 'px'
    }
    get y()
    {
        return this.div.offsetTop
    }

    set fullScreen(value)
    {
        this._fullScreen = value
        if (this._fullScreen)
        {
            this.fullScreenSave =
            {
                draggable: this.draggable,
                borderRadius: this.attr('border-radius'),
                width: this.div.offsetWidth,
                height: this.div.offsetHeight
            }
            this.div.style['border-radius'] = 0
            this.div.style.width = window.innerWidth + 'px'
            this.div.style.height = window.innerHeight + 'px'
            this.draggable = false
        }
        else if (this.fullScreenSave)
        {
            this.div.style['border-radius'] = this.fullScreenSave.borderRadius
            this.div.style.width = this.fullScreenSave.width
            this.div.style.height = this.fullScreenSave.height
            this.draggable = this.fullScreenSave.draggable
            this.fullScreenSave = null
        }
    }
    get fullScreen()
    {
        return this._fullScreen
    }

    set resizeable(value)
    {
        this._resizeable = value
        if (value)
        {
            this.drawResizeCorner()
        }
        else if (this.resizeCorner)
        {
            this.resizeCorner.style.display = 'none'
        }
    }
    get resizeable()
    {
        return this._resizeable
    }

    set titlebar(value)
    {
        this._titlebar = value
        if (exists(value))
        {
            this.drawTitlebar()
            if (this.titlebarDiv)
            {
                // this.div.style.paddingTop = this.titlebarDiv.offsetHeight + 'px'
            }
        }
        else if (this.titlebarDiv)
        {
            this.titlebarDiv.style.display = 'none'
        }
    }
    get titlebar()
    {
        return this._titlebar
    }

    updateAfterAdd()
    {
        this.resizeable = this.resizeable
        this.titlebar = this.titlebar
    }

    drawOverlay()
    {
        if (!this.overlay)
        {
            this.overlay = document.createElement('div')
            this.overlay.style.position = 'relative'
            this.overlay.style.width = '100%'
            this.overlay.style.height = '100%'
            this.div.appendChild(this.overlay)
        }

    }

    drawTitlebar()
    {
        if (!this.div.parentNode)
        {
            return
        }
        this.drawOverlay()
        if (!this.titlebarDiv)
        {
            this.titlebarDiv = document.createElement('div')
            this.titlebarDiv.style.position = 'absolute'
            const padRight = parseInt(this.attr('padding-right')) || 0
            const padLeft = parseInt(this.attr('padding-left')) || 0
            const padding = (padRight ? padRight : 0) + (padLeft ? padLeft : 0)
            this.titlebarDiv.style.width = 'calc(100% + ' + padding + 'px)'
            for (let style in TITLE_BAR)
            {
                this.titlebarDiv.style[style] = TITLE_BAR[style]
            }
            this.titlebarDiv.style.left = padLeft ? '-' + padLeft + 'px' : 0
            const top = this.attr('padding-top')
            this.titlebarDiv.style.top = exists(top) ? '-' + top : '0'
            this.overlay.appendChild(this.titlebarDiv)
            this.titlebarText = document.createElement('div')
            this.titlebarDiv.appendChild(this.titlebarText)
            for (let style in TITLE_BAR_TEXT)
            {
                this.titlebarText.style[style] = TITLE_BAR_TEXT[style]
            }
            this.titlebarText.style.height = this.titlebarDiv.style.height
        }
        this.titlebarText.innerText = this._titlebar
    }

    drawResizeCorner()
    {
        if (!this.div.parentNode)
        {
            return
        }
        this.drawOverlay()
        if (!this.corner)
        {
            this.corner = document.createElement('div')
            this.corner.style.position = 'absolute'
            this.corner.style.width = 0
            this.corner.style.height = 0
            const padRight = this.attr('padding-right')
            this.corner.style.right = padRight.length ? '-' + this.attr('padding-right') : '0'
            const padBottom = this.attr('padding-bottom')
            this.corner.style.bottom = padBottom.length ? '-' + this.attr('padding-bottom') : '0'
            this.corner.style.borderBottom = '30px solid ' + RESIZE_CORNER_COLOR
            this.corner.style.borderLeft = '30px solid transparent'
            this.corner.style.cursor = 'se-resize'
            this.overlay.appendChild(this.corner)
        }
        else
        {
            this.resizeCorner.style.display = 'block'
        }
    }

    attr(attr)
    {
        return window.getComputedStyle(this.div).getPropertyValue(attr)
    }

    px(attr)
    {
        let style = window.getComputedStyle(this.div).getPropertyValue(attr)
        if (!style)
        {
            return 0
        }
        else
        {
            return parseInt(style.replace('px', ''))
        }
    }

    downResize(x, y, data)
    {
        this.isDownResize = { x, y, width: this.div.offsetWidth, height: this.div.offsetHeight }
        data.event.stopPropagation()
    }

    down(x, y, data)
    {
        if (this.resizeable)
        {
            const size = 30
            if (pointInTriangle([x, y], [
                [this.div.offsetLeft + this.div.offsetWidth, this.div.offsetTop + this.div.offsetHeight - size],
                [this.div.offsetLeft + this.div.offsetWidth, this.div.offsetTop + this.div.offsetHeight],
                [this.div.offsetLeft + this.div.offsetWidth - size, this.div.offsetTop + this.div.offsetHeight]
            ]))
            {
                {
                    this.isDownResize = { x, y, width: this.div.offsetWidth, height: this.div.offsetHeight }
                    return true
                }
            }
        }
        if (this.draggable)
        {
            if (x >= this.div.offsetLeft && x <= this.div.offsetLeft + this.div.offsetWidth && y >= this.div.offsetTop && y <= this.div.offsetTop + this.titlebarDiv.offsetHeight)
            {
                this.isDown = { x: x - this.div.offsetLeft, y: y - this.div.offsetTop }
                data.event.stopPropagation()
                return true
            }
        }
    }

    move(x, y, data)
    {
        if (this.isDown)
        {
            this.div.style.left = x - this.isDown.x + 'px'
            this.div.style.top = y - this.isDown.y + 'px'
            return true
        }
        else if (this.isDownResize)
        {
            let width = this.isDownResize.width + x - this.isDownResize.x
            width = width < this.minWidth ? this.minWidth : width
            let height = this.isDownResize.height + y - this.isDownResize.y
            height = height < this.minHeight ? this.minHeight : height
            this.div.style.width = width - this.px('padding-left') - this.px('padding-right') + 'px'
            this.div.style.height = height - this.px('padding-top') - this.px('padding.bottom') + 'px'
            return true
        }
    }

    up(x, y, data)
    {
        this.isDown = null
        this.isDownResize = null
        return true
    }

    add(child, index)
    {
        index = index || this.children.length
        child.parentWindow = this
        this.div.appendChild(child.div)
        this.children[index] = child
        child.updateAfterAdd()
        return child
    }

    remove(child)
    {
        const index = this.children.indexOf(child)
        if (index)
        {
            this.children.splice(this.children.indexOf(child), 1)
            child.parentWindow = null
            child.div.remove()
        }
    }

    appendChild(div)
    {
        this.div.appendChild(div)
    }
}