const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const PIXI = require('pixi.js')
const TinyColor = require('tinycolor2');
const FontFaceObserver = require('fontfaceobserver');
const EasyEdit = require('easyedit');

const Sheet = require('./sheet');
const View = require('./view');
const Input = require('./input');
const State = require('./data/state.js');

const BORDER = 5;
const WIDTH = 4;
let _canvas, _spacer, _hex, _hexDiv, _rgbDiv, _state, _g, _hsl, _total, _width, _bottom, _isDown, _color, _editing, _transparent;

function init()
{
    _canvas = document.getElementById('canvas');
    _spacer = document.getElementById('spacer');
    _hex = document.getElementById('hex');
    _hexDiv = document.getElementById('hex-div');
    _rgbDiv = document.getElementById('rgb-div');
    _state = new State();
    View.init({ canvas: _canvas });;
    Input.init(_canvas, { down, move, up, keyDown });
    Sheet.init(_state.transparentColor);
    _g = View.add(new PIXI.Graphics());
    window.addEventListener('resize', resize);
    remote.getCurrentWindow().show();
    resize();
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('reset', stateChange);
    new EasyEdit(document.getElementById('r'),
        { onedit: () => _editing = true, onsuccess: (value) => { rgb({ r: value }); _editing = false; }, oncancel: _editing = false });
    new EasyEdit(document.getElementById('g'),
        { onedit: () => _editing = true, onsuccess: (value) => { rgb({ g: value }); _editing = false; }, oncancel: _editing = false });
    new EasyEdit(document.getElementById('b'),
        { onedit: () => _editing = true, onsuccess: (value) => { rgb({ b: value }); _editing = false; }, oncancel: _editing = false });
    new EasyEdit(_hex, { onedit: () => _editing = true, onsuccess: (value) => { hex(value); _editing = false; }, oncancel: _editing = false });
    resize();
}

function rgb(value)
{
    const rgb = TinyColor({ h: _hsl.h, s: _hsl.s, l: _hsl.l }).toRgb();
    rgb.r = value.r || rgb.r;
    rgb.g = value.g || rgb.g;
    rgb.b = value.b || rgb.b;
    const color = TinyColor(rgb).toHex();
    if (_state.isForeground)
    {
        _state.foreground = color;
    }
    else
    {
        _state.background = color;
    }
    ipcRenderer.send('state');
    _hsl = null;
    draw();
    View.render();
}

function hex(value)
{
    const color = parseInt(value, 16);
    if (_state.isForeground)
    {
        _state.foreground = color;
    }
    else
    {
        _state.background = color;
    }
    ipcRenderer.send('state');
    _hsl = null;
    draw();
    View.render();
}

function stateChange()
{
    _state.load();
    _hsl = null;
    draw();
}

function resize()
{
    View.resize();
    _width = (window.innerWidth / WIDTH) - (WIDTH + 1) * BORDER / WIDTH;
    const width = window.innerWidth - BORDER * 2;
    const height = _total = window.innerHeight - _hexDiv.offsetHeight * 2 - _rgbDiv.offsetHeight - _spacer.offsetHeight;
    _canvas.width = width * window.devicePixelRatio;
    _canvas.height = (height + BORDER) * window.devicePixelRatio;
    _canvas.style.width = width + 'px';
    _canvas.style.height = (height + BORDER) + 'px';
    _bottom = _total - BORDER;
    draw();
}

function showColor(color)
{
    color = color.toString(16);
    while (color.length < 6)
    {
        color = '0' + color;
    }
    return color;
}

function changeColor(h, s, l)
{
    return parseInt(TinyColor({ h, s, l }).toHex(), 16);
}

