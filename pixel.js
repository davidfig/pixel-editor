const Random = require('yy-random');

class Pixel
{
    constructor()
    {
        if (arguments.length === 1)
        {
            this.load(arguments[0]);
        }
        else
        {
            this._width = arguments[0];
            this._height = arguments[1];
            this.data = [];

// temporary
            for (let i = 0; i < this._width * this._height; i++)
            {
                this.data[i] = Random.chance() ? null : 0;
            }
        }
        this.undo = [];
    }

    set(x, y, value)
    {
        this.undo.push({ type: 'set', x, y });
        this.data[x + y * this.width] = value;
    }

    get(x, y)
    {
        return this.data[x + y * this.width];
    }

    get width()
    {
        return this._width;
    }

    set width(value)
    {
        if (this._width !== value)
        {
            this.undo.push({ type: 'width', value, data: this.data.slice(0) });
            const data = [];
            for (let y = 0; y < this._height; y++)
            {
                for (let x = 0; x < value; x++)
                {
                    data[x + y * value] = (x < this._width) ? this.get(x, y) : null;
                }
            }
            this.data = data;
            this._width = value;
        }
    }

    get height()
    {
        return this._height;
    }

    set height(value)
    {
        if (this._height !== value)
        {
            this.undo.push({ type: 'height', value, data: this.data.slice(0) });
            const data = [];
            for (let y = 0; y < value; y++)
            {
                for (let x = 0; x < this._width; x++)
                {
                    data[x + y * this._width] = (y < this._height) ? this.get(x, y) : null;
                }
            }
            this.data = data;
            this._height = value;
        }
    }

    load(filename)
    {

    }

    save()
    {
    }
}

module.exports = Pixel;