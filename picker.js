const remote = require('electron').remote;
const Color = require('yy-color');
const TinyColor = require('tinycolor2');

const Sheet = require('./sheet');
const View = require('./view');
const Input = require('./input');

const BORDER = 5;
const WIDTH = 4;
let _g, _hsl, _yStart, _total, _width, _bottom, _isDown, _colors;

function init()
{
    View.init();
    Input.init(View.renderer.canvas, { down, move, up, keyDown });
    Sheet.init();
    _g = View.add(new PIXI.Graphics());
    window.addEventListener('resize', resize);
    _colors = remote.getCurrentWindow().pixel.colors;
    resize(true);
    remote.getCurrentWindow().show();
}

function resize(resize)
{
    View.resize();
    const size = remote.getCurrentWindow().getContentSize();
    _yStart = 30;
    _width = (size[0] / WIDTH) - (WIDTH + 1) * BORDER / WIDTH;
    _bottom = size[1] - BORDER;
    _total = _bottom - _yStart;
    draw(resize);
    View.render();
}

function changeColor(h, s, l)
{
    return parseInt(TinyColor({ h, s, l }).toHex(), 16);
}

function draw()
{
    function box(x, percent, reverse)
    {
        const actual = percent * (_total - 1);
        _g.beginFill(reverse ? 0xffffff : 0)
            .drawRect(x, actual + _yStart - BORDER, _width, BORDER)
            .drawRect(x + _width - BORDER, actual + _yStart - BORDER, BORDER, BORDER * 2)
            .drawRect(x, actual + _yStart + 1, _width, BORDER)
            .drawRect(x, actual + _yStart - BORDER, BORDER, BORDER * 2)
            .endFill();
    }

    const color = _colors.current;
    _g.clear()
        .beginFill(color)
        .drawRect(BORDER, _yStart, _width, _width)
        .endFill();

    let y = _yStart + _width * 2 + BORDER;

    let test = color.toString(16);
    while (test.length < 6)
    {
        test = '0' + test;
    }
    _hsl = _hsl || TinyColor(test).toHsl();

    const others = [changeColor(_hsl.h, _hsl.s, _hsl.l * 0.9), changeColor(_hsl.h, _hsl.s, _hsl.l * 1.1)];
    for (let color of others)
    {
        _g.beginFill(color)
            .drawRect(BORDER, y, _width, _width)
            .endFill();
        y += _width + BORDER;
    }

    for (let y = _yStart; y < _bottom; y++)
    {
        const percent = (y - _yStart) / _total;

        // h
        _g.beginFill(changeColor(percent * 360, _hsl.s, _hsl.l))
            .drawRect(BORDER * 2 + _width, y, _width, 1)
            .endFill();

        // s
        _g.beginFill(changeColor(_hsl.h, percent, _hsl.l))
            .drawRect(BORDER * 3 + _width * 2, y, _width, 1)
            .endFill();

        // l
        _g.beginFill(changeColor(_hsl.h, _hsl.s, percent))
            .drawRect(BORDER * 4 + _width * 3, y, _width, 1)
            .endFill();
    }
    box(BORDER * 2 + _width, _hsl.h / 360, _hsl.l < 0.5);
    box(BORDER * 3 + _width * 2, _hsl.s, _hsl.l < 0.5);
    box(BORDER * 4 + _width * 3, _hsl.l, _hsl.l < 0.5);
    View.render();
}

function move(x, y)
{
    if (_isDown)
    {
        down(x, y);
    }
}

function down(x, y)
{
    y = y < _yStart ? _yStart : y;
    y = y > _bottom ? _bottom : y;
    if (x < BORDER + _width)
    {
        if (y > _yStart + _width * 2 + BORDER && y < _yStart + _width * 3 + BORDER)
        {
            _hsl.s *= 0.9;
        }
        else if (y > _yStart + _width * 3 + BORDER * 2 && y < _yStart + _width * 4 + BORDER * 2)
        {
            _hsl.s *= 1.1;
        }
    }
    else if (x > BORDER * 2 + _width && x < BORDER + _width * 2)
    {
        _hsl.h = ((y - _yStart) / _total) * 360;
    }
    else if (x > BORDER * 3 + _width * 2 && x < BORDER * 3 + _width * 3)
    {
        _hsl.s = (y - _yStart) / _total;
    }
    else if (x > BORDER * 4 + _width * 3 && x < BORDER * 4 + _width * 4)
    {
        _hsl.l = (y - _yStart) / _total;
    }
    _colors.current = changeColor(_hsl.h, _hsl.s, _hsl.l);
    draw();
    remote.getCurrentWindow().windows.palette.emit('refresh');
    _isDown = true;
}

function up()
{
    _isDown = false;
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

init();