const remote = require('electron').remote;
const fs = require('fs');
const jsonfile = require('jsonfile');
const path = require('path');

const Pixel = require('./pixel');

const DEFAULT = [15, 15];

class PixelEditor extends Pixel
{
    constructor(filename)
    {
        super();
        if (!filename)
        {
            this.frames = [{ width: DEFAULT[0], height: DEFAULT[1], data: [] }];
            this.animations = {};
            for (let i = 0; i < DEFAULT[0] * DEFAULT[1]; i++)
            {
                this.frames[0].data[i] = null;
            }
            let i = 0;
            do
            {
                i++;
                filename = path.join(remote.app.getPath('temp'), 'pixel-' + i + '.json');
            }
            while (fs.existsSync(filename));
            this.filename = filename;
            this.name = path.basename(filename, '.json');
            this.editor = { current: 0, frames: [{ undo: [], redo: [] }] };
            this.save();
        }
        else
        {
            this.filename = filename;
            this.load();
            this.name = this.name || path.basename(filename, '.json');
        }
    }

    add(index)
    {
        const add = { width: DEFAULT[0], height: DEFAULT[1], data: [] };
        for (let i = 0; i < DEFAULT[0] * DEFAULT[0]; i++)
        {
            add.data[i] = null;
        }
        if (typeof index !== 'undefined')
        {
            this.frames.splice(index, 0, add);
            this.editor.frames.splice(index, 0, add);
        }
        else
        {
            this.frames.push(add);
            this.editor.frames.push(add);
        }
    }

    remove(index)
    {
        if (index < this.frames.length)
        {
            this.frames.splice(index, 1);
            this.save();
        }
    }

    duplicate(index)
    {
        if (index < this.frames.length)
        {
            const frame = this.frames[index];
            this.frames.push({ width: frame.width, height: frame.height, data: frame.data });
            const editor = this.editor.frames[index];
            this.editor.frames.push({ undo: editor.undo, redo: editor.redo });
            this.save();
        }
    }

    delete(index)
    {
        if (index < this.frames.length && this.frames.length > 1)
        {
            this.frames.splice(index, 1);
            this.editor.frames.splice(index, 1);
            this.save();
        }
    }

    blank()
    {
        const data = [];
        for (let i = 0; i < this.width * this.height; i++)
        {
            data.push(null);
        }
        this.frames.push({ width: this.width, height: this.height, data });
        this.editor.frames.push({ undo: [], redo: [] });
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
        this.save();
    }
    get(x, y)
    {
        return this.data[x + y * this.width];
    }

    get data()
    {
        return this.frames[this.editor.current].data;
    }
    set data(value)
    {
        this.frames[this.editor.current].data = value;
        this.save();
    }

    get current()
    {
        return this.editor.current;
    }
    set current(value)
    {
        if (this.editor.current !== value)
        {
            this.editor.current = value;
            this.save();
        }
    }

    get width()
    {
        return this.frames[this.editor.current].width;
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
            this.frames[this.editor.current].data = data;
            this.frames[this.editor.current].width = value;
            this.save();
        }
    }

    get height()
    {
        return this.frames[this.editor.current].height;
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
            this.frames[this.editor.current].data = data;
            this.frames[this.editor.current].height = value;
            this.save();
        }
    }

    get undo()
    {
        return this.editor.frames[this.editor.current].undo;
    }
    set undo(value)
    {
        this.editor.frames[this.editor.current].undo = value;
        this.save();
    }

    get redo()
    {
        return this.editor.frames[this.editor.current].redo;
    }
    set redo(value)
    {
        this.editor.frames[this.editor.current].redo = value;
        this.save();
    }

    undoSave()
    {
        while (this.undo.length > 10000)
        {
            this.undo.shift();
        }
        this.undo.push({ width: this.width, height: this.height, data: this.data.slice(0) });
        this.redo = [];
        this.save();
    }

    undoOne()
    {
        if (this.undo.length)
        {
            this.redo.push({ width: this.width, height: this.height, data: this.data.slice(0) });
            const undo = this.undo.pop();
            this.frames[this.editor.current].width = undo.width;
            this.frames[this.editor.current].height = undo.height;
            this.frames[this.editor.current].data = undo.data;
            this.save();
        }
    }

    redoOne()
    {
        if (this.redo.length)
        {
            const redo = redo.pop();
            this.frames[this.editor.current].width = redo.width;
            this.frames[this.editor.current].height = redo.height;
            this.frames[this.editor.current].data = redo.data;
            this.undo.push({ width: this.width, height: this.height, data: this.data.slice(0) });
            this.save();
        }
    }

    load(eventType, filename)
    {
        if (eventType === 'rename')
        {
            this.filename = filename;
        }
        try
        {
            const load = jsonfile.readFileSync(this.filename);
            this.frames = load.frames;
            this.animations = load.animations;
        }
        catch (e)
        {
        }
        try
        {
            this.editor = jsonfile.readFileSync(this.filename.replace('.json', '.editor.json'));
        }
        catch (e)
        {
            this.editor = {};
            this.editor.frames = [];
            for (let i = 0; i < this.frames.length; i++)
            {
                this.editor.frames.push({ undo: [], redo: [] });
            }
            this.editor.current = 0;
            this.save();
        }
    }

    save(filename)
    {
        this.filename = filename || this.filename;
        jsonfile.writeFileSync(this.filename, { name: this.name, frames: this.frames, animations: this.animations });
        if (this.editor)
        {
            jsonfile.writeFileSync(this.filename.replace('.json', '.editor.json'), this.editor);
        }
    }

    getData()
    {
        return { name: this.name, frames: this.frames, animations: this.animations };
    }
}

module.exports = PixelEditor;