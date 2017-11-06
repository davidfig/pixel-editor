const PIXI = require('pixi.js')
const Pixel = require('./pixel')

module.exports = class Scene extends PIXI.Container
{
    /**
     * @param {object} data
     * @param {object} sprites
     * @param {RenderSheet} sheet
     *
     * @event callback(timeline) emits an event each time a timelime element starts
     */
    constructor(data, sprites, sheet)
    {
        super()
        this.time = 0
        this.index = 0
        if (data)
        {
            this.timeline = data.timeline
            this.options = data.options || {}
            this.pixels = data.pixels
            this.spritesData = sprites
            this.w = data.width
            this.h = data.height
            this.sheet = sheet
            this.populate()
        }
    }

    rendersheet(sheet)
    {
        sheet = sheet || this.sheet
        for (let sprite of this.sprites)
        {
            sprite.render(sheet)
        }
    }

    populate()
    {
        this.removeChildren()
        if (this.options.sortY)
        {
            this.nosort = this.addChild(new PIXI.Container())
            this.sorted = this.addChild(new PIXI.Container())
        }
        this.sprites = []
        for (let name of this.pixels)
        {
            let data
            if (this.spritesData)
            {
                data = this.spritesData[name]
            }
            else
            {
                data = require(name)
            }
            let sprite
            if (this.options.sortY)
            {
                if (this.options.noSort && this.options.noSort.indexOf(data.name) !== -1)
                {
                    sprite = this.nosort.addChild(new Pixel(data, this.sheet))
                }
                else
                {
                    sprite = this.sorted.addChild(new Pixel(data, this.sheet))
                }
            }
            else
            {
                sprite = this.addChild(new Pixel(data, this.sheet))
            }
            sprite.file = name
            sprite.anchor.set(0.5)
            sprite.placed = false
            sprite.visible = false
            this.sprites.push(sprite)
        }
    }

    get(name)
    {
        for (let sprite of this.sprites)
        {
            if (sprite.name === name)
            {
                return sprite
            }
        }
    }

    update(elapsed)
    {
        this.time += elapsed
        if (this.index !== this.timeline.length)
        {
            for (let index = this.index; index < this.timeline.length; index++)
            {
                const timeline = this.timeline[index]
                if (timeline.time <= this.time)
                {
                    const sprite = this.get(timeline['sprite'])
                    switch (timeline['type'])
                    {
                        case 'place':
                            sprite.visible = true
                            sprite.placed = true
                            sprite.position.set(timeline.x, timeline.y)
                            sprite.frame(0)
                            this.emit('callback', timeline)
                            break

                        case 'unplace':
                            sprite.visible = false
                            sprite.placed = false
                            this.emit('callback', timeline)
                            break

                        case 'frame':
                            sprite.frame(timeline.frame)
                            sprite.stop = true
                            sprite.scale.x = Math.abs(sprite.scale.x) * (timeline.flip ? -1 : 1)
                            this.emit('callback', timeline)
                            break

                        case 'animate':
                            sprite.animate(timeline.animate)
                            sprite.scale.x = Math.abs(sprite.scale.x) * (timeline.flip ? -1 : 1)
                            this.emit('callback', timeline)
                            break

                        case 'move':
                            sprite.move(timeline.x, timeline.y, { duration: timeline.duration, ease: timeline.ease })
                            this.emit('callback', timeline)
                            break

                        case 'event':
                            this.emit('callback', timeline)
                            break
                    }
                    this.index = index + 1
                }
                else
                {
                    break
                }
            }
        }
        for (let sprite of this.sprites)
        {
            sprite.update(elapsed)
        }
        if (this.options.sortY)
        {
            this.sorted.children.sort((a, b) => { return a.y - b.y })
        }
        if (this.index === this.timeline.length)
        {
            return true
        }
    }
}