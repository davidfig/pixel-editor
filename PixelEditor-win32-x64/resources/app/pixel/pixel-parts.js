const PIXI = require('pixi.js')
const Ease = require('pixi-ease')
const Random = require('yy-random')

/**
 * @param {object} data imported from .json (from Pixel-Editor)
 * @param {RenderSheet} sheet - rendersheet for rendering pixel sprite
 * @event stop  - animation finishes and stops
 * @event loop - animation loops
 * @event link - animation link to another animation
 * @event frame - animation changes frame
 */

module.exports = class PixelParts extends PIXI.Container
{
    /**
     * @param {object} data
     * @param {RenderSheet} sheet
     */
    constructor(data, sheet)
    {
        super()
        if (data)
        {
            this.w = data.width
            this.h = data.height
            this.name = data.name
            this.parts = data.parts
            for (let i = 0; i < this.parts.length; i++)
            {
                this.parts.sprite = this.addChild(new PIXI.Sprite())
                this.parts.sprite.anchor.set(0.5)
                this.parts.sprite.position.set(data.middle.x, data.middle.y)
            }
            this.frames = data.frames
            this.animations = data.animations
            this.colors = data.colors
            this.sheet = sheet
            this.render()
        }
    }

    /**
     * adds the parts to the RenderSheet
     * @param {boolean} force
     */
    render(force)
    {
        if (force || !this.sheet.exists(this.name + '-0'))
        {
            for (let i = 0; i < this.frames.length; i++)
            {
                this.sheet.add(this.name + '-' + i, draw, measure, this.frames[i])
            }
        }
    }

    /**
     * adds the frames to the RenderSheet
     * @param {object} data from Pixel-Editor
     * @param {RenderSheet} sheet
     */
    static add(data, sheet)
    {
        for (let i = 0; i < data.frames.length; i++)
        {
            sheet.add(data.name + '-' + i, draw, measure, data.frames[i])
        }
    }

    /**
     * move sprite to a different location
     * @param {number} x
     * @param {number} y
     * @param {number} duration
     * @param {object} [options]
     * @param {string|function} [options.ease]
     * @param {number} options.duration
     * @param {number} options.speed (n / millisecond)
     */
    move(x, y, options)
    {
        if (options.duration)
        {
            this.moving = new Ease.to(this, { x, y }, options.duration, { ease: options.ease })
        }
        else if (options.speed)
        {
            this.moving = new Ease.target(this, {x, y}, options.speed)
        }
    }

    /**
     * starts a named animation
     * @param {string} name of animation
     * @param {boolean} reverse - flip the sprite
     */
    animate(name, reverse)
    {
        this.scale.x = Math.abs(this.scale.x) * (reverse ? -1 : 1)
        this.animation = this.animations[name]
        if (this.animation)
        {
            this.index = 0
            this.updateFrame(0)
            this.stop = false
        }
        else
        {
            this.stop = true
        }
    }

    /**
     * updates a frame
     * @private
     * @param {number} leftover
     */
    updateFrame(leftover)
    {
        let entry = this.animation[this.index]
        if (typeof entry[0] === 'string')
        {
            switch (entry[0])
            {
                case 'loop':
                    this.index = 0
                    entry = this.animation[0]
                    this.updateFrame(leftover)
                    this.emit('loop', this)
                    return

                case 'unique':
                    let pick
                    do
                    {
                        pick = Random.pick(entry[1])
                    }
                    while (this.last === pick)
                    this.last = pick
                    entry = [pick, entry[2]]
                    break

                case 'link':
                    this.animation = this.animations[entry[1]]
                    this.index = 0
                    this.updateFrame(leftover)
                    this.emit('link', this)
                    return
            }
        }
        if (Array.isArray(entry[1]))
        {
            this.next = Random.range(entry[1][0], entry[1][1]) + leftover
        }
        else
        {
            this.next = entry[1] + leftover
        }
        this.texture = this.sheet.getTexture(this.name + '-' + entry[0])
        this.emit('frame', this)
    }

    /**
     * updates the pixel
     * @param {number} elapsed
     * @return {boolean} whether the sprite changed
     */
    update(elapsed)
    {
        if (!this.stop)
        {
            this.next -= elapsed
            if (this.next <= 0)
            {
                this.index++
                if (this.index === this.animation.length)
                {
                    this.stop = true
                    this.emit('stop', this)
                }
                else
                {
                    this.updateFrame(this.next)
                    return true
                }
            }
        }
        if (this.moving && this.moving.update(elapsed))
        {
            this.moving = null
        }
    }

    /**
     * change the sprite to a certain frame
     * @param {number} index of frame
     */
    frame(index)
    {
        this.texture = this.sheet.getTexture(this.name + '-' + index)
    }
}

/**
 * used by RenderSheet to render the frame
 * @private
 * @param {CanvasRenderingContext2D} c
 * @param {object} frame
 */
function draw(c, frame)
{
    const pixels = frame.data
    for (let y = 0; y < frame.height; y++)
    {
        for (let x = 0; x < frame.width; x++)
        {
            const color = pixels[x + y * frame.width]
            if (color !== null)
            {
                let hex = color.toString(16)
                while (hex.length < 6)
                {
                    hex = '0' + hex
                }
                c.fillStyle = '#' + hex
                c.beginPath()
                c.fillRect(x, y, 1, 1)
            }
        }
    }
}

/**
 * used by RenderSheet to render the frame
 * @param {CanvasRenderingContext2D} c
 * @param {object} params
 */
function measure(c, params)
{
    return { width: params.width, height: params.height }
}