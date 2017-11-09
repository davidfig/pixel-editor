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

    check()
    {
        this.editing = false
        let dirty
        const queue = [...this.children]
        let i = 0
        while (i < queue.length)
        {
            const w = queue[i]
            if (w.types)
            {
                if (w.editing)
                {
                    this.editing = true
                }
                if (w.dirty)
                {
                    dirty = true
                    w.dirty = false
                }
            }
            queue.push(...w.children)
            i++
        }
        return dirty
    }

    update()
    {
        return true//this.check()
    }
}

module.exports.Window = require('./window')
module.exports.Stack = require('./stack')
module.exports.Button = require('./button')
module.exports.Spacer = require('./spacer')
module.exports.Dialog = require('./dialog')
module.exports.Text= require('./text')
module.exports.EditText= require('./edit-text')
module.exports.Picture = require('./picture')
module.exports.Tree = require('./tree')
module.exports.Scroll = require('./scroll')