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
            this.current = 0;
            this.frames = [{ name: '1', width: arguments[0], height: arguments[1], data: [], undo: [], redo: [] }];
            for (let i = 0; i < this.width * this.height; i++)
            {
                this.data[i] = null;
            }
        }
    }

    duplicate(index)
    {
        if (index < this.frames.length)
        {
            const frame = this.frames[index];
            this.frames.push({ name: (this.frames.length + 1).toString(), width: frame.width, height: frame.height, data: frame.data, undo: frame.undo, redo: frame.redo });
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

    get name()
    {
        return this.frames[this.current].name;
    }

    get data()
    {
        return this.frames[this.current].data;
    }
    set data(value)
    {
        this.frames[this.current].data = value;
    }

    get width()
    {
        return this.frames[this.current].width;
    }
    set width(value)
    {
        value = parseInt(value);
        if (this.width !== value && !isNaN(value) && value > 0)
        {
            this.undoSave();
            const data = [];
            for (let y = 0; y < this.height; y++)
            {
                for (let x = 0; x < value; x++)
                {
                    data[x + y * value] = (x < this.width) ? this.get(x, y) : null;
                }
            }
            this.data = data;
            this.frames[this.current].width = value;
        }
    }

    get height()
    {
        return this.frames[this.current].height;
    }

    set height(value)
    {
        value = parseInt(value);
        if (this.height !== value && !isNaN(value) && value > 0)
        {
            this.undoSave();
            const data = [];
            for (let y = 0; y < value; y++)
            {
                for (let x = 0; x < this.width; x++)
                {
                    data[x + y * this.width] = (y < this.height) ? this.get(x, y) : null;
                }
            }
            this.data = data;
            this.frames[this.current].height = value;
        }
    }

    get undo()
    {
        return this.frames[this.current].undo;
    }
    set undo(value)
    {
        this.frames[this.current].undo = value;
    }

    get redo()
    {
        return this.frames[this.current].redo;
    }
    set redo(value)
    {
        this.frames[this.current].redo = value;
    }

    undoSave()
    {
        while (this.undo.length > 10000)
        {
            this.undo.shift();
        }
        this.undo.push({ width: this.width, height: this.height, data: this.data.slice(0) });
        this.redo = [];
    }

    undoOne()
    {
        if (this.undo.length)
        {
            this.redo.push({ width: this.width, height: this.height, data: this.data.slice(0) });
            const undo = this.undo.pop();
            this.frames[this.current].width = undo.width;
            this.frames[this.current].height = undo.height;
            this.frames[this.current].data = undo.data;
        }
    }

    redoOne()
    {
        if (this.redo.length)
        {
            const redo = redo.pop();
            this.frames[this.current].width = redo.width;
            this.frames[this.current].height = redo.height;
            this.frames[this.current].data = redo.data;
            this.undo.push({ width: this.width, height: this.height, data: this.data.slice(0) });
        }
    }

    load(filename)
    {
        try
        {
            const load = jsonfile.readFileSync(filename);
            this.filename = filename;
            this.current = load.current;
            this.frames = load.frames;
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