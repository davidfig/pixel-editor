const Window = require('./window')
const exists = require('exists')

module.exports = class Stack extends Window
{
    /**
     * @param {object} [options]
     * @param {boolean} [options.transparent=true]
     * @param {boolean} [options.horizontal]
     * @param {boolean} [options.sameWidth]
     * @param {boolean} [options.sameHeight]
     * @param {boolean} [options.justify=center]
     */
    constructor(options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : true
        super(options)
        this.types.push('Stack')
        this._horizontal = options.horizontal
        this._sameWidth = options.sameWidth
        this._sameHeight = options.sameHeight
        this._justify = options.justify
    }

    get horizontal()
    {
        return this._horizontal
    }
    set horizontal(value)
    {
        this._horizontal = value
        this.dirty = true
    }
    get sameHeight()
    {
        return this._sameHeight
    }
    set sameHeight(value)
    {
        this._sameHeight = value
        this.dirty = true
    }

    get sameWidth()
    {
        return this._sameWidth
    }
    set sameWidth(value)
    {
        this._sameWidth = value
        this.dirty = true
    }

    get justify()
    {
        return this._justify
    }
    set justify(value)
    {
        this._justify = value
        this.dirty = true
    }

    layout()
    {
        const spacing = this.get('spacing')
        let width = 0, height = 0, largestWidth = 0, largestHeight = 0
        for (let w of this.children)
        {
            if (w.types)
            {
                largestWidth = (w.width > largestWidth) ? w.width : largestWidth
                largestHeight = (w.height > largestHeight) ? w.height : largestHeight
                width += w.width + spacing
                height += w.height + spacing
            }
        }
        if (this.sameWidth)
        {
            for (let w of this.children)
            {
                if (w.types && w.width !== largestWidth)
                {
                    width += (largestWidth - w.width)
                    w._windowWidth = largestWidth
                    w.layout()
                }
            }
        }
        if (this.sameHeight)
        {
            for (let w of this.children)
            {
                if (w.types && w.height !== largestHeight)
                {
                    height += (largestHeight - w.height)
                    w._windowHeight = largestHeight
                    w.layout()
                }
            }
        }
        if (this.horizontal)
        {
            this._windowWidth = width
            this._windowHeight = largestHeight + spacing * 2
        }
        else
        {
            this._windowWidth = largestWidth + spacing * 2
            this._windowHeight = height
        }
        let i = spacing
        for (let w of this.children)
        {
            if (w.types)
            {
                if (this.horizontal)
                {
                    w.x = i
                    i += w.width + spacing
                    switch (this.justify)
                    {
                        case 'left':
                            w.y = spacing
                            break

                        case 'right':
                            w.y = spacing * 2 + largestHeight - w.width
                            break

                        default:
                            w.y = largestHeight / 2 - w.height / 2 + spacing
                    }
                }
                else
                {
                    w.y = i
                    i += w.height + spacing
                    switch (this.justify)
                    {
                        case 'left':
                            w.x = spacing
                            break

                        case 'right':
                            w.x = spacing * 2 + largestWidth - w.width
                            break

                        default:
                            w.x = largestWidth / 2 - w.width / 2 + spacing
                    }
                }
            }
        }
        super.layout()
    }
}