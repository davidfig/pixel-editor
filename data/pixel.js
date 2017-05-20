const Random = require('yy-random');

function draw(c, frame)
{
    const pixels = frame.data;
    for (let y = 0; y < frame.height; y++)
    {
        for (let x = 0; x < frame.height; x++)
        {
            const color = pixels[x + y * frame.width];
            if (color !== null)
            {
                let hex = color.toString(16);
                while (hex.length < 6)
                {
                    hex = '0' + hex;
                }
                c.fillStyle = '#' + hex;
                c.beginPath();
                c.fillRect(x, y, 1, 1);
            }
        }
    }
}

function measure(c, params)
{
    return { width: params.width, height: params.height };
}

class Pixel extends PIXI.Sprite
{
    constructor(data)
    {
        super();
        if (data)
        {
            this.name = data.name;
            this.frames = data.frames;
            this.animations = data.animations;
        }
    }

    sheet(sheet)
    {
        Pixel.sheet = sheet;
        for (let i = 0; i < this.frames.length; i++)
        {
            const frame = this.frames[i];
            sheet.add(this.name + '-' + i, draw, measure, frame);
        }
    }

    animate(name)
    {
        this.animation = this.animations[name];
        this.index = 0;
        this.updateFrame(0);
    }

    updateFrame(leftover)
    {
        const entry = this.animation[this.index];
        if (typeof entry[0] === 'string')
        {
            switch (entry[0])
            {
                case 'loop':
                    this.index = 0;
                    this.entry = this.animation[0];
                    break;
            }
        }
        if (Array.isArray(this.entry[1]))
        {
            this.next = Random.range(this.entry[1][0], this.entry[1][1]) + leftover;
        }
        else
        {
            this.next = this.entry[1] + leftover;
        }
        this.texture = Pixel.sheet.getTexture(this.name + '-' + this.entry[0]);
    }

    update(elapsed)
    {
        if (this.stop)
        {
            return;
        }
        this.next -= elapsed;
        if (this.next <= 0)
        {
            this.index++;
            if (this.index === this.animation.length)
            {
                this.next = -1;
            }
            this.updateFrame(this.next);
        }
    }

    frame(i)
    {
        this.stop = true;
        this.texture = Pixel.sheet.getTexture(this.name + '-' + i);
    }
}

module.exports = Pixel;