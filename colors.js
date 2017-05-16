const Color = require('yy-color');

let _colors = [];
let _foreground, _background;

const GRAYS = 10;

function find(color)
{
    for (let find of _colors)
    {
        if (find === color)
        {
            return true;
        }
    }
}

function grays()
{
    _colors.push(0, 0xffffff);
    for (let i = 1; i < GRAYS - 1; i++)
    {
        const color = Color.blend(i / GRAYS, 0xffffff, 0);
        if (!find(color))
        {
            _colors.push(color);
        }
    }
}

function primaries()
{
    _colors.push(0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff);
}

function load()
{
}

function init(pixel)
{
    grays();
    primaries();
    for (let data of pixel.data)
    {
        if (!find(data))
        {
            _colors.push(data);
        }
    }
    _foreground = 0;
    _background = null;
}

module.exports = {
    init,
    load,
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
    get colors()
    {
        return _colors;
    }
};