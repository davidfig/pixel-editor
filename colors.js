const Color = require('yy-color');

let _colors = [];
let _current;

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
    _colors.push(0);
    _colors.push(0xffffff);
    for (let i = 1; i < GRAYS - 1; i++)
    {
        const color = Color.blend(i / GRAYS, 0xffffff, 0);
        if (!find(color))
        {
            _colors.push(color);
        }
    }
}

function load()
{
}

function init(pixel)
{
    grays();
    for (let data of pixel.data)
    {
        if (!find(data))
        {
            _colors.push(data);
        }
    }
    _current = 0;
}

module.exports = {
    init,
    load,
    get current()
    {
        return _current;
    },
    set current(value)
    {
        _current = value;
        if (!find(value))
        {
            _colors.push(value);
        }
    },
    get colors()
    {
        return _colors;
    }
};