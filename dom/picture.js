const exists = require('exists')

const Window = require('./window')

const STYLES = {
}

module.exports = class Picture extends Window
{
    /**
     * @param {string} src of image
     * @param {object} [options]
     * @param {string} [options.text]
     * @param {texture} [options.picture]
     * @param {texture} [options.select]
     */
    constructor(src, options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : true
        super(STYLES, options)
        this.image = new Image()
        this.image.src = src
        this.div.appendChild(this.image)
    }

    get src()
    {
        return this.image.src
    }
    set src(value)
    {
        this.image.src = value
    }
}