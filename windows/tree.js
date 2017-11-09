const Window = require('./window')
const exists = require('exists')

module.exports = class Tree extends Window
{
    /**
     * @param {object} [options]
     */
    constructor(options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : false
        super(options)
        this.types.push('Tree')
    }

    layout()
    {
        const spacing = this.get('spacing')
        let width = spacing, height = spacing, largestWidth = 0, largestHeight = 0
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
    }
}