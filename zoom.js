const remote = require('electron').remote;

const Input = require('./input');
const View = require('./view');
const Sheet = require('./sheet');

const CURSOR_COLOR = 0xff0000;
const CURSOR_COLOR_ALT = 0x00ff00;

let _pixel,
    _zoom = 50,
    _cursor = { x: 5, y: 5 },
    _cursorBlock,
    _cursorAlt,
    _blocks,
    _grid,
    _colors;

function init()
{
    View.init();
    Input.init(View, {keyDown: key});
    Sheet.init();
    _pixel = remote.getCurrentWindow().pixel.pixel;
    _colors = remote.getCurrentWindow().pixel.colors;
    _blocks = View.add(new PIXI.Container());
    _grid = View.add(new PIXI.Graphics());
    window.addEventListener('resize', resize);
    resize();
}

function resize()
{
    View.resize();
    const size = remote.getCurrentWindow().getContentSize();
    let width = size[0], height = size[1];
    let w = width / _pixel.width;
    let h = height / _pixel.height;
    if (_pixel.width * h < width)
    {
        _zoom = h;
    }
    else
    {
        _zoom = w;
    }
    cursorInit();
    frame();
    cursor();
    draw();
    View.render();
}

function cursorInit(alt)
{
    if (!_cursorBlock)
    {
        _cursorBlock = View.add(new PIXI.Graphics());
    }
    _cursorAlt = alt;
    _cursorBlock.clear();
    _cursorBlock.lineStyle(5, alt ? CURSOR_COLOR_ALT : CURSOR_COLOR);
    _cursorBlock.drawRect(0, 0, _zoom, _zoom);
}

function draw()
{
    _blocks.removeChildren();
    for (let y = 0; y < _pixel.height; y++)
    {
        for (let x = 0; x < _pixel.height; x++)
        {
            const color = _pixel.get(x, y);
            const block = _blocks.addChild(new PIXI.Sprite(color === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE));
            block.width = block.height = _zoom;
            block.position.set(x * _zoom, y * _zoom);
            if (color !== null)
            {
                block.tint = color;
            }
        }
    }
}

function frame()
{
    _grid.clear();
    _grid.lineStyle(1, 0x888888);
    for (let y = 0; y <= _pixel.height; y++)
    {
        _grid.moveTo(0, y * _zoom);
        _grid.lineTo(_pixel.width * _zoom, y * _zoom);
    }

    for (let x = 0; x <= _pixel.width; x++)
    {
        _grid.moveTo(x * _zoom, 0);
        _grid.lineTo(x * _zoom, _pixel.height * _zoom);
    }
}

function cursor()
{
    _cursorBlock.position.set(_cursor.x * _zoom, _cursor.y * _zoom);
    if (_pixel.get(_cursor.x, _cursor.y) === CURSOR_COLOR)
    {
        cursorInit(true);
    }
    else if (_cursorAlt)
    {
        cursorInit();
    }
}

function move(x, y)
{
    _cursor.x += x;
    _cursor.y += y;
    _cursor.x = _cursor.x < 0 ? _pixel.width - 1 : _cursor.x;
    _cursor.y = _cursor.y < 0 ? _pixel.height - 1 : _cursor.y;
    _cursor.x = _cursor.x === _pixel.width ? 0 : _cursor.x;
    _cursor.y = _cursor.y === _pixel.height ? 0 : _cursor.y;
    cursor();
    View.render();
}

function space()
{
    const current = _pixel.get(_cursor.x, _cursor.y);
    if (current !== _colors.foreground)
    {
        _pixel.set(_cursor.x, _cursor.y, _colors.foreground);
    }
    else
    {
        _pixel.set(_cursor.x, _cursor.y, _colors.background);
    }
    draw();
    cursor();
    View.render();
}

function zoom(delta)
{
    _zoom += delta;
    _zoom = _zoom < 1 ? 1 : _zoom;
    const window = remote.getCurrentWindow();
    window.setContentSize(Math.ceil(_zoom * _pixel.width), Math.ceil(_zoom * _pixel.height));
    frame();
    cursor();
    draw();
    View.render();
}

function key(code)
{
    switch (code)
    {
        case 37: // left
            move(-1, 0);
            break;
        case 38: // up
            move(0, -1);
            break;
        case 39: // right
            move(1, 0);
            break;
        case 40: // down
            move(0, 1);
            break;
        case 187:
            zoom(1);
            break;
        case 189:
            zoom(-1);
            break;
        case 32: // space
            space();
            break;
    }
}

init();