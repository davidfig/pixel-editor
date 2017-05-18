const jsonfile = require('jsonfile');

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
            for (let i = 0; i < this._width * this._height; i++)
            {
                this.data[i] = null;
            }
            this.undo = [];
            this.redo = [];
        }
    }

    set(x, y, value, noUndo)
    {
        if (x < this.width && x >= 0 && y < this.height && y >= 0)
        {
            if (!noUndo)
            {
                this.undoSave();
            }
            this.data[x + y * this.width] = value;
        }
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
        value = parseInt(value);
        if (this._width !== value && !isNaN(value) && value > 0)
        {
            this.undoSave();
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
        value = parseInt(value);
        if (this._height !== value && !isNaN(value) && value > 0)
        {
            this.undoSave();
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

    undoSave()
    {
        while (this.undo.length > 10000)
        {
            this.undo.shift();
        }
        this.undo.push({ width: this._width, height: this._height, data: this.data.slice(0) });
        this.redo = [];
    }

    undoOne()
    {
        if (this.undo.length)
        {
            this.redo.push({ width: this._width, height: this._height, data: this.data.slice(0) });
            const undo = this.undo.pop();
            this._width = undo.width;
            this._height = undo.height;
            this.data = undo.data;
        }
    }

    redoOne()
    {
        if (this.redo.length)
        {
            const redo = this.redo.pop();
            this._width = redo.width;
            this._height = redo.height;
            this.data = redo.data;
            this.undo.push({ width: this._width, height: this._height, data: this.data.slice(0) });
        }
    }

    load(filename)
    {
        try
        {
            const load = jsonfile.readFileSync(filename);
            this.filename = filename;
            this._width = load._width;
            this._height = load._height;
            this.data = load.data;
            this.undo = load.undo || [];
            this.redo = load.redo || [];
            return true;
        }
        catch (e)
        {
            return null;
        }
    }

    save(filename)
    {
        filename = filename || this.filename;
        jsonfile.writeFileSync(filename, this);
    }
}

module.exports = Pixel;