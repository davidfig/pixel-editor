const remote = require('electron').remote;

const View = require('./view');

const GRAY = 0xeeeeee;
const CURSOR_COLOR = 0xff0000;
const CURSOR_COLOR_ALT = 0x00ff00;

let _transparency,
    _pixel,
    _zoom = 50,
    _cursor = { x: 5, y: 5 },
    _cursorBlock,
    _cursorAlt,
    _blocks,
    _grid,
    _colors;

function init()
{
    _pixel = remote.getCurrentWindow().pixel.pixel;
    _colors = remote.getCurrentWindow().pixel.colors;
    _transparency = View.add(new PIXI.Container());
    _blocks = View.add(new PIXI.Container());
    _grid = View.add(new PIXI.Graphics());
    transparency();
    cursorInit();
    frame();
    cursor();
    draw();
    View.dirty();
}

function transparency()
{
    _transparency.removeChildren();
    let alt = true, last;
    for (let y = 0; y < _pixel.height * 2; y++)
    {
        alt = !last;
        last = alt;
        for (let x = 0; x < _pixel.width * 2; x++)
        {
            if (alt)
            {
                const block = _transparency.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
                block.tint = GRAY;
                block.width = block.height = _zoom / 2;
                block.position.set(x * _zoom / 2, y * _zoom / 2);
            }
            alt = !alt;
        }
    }
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
            if (color !== null)
            {
                const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
                block.width = block.height = _zoom;
                block.position.set(x * _zoom, y * _zoom);
                block.tint = color;
            }
        }
    }
    const window = remote.getCurrentWindow();
    window.setContentSize(_pixel.width * _zoom, _pixel.height * _zoom);
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
    View.dirty();
}

function space()
{
    const current = _pixel.get(_cursor.x, _cursor.y)
    if (current === null && current !== _colors.current)
    {
        _pixel.set(_cursor.x, _cursor.y, _colors.current);
    }
    else
    {
        _pixel.set(_cursor.x, _cursor.y, null);
    }
    draw();
    cursor();
    View.dirty();
}

function zoom(delta)
{
    _zoom += delta;
    _zoom = _zoom < 1 ? 1 : _zoom;
    frame();
    cursor();
    draw();
    View.dirty();
}

module.exports = {
    init,
    move,
    draw,
    space,
    zoom
};