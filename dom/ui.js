const Input = require('yy-input')

module.exports = class UI
{
    /**
     * @param {object} [options]
     * @param {object} [options.parent]
     */
    constructor(options)
    {
        options = options || {}
        this.parent = options.parent || document.body
        this.children = []
        this.pointers = []
        // this.input = new Input({ div: this.div })
        // this.input.on('down', this.handleDown, this)
        // this.input.on('move', this.handleMove, this)
        // this.input.on('up', this.handleUp, this)
    }

    handleDown(x, y, data)
    {
        for (let i = this.children.length - 1; i >= 0; i--)
        {
            const w = this.children[i]
            if (w.down && w.down(x, y, data))
            {
                this.pointers[data.id] = w
                return
            }
        }
    }

    handleMove(x, y, data)
    {
        if (this.pointers[data.id])
        {
            if (this.pointers[data.id].move(x, y, data))
            {
                return
            }
        }
        else
        {
            for (let i = this.children.length - 1; i >= 0; i--)
            {
                const w = this.children[i]
                if (w.move(x, y, data))
                {
                    return
                }
            }
        }
    }

    handleUp(x, y, data)
    {
        if (this.pointers[data.id])
        {
            if (this.pointers[data.id].up(x, y, data))
            {
                this.pointers[data.id] = null
                return
            }
        }
    }
}

module.exports.Window = require('./window')
module.exports.Button = require('./button')