const Window = require('./window')
const exists = require('exists')

module.exports = class Scroll extends Window
{
    /**
     * @param {object} [options]
     */
    constructor(options)
    {
        options = options || {}
        options.clip = exists(options.clip) ? options.clip : true
        super(options)
        this.types.push('Scroll')
    }
}