function draw()
{
    function box(x, percent, reverse)
    {
        const actual = percent * (_bottom - BORDER * 2);
        _g.beginFill(reverse ? 0xffffff : 0)
            .drawRect(x, actual, _width, BORDER)
            .drawRect(x + _width - BORDER, actual, BORDER, BORDER * 2)
            .drawRect(x, actual + BORDER + 1, _width, BORDER)
            .drawRect(x, actual, BORDER, BORDER * 2)
            .endFill();
    }

    _color = _state.isForeground ? _state.foreground : _state.background;

    if (_color === null)
    {
        _color = _state.transparentColor || 0xdddddd;
        _transparent = true;
    }
    else
    {
        _transparent = false;
    }
    _g.clear()
        .beginFill(_color)
        .drawRect(0, BORDER, _width, _width)
        .endFill();

    let y = _width * 2 + BORDER * 2;

    let test = _color.toString(16);
    while (test.length < 6)
    {
        test = '0' + test;
    }
    _hsl = _hsl || TinyColor(test).toHsl();

    const others = [changeColor(_hsl.h, _hsl.s, _hsl.l * 0.9), changeColor(_hsl.h, _hsl.s, _hsl.l * 1.1)];
    for (let color of others)
    {
        _g.beginFill(color)
            .drawRect(0, y, _width, _width)
            .endFill();
        y += _width + BORDER;
    }

    for (let y = BORDER * 2; y <= _bottom - BORDER; y++)
    {
        let percent = (y - BORDER * 2) / _bottom;
        percent = percent > 1 ? 1 : percent;

        // h
        _g.beginFill(changeColor(percent * 360, _hsl.s, _hsl.l))
            .drawRect(BORDER + _width, y, _width, 1)
            .endFill();

        // s
        _g.beginFill(changeColor(_hsl.h, percent, _hsl.l))
            .drawRect(BORDER * 2 + _width * 2, y, _width, 1)
            .endFill();

        // l
        _g.beginFill(changeColor(_hsl.h, _hsl.s, percent))
            .drawRect(BORDER * 3 + _width * 3, y, _width, 1)
            .endFill();
    }
    box(BORDER + _width, _hsl.h / 360, _hsl.l < 0.5);
    box(BORDER * 2 + _width * 2, _hsl.s, _hsl.l < 0.5);
    box(BORDER * 3 + _width * 3, _hsl.l, _hsl.l < 0.5);
    View.render();
    words();
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
    y -= _spacer.offsetHeight + BORDER * 2;
    y = y < BORDER ? BORDER : y;
    y = y > _bottom ? _bottom : y;
    let percent = y / _bottom;
    percent = percent > 1 ? 1 : percent;
    if (x < BORDER + _width)
    {
        if (y > _width * 2 + BORDER * 2 && y < _width * 3 + BORDER * 2)
        {
            _hsl.s *= 0.9;
        }
        else if (y > _width * 3 + BORDER * 3 && y < _width * 4 + BORDER * 3)
        {
            _hsl.s *= 1.1;
        }
    }
    else if (x > BORDER * 2 + _width && x < BORDER + _width * 2)
    {
        _hsl.h = percent * 360;
    }
    else if (x > BORDER * 3 + _width * 2 && x < BORDER * 3 + _width * 3)
    {
        _hsl.s = percent;
    }
    else if (x > BORDER * 4 + _width * 3 && x < BORDER * 4 + _width * 4)
    {
        _hsl.l = percent;
    }
    if (_transparent)
    {
        Sheet.transparent = _state.transparentColor = changeColor(_hsl.h, _hsl.s, _hsl.l);
        ipcRenderer.send('state');
        draw();
    }
    else
    {
        if (_state.isForeground)
        {
            _state.foreground = changeColor(_hsl.h, _hsl.s, _hsl.l);
        }
        else
        {
            _state.background = changeColor(_hsl.h, _hsl.s, _hsl.l);
        }
    }
    draw();
    _isDown = true;
    ipcRenderer.send('state');
}

function words()
{
    _hex.innerHTML = showColor(_color);
    const rgb = TinyColor({ h: _hsl.h, s: _hsl.s, l: _hsl.l }).toRgb();
    document.getElementById('r').innerHTML = rgb.r;
    document.getElementById('g').innerHTML = rgb.g;
    document.getElementById('b').innerHTML = rgb.b;
}

function up()
{
    _isDown = false;
}

function keyDown(code, special)
{
    if (!_editing)
    {
        remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
    }
}

const font = new FontFaceObserver('bitmap');
font.load().then(() => init());