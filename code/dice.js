const PIXI = require('pixi.js')

const UI = require('../../components/ui')
const State = require('./state')

const DICE = 50
const DICE_COLOR = [0x888888, 0xaa0000]
const SIZE = 10

module.exports = class Dice extends UI.Window
{
    constructor()
    {
        super({ width: DICE, height: DICE, theme: { 'background-color': '#eeeeee', 'spacing': 2 }})
        this.dice = []
        for (let i = 0; i < 9; i++)
        {
            const dice = this.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
            dice.anchor.set(0.5)
            dice.width = dice.height = SIZE
            this.dice.push(dice)
        }
        State.on('relative', this.layout, this)
        this.draw()
        this.layout()
    }

    draw()
    {
        const border = SIZE
        this.dice[0].position.set(border, border)
        this.dice[1].position.set(this.center.x, border)
        this.dice[2].position.set(this.right - border, border)
        this.dice[3].position.set(border, this.center.y)
        this.dice[4].position.set(this.center.x, this.center.y)
        this.dice[5].position.set(this.right - border, this.center.y)
        this.dice[6].position.set(border, this.bottom - border)
        this.dice[7].position.set(this.center.x, this.bottom - border)
        this.dice[8].position.set(this.right - border, this.bottom - border)
        for (let dice of this.dice)
        {
            dice.tint = DICE_COLOR[0]
        }
        switch (State.relative)
        {
            case 'top-left': this.dice[0].tint = DICE_COLOR[1]; break
            case 'top-center': this.dice[1].tint = DICE_COLOR[1]; break
            case 'top-right': this.dice[2].tint = DICE_COLOR[1]; break
            case 'center-left': this.dice[3].tint = DICE_COLOR[1]; break
            case 'center-center': this.dice[4].tint = DICE_COLOR[1]; break
            case 'center-right': this.dice[5].tint = DICE_COLOR[1]; break
            case 'bottom-left': this.dice[6].tint = DICE_COLOR[1]; break
            case 'bottom-center': this.dice[7].tint = DICE_COLOR[1]; break
            case 'bottom-right': this.dice[8].tint = DICE_COLOR[1]; break
        }
        this.dirty = true
    }

    down(x, y)
    {
        const point = {x, y}
        for (let i = 0; i < this.dice.length; i++)
        {
            if (this.dice[i].containsPoint(point))
            {
                switch (i)
                {
                    case 0: State.relative = 'top-left'; break
                    case 1: State.relative = 'top-center'; break
                    case 2: State.relative = 'top-right'; break
                    case 3: State.relative = 'center-left'; break
                    case 4: State.relative = 'center-center'; break
                    case 5: State.relative = 'center-right'; break
                    case 6: State.relative = 'bottom-left'; break
                    case 7: State.relative = 'bottom-center'; break
                    case 8: State.relative = 'bottom-right'; break
                }
                this.draw()
            }
        }
    }
}