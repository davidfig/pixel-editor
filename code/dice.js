const PIXI = require('pixi.js')

const UI = require('../windows/ui')
const State = require('./state')
const Settings = require('./settings')

const DICE = 50
const DICE_COLOR = [0x888888, 0xaa0000]
const SIZE = 10

module.exports = class Dice extends UI.Window
{
    constructor()
    {
        super({ width: DICE, height: DICE, clickable: true, theme: { 'background-color': '#eeeeee' }})
        this.dice = []
        for (let i = 0; i < 5; i++)
        {
            const dice = this.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
            dice.anchor.set(0.5)
            dice.width = dice.height = SIZE
            this.dice.push(dice)
        }
        this.on('click', this.clicked, this)
        State.on('relative', this.draw, this)
    }

    draw()
    {
        super.draw()
        const border = SIZE
        this.dice[0].position.set(border, border)
        this.dice[1].position.set(DICE - border, border)
        this.dice[2].position.set(DICE / 2, DICE / 2)
        this.dice[3].position.set(border, DICE - border)
        this.dice[4].position.set(DICE - border, DICE - border)
        for (let dice of this.dice)
        {
            dice.tint = DICE_COLOR[0]
        }
        switch (State.relative)
        {
            case 'top-left': this.dice[0].tint = DICE_COLOR[1]; break
            case 'top-right': this.dice[1].tint = DICE_COLOR[1]; break
            case 'center': this.dice[2].tint = DICE_COLOR[1]; break
            case 'bottom-left': this.dice[3].tint = DICE_COLOR[1]; break
            case 'bottom-right': this.dice[4].tint = DICE_COLOR[1]; break
        }
    }

    clicked(e)
    {
        for (let i = 0; i < this.dice.length; i++)
        {
            if (this.dice[i].containsPoint(e.data.global))
            {
                switch (i)
                {
                    case 0: State.relative = 'top-left'; break
                    case 1: State.relative = 'top-right'; break
                    case 2: State.relative = 'center'; break
                    case 3: State.relative = 'bottom-left'; break
                    case 4: State.relative = 'bottom-right'; break
                }
                this.dirty = true
            }
        }
    }
}