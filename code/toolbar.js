const exists = require('exists')

const UI = require('../windows/UI')

const State = require('./state')
const Sheet = require('./sheet')

const BUTTONS = ['select', 'pen', 'paint']

module.exports = class Toolbar extends UI.Stack
{
    constructor()
    {
        super({ draggable: true, transparent: false })
        this.addChild(new UI.Spacer())
        this.buttons = []
        for (let image of BUTTONS)
        {
            const button = this.addChild(new UI.Button({ picture: Sheet.getTexture(image) }))
            button.on('pressed', this.pressed, this)
            this.buttons.push(button)
        }
        this.buttons[0].select = true
        this.stateSetup('toolbar')
    }

    pressed(target)
    {
        for (let button of this.buttons)
        {
            button.select = (button === target)
        }
    }

    stateSetup(name)
    {
        this.name = name
        this.state = new State()
        const place = this.state.get(name)
        if (exists(place))
        {
            this.position.set(place.x, place.y)
        }
        this.on('drag-end', this.dragged, this)
    }

    dragged()
    {
        this.state.set(this.name, this.x, this.y)
    }
}