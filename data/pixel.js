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
    constructor(data, sheet)
    {
        super();
        if (data)
        {
            this.name = data.name;
            this.frames = data.frames;
            this.animations = data.animations;
        }
        this.rendersheet = sheet;
    }

    sheet(sheet)
    {
        this.rendersheet = sheet || this.rendersheet;
        for (let i = 0; i < this.frames.length; i++)
        {
            const frame = this.frames[i];
            this.rendersheet.add(this.name + '-' + i, draw, measure, frame);
        }
    }

    animate(name)
    {
        this.animation = this.animations[name];
        if (this.animation)
        {
            this.index = 0;
            this.updateFrame(0);
            this.stop = false;
        }
        else
        {
            this.stop = true;
        }
    }

    updateFrame(leftover)
    {
        let entry = this.animation[this.index];
        if (typeof entry[0] === 'string')
        {
            switch (entry[0])
            {
                case 'loop':
                    this.index = 0;
                    entry = this.animation[0];
                    break;

                case 'unique':
                    let pick;
                    do
                    {
                        pick = Random.pick(entry[1]);
                    }
                    while (this.last = pick);
                    this.last = pick;
                    entry = [pick, entry[2]];
                    break;

                case 'link':
                    this.animation = this.animations[entry[1]];
                    this.updateFrame(leftover);
                    return;
            }
        }
        if (Array.isArray(entry[1]))
        {
            this.next = Random.range(entry[1][0], entry[1][1]) + leftover;
        }
        else
        {
            this.next = entry[1] + leftover;
        }
        this.texture = this.rendersheet.getTexture(this.name + '-' + entry[0]);
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
                this.stop = true;
            }
            else
            {
                this.updateFrame(this.next);
                return true;
            }
        }
    }

    frame(i)
    {
        this.stop = true;
        this.texture = this.rendersheet.getTexture(this.name + '-' + i);
    }
}

module.exports = Pixel;