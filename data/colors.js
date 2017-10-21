const Color = require('yy-color');

const COLORS_PER_LINE = 10;

class Colors
{
    constructor(filename)
    {
        if (filename)
        {
            this.filename = filename;
            this.load();
        }
    }

    static create()
    {
     this.palettes = [[], [], []];
        this.isForeground = true;
        grays(lines[1]);
        primaries(lines[2]);
    }

    update(pixel)
    {
        for (let frame of pixel.frames)
        {
            for (let data of frame.data)
            {
                if (!find(lines[0], data))
                {
                    _colors.push(data);
                }
            }
        }
        _foreground = 0;
        _background = null;
    }

    module.exports = {
        init,
        get foreground()
        {
            return _foreground;
        },
        set foreground(value)
        {
            _foreground = value;
            if (!find(value))
            {
                _colors.push(value);
            }
        },
        get background()
        {
            return _background;
        },
        set background(value)
        {
            _background = value;
        },
        get isForeground()
        {
            return _isForeground;
        },
        set isForeground(value)
        {
            _isForeground = value;
        },
        get current()
        {
            return _isForeground ? _foreground : _background;
        },
        set current(value)
        {
            if (_isForeground)
            {
                _foreground = value;
            }
            else
            {
                _background = value;
            }
        }
    }

module.exports = Colors;