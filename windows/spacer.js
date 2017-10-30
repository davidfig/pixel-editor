const Window = require('./window')
const exists = require('exists')

module.exports = class Spacer extends Window
{
    constructor(width, height, options)
    {
        options = options || {}
        options.width = width
        options.height = height
        options.transparent = exists(options.transparent) ? options.transparent : true
        super(options)
        this.types.push('Spacer')
    }
}