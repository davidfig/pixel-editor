const PIXI = require('pixi.js')
const THEME = require('./theme.json')

module.exports = class UI extends PIXI.Container
{
    /**
     * @param {object} [options]
     * @param {object} [options.theme]
     */
    constructor(options)
    {
        super()
        options = options || {}
        this.type = 'UI'
        this.theme = options.theme || THEME
    }

    layout(elapsed)
    {
        let dirty
        const queue = [...this.children]
        let i = 0
        while (i < queue.length)
        {
            const w = queue[i]
            if (w.types)
            {
                w.update(elapsed)
                if (w.dirty)
                {
                    dirty = true
                }
                queue.push(...w.children)
            }
            i++
        }
        if (!dirty)
        {
            return false
        }
        for (i = queue.length - 1; i >= 0; i--)
        {
            const w = queue[i]
            if (w.types)
            {
                queue[i].layout()
            }
        }
        return true
    }

    draw()
    {
        let dirty
        const queue = [...this.children]
        while (queue.length)
        {
            const w = queue.pop()
            if (w.types)
            {
                if (w.dirty)
                {
                    w.draw()
                    dirty = true
                    w.dirty = false
                }
                queue.push(...w.children)
            }
        }
        return dirty
    }

    update(elapsed)
    {
        if (this.layout(elapsed))
        {
            this.save()
            return this.draw()
        }
        else
        {
            return false
        }
    }

    save()
    {

    }
}

module.exports.Window = require('./window')
module.exports.Stack = require('./stack')
module.exports.Button = require('./button')
module.exports.Spacer = require('./spacer')
module.exports.Dialog = require('./dialog')
module.exports.Text= require('./text')
module.exports.Picture = require('./picture')