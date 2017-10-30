const exists = require('exists')

const Stack = require('./stack')
const Text = require('./text')
const Button = require('./button')

module.exports = class Dialog extends Stack
{
    /**
     * @param {object} options
     * @param {string} [options.text]
     * @param {string} [options.buttons]
     * @param {boolean} [options.draggable=true]
     * @param {number} [options.wrap=window.innerWidth/2]
     */
    constructor(text, options)
    {
        options = options || {}
        options.transparent = exists(options.transparent) ? options.transparent : false
        options.draggable = exists(options.draggable) ? options.draggable : true
        super(options)
        this.types.push('Dialog')
        this.wrap = exists(options.wrap) ? options.wrap : window.innerWidth / 2
        this.addChild(new Text(text, { wrap: this.wrap }))
        const buttons = this.addChild(new Stack({ horizontal: true, sameWidth: true }))
        this.buttons = []
        this.buttons.push(buttons.addChild(new Button({ text: 'OK' })))
        this.buttons.push(buttons.addChild(new Button({ text: 'Cancel' })))
    }

    getButton(text)
    {
        for (let button of this.buttons)
        {
            if (button.text === text)
            {
                return button
            }
        }
    }
}