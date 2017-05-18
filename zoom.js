const remote = require('electron').remote;
const app = remote.app;
const path = require('path');

const Input = require('./input');
const View = require('./view');
const Sheet = require('./sheet');

const CURSOR_COLOR = 0xff0000;

let _data,
    _state,
    _pixel,
    _zoom = 50,
    _cursor = { x: 5, y: 5 },
    _cursorSize = { x: 1, y: 1 },
    _cursorBlock,
    _blocks,
    _grid,
    _colors,
    _isDown = -1,
    _shift,
    _stamp,
    _clipboard,
    _dragging,
    _selecting;

function init()
{
    View.init();
    Input.init(View.renderer.canvas, { keyDown: key, down: downMouse, move: moveMouse, up: upMouse });
    Sheet.init();
    _blocks = View.add(new PIXI.Container());
    _grid = View.add(new PIXI.Graphics());
    _cursorBlock = View.add(new PIXI.Graphics());
    window.addEventListener('resize', resize);
    const cw = remote.getCurrentWindow();
    _state = cw.state;
    _data = cw.pixel;
    _pixel = _data.pixel;
    _colors = _data.colors;
    resize();
    cw.show();
    cw.focus();
    cw.on('tool', tool);
    cw.on('keydown', key);
    cw.on('refresh', refresh);
    cw.on('cursor', () => { cursor(); View.render(); });
    cw.setContentSize(Math.round(_pixel.width * _zoom), Math.round(_pixel.height * _zoom));
    _state.save();
}

function refresh()
{
    remote.getCurrentWindow().setContentSize(Math.round(_pixel.width * _zoom), Math.round(_pixel.height * _zoom));
    resize();
    _state.save();
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
    _cursorSize.x = (_cursorSize.x >= _pixel.width) ? _pixel.width - 1 : _cursorSize.x;
    _cursorSize.y = (_cursorSize.x >= _pixel.height) ? _pixel.height - 1 : _cursorSize.y;
    frame();
    cursor();
    draw();
    View.render();
    remote.getCurrentWindow().zoom = _zoom;
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

// from https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
function circleCursor(color)
{
    _cursorBlock.lineStyle(0);
    _cursorBlock.position.set(0, 0);
    let x0 = _cursor.x;
    let y0 = _cursor.y;
    let x = _cursorSize.x;
    let y = 0;
    let decisionOver2 = 1 - x;   // Decision criterion divided by 2 evaluated at x=r, y=0

    const blocks = {};
    while (x >= y)
    {
        for (let i = 0; i < x * 2; i++)
        {
            blocks[(-x + x0 + i) + ',' + (y + y0)] = true;
            blocks[(-x + x0 + i) + ',' + (-y + y0)] = true;
        }
        for (let i = 0; i < y * 2; i++)
        {
            blocks[(-y + x0 + i) + ',' + (x + y0)] = true;
            blocks[(-y + x0 + i) + ',' + (-x + y0)] = true;
        }
        y++;
        if (decisionOver2 <= 0)
        {
            decisionOver2 += 2 * y + 1; // Change in decision criterion for y -> y+1
        } else
        {
            x--;
            decisionOver2 += 2 * (y - x) + 1; // Change for y -> y+1, x -> x-1
        }
    }
    _stamp = [];
    for (let block in blocks)
    {
        const pos = block.split(',');
        _cursorBlock.beginFill(color, 0.85).drawRect(parseInt(pos[0]) * _zoom, parseInt(pos[1]) * _zoom, _zoom, _zoom).endFill();
        _stamp.push({ x: parseInt(pos[0]), y: parseInt([pos[1]]) });
    }
}

function cursor()
{
    const color = _colors.foreground === null ? CURSOR_COLOR : _colors.foreground;
    switch (_data.tool)
    {
        case 'paint':
        case 'select':
            _cursorBlock.position.set(_cursor.x * _zoom, _cursor.y * _zoom);
            _cursorBlock.clear();
            _cursorBlock.lineStyle(5, color);
            const x = _cursorSize.x + _cursor.x >= _pixel.width ? _pixel.width - _cursor.x : _cursorSize.x;
            const y = _cursorSize.y + _cursor.y >= _pixel.height ? _pixel.height - _cursor.y : _cursorSize.y;
            _cursorBlock.drawRect(0, 0, _zoom * x, _zoom * y);
            remote.getCurrentWindow().windows.coords.emit('cursor', _cursor.x, _cursor.y);
            break;

        case 'circle':
            _cursorBlock.clear();
            circleCursor(_colors.foreground);
            remote.getCurrentWindow().windows.coords.emit('cursor', _cursor.x, _cursor.y);
            break;
    }
}

function move(x, y)
{
    if (_shift)
    {
        _cursorSize.x += x;
        _cursorSize.x = (_cursorSize.x > _pixel.width) ? _pixel.width : _cursorSize.x;
        _cursorSize.x = (_cursorSize.x < -_pixel.width) ? -_pixel.width : _cursorSize.x;
        if (_data.tool === 'circle' && _cursorSize.x < 1)
        {
            _cursorSize.x = 1;
        }
        if (_cursorSize.x === 0)
        {
            _cursorSize.x = (x < 0) ? -1 : 1;
        }
        _cursorSize.y += y;
        _cursorSize.y = (_cursorSize.y > _pixel.height) ? _pixel.height : _cursorSize.y;
        _cursorSize.y = (_cursorSize.y < -_pixel.height) ? -_pixel.height : _cursorSize.y;
        if (_cursorSize.y === 0)
        {
            _cursorSize.y = (y < 0) ? -1 : 1;
        }
        cursor();
    }
    else
    {
        if (_cursorSize.x < 0)
        {
            _cursor.x += _cursorSize.x;
            _cursorSize.x = -_cursorSize.x;
        }
        if (_cursorSize.y < 0)
        {
            _cursor.y += _cursorSize.y;
            _cursorSize.y = -_cursorSize.y;
        }
        _cursor.x += x;
        _cursor.y += y;
        _cursor.x = _cursor.x < 0 ? _pixel.width - 1 : _cursor.x;
        _cursor.y = _cursor.y < 0 ? _pixel.height - 1 : _cursor.y;
        _cursor.x = _cursor.x === _pixel.width ? 0 : _cursor.x;
        _cursor.y = _cursor.y === _pixel.height ? 0 : _cursor.y;
    }
    cursor();
    View.render();
}

function space()
{
    switch (_data.tool)
    {
        case 'paint':
            if (_cursorSize.x === 1 && _cursorSize.y === 1)
            {
                const current = _pixel.get(_cursor.x, _cursor.y);
                const color = (current !== _colors.foreground) ? _colors.foreground : _colors.background;
                _pixel.set(_cursor.x, _cursor.y, color);
                dirty();
                return color;
            }
            else
            {
                _pixel.undoSave();
                const color = _colors.foreground;
                let xStart = _cursor.x, yStart = _cursor.y, xTo, yTo;
                if (_cursorSize.x < 0)
                {
                    xStart += _cursorSize.x;
                    xTo = xStart + Math.abs(_cursorSize.x);
                }
                else
                {
                    xTo = xStart + _cursorSize.x;
                }
                if (_cursorSize.y < 0)
                {
                    yStart += _cursorSize.y;
                    yTo = yStart + Math.abs(_cursorSize.y) - 1;
                }
                else
                {
                    yTo = yStart + _cursorSize.y;
                }
                for (let y = yStart; y < yTo; y++)
                {
                    for (let x = xStart; x < xTo; x++)
                    {
                        _pixel.set(x, y, color, true);
                    }
                }
                dirty();
                View.render();
            }
            break;

        case 'circle':
            const color = _colors.foreground;
            _pixel.undoSave();
            for (let block of _stamp)
            {
                if (block.x >= 0 && block.x < _pixel.width && block.y >= 0 && block.y < _pixel.height)
                {
                    _pixel.set(block.x, block.y, color, true);
                }
            }
            dirty();
            View.render();
            break;
    }
}

function dirty()
{
    remote.getCurrentWindow().windows.show.emit('dirty');
    _pixel.save(_state.lastFile);
    draw();
    View.render();
}

function zoom(delta)
{
    _zoom += delta;
    _zoom = _zoom < 1 ? 1 : _zoom;
    const window = remote.getCurrentWindow();
    window.setContentSize(Math.ceil(_zoom * _pixel.width), Math.ceil(_zoom * _pixel.height));
    frame();
    draw();
    cursor();
    View.render();
}

function downMouse(x, y)
{
    const xx = Math.floor(x / _zoom);
    const yy = Math.floor(y / _zoom);
    switch (_data.tool)
    {
        case 'paint':
            const current = _pixel.get(xx, yy);
            const color = (current !== _colors.foreground) ? _colors.foreground : _colors.background;
            _pixel.set(xx, yy, color);
            dirty();
            _isDown = { color, x: xx, y: yy };
            break;

        case 'circle':
            space();
            break;

        case 'select':
            if (xx >= _cursor.x && xx <= _cursor.x + _cursorSize.x && yy >= _cursor.y && yy <= _cursor.y + _cursorSize.y)
            {
                _dragging = { x: xx, y: yy, data: _pixel.data.slice(0) };
            }
            else
            {
                _selecting = true;
                _cursor.x = xx;
                _cursor.y = yy;
            }
            break;
    }
}

function moveMouse(x, y)
{
    const xx = Math.floor(x / _zoom);
    const yy = Math.floor(y / _zoom);
    switch (_data.tool)
    {
        case 'paint':
            if (_isDown !== -1)
            {
                if (_isDown.x !== xx || _isDown.y !== yy)
                {
                    _pixel.set(xx, yy, _isDown.color);
                    dirty();
                }
            }
            break;

        case 'circle':
            _cursor.x = Math.floor(x / _zoom);
            _cursor.y = Math.floor(y / _zoom);
            cursor();
            View.render();
            break;

        case 'select':
            if (_selecting)
            {
                _cursorSize.x = xx - _cursor.x;
                _cursorSize.y = yy - _cursor.y;
                cursor();
                View.render();
            }
            else if (_dragging && (xx !== _dragging.x || yy !== _dragging.y))
            {
                _cursor.x = _dragging.x;
                _cursor.y = _dragging.y;
                _pixel.data = _dragging.data;
                const temp = _clipboard;
                cut();
                _cursor.x = xx; //_dragging.x;
                _cursor.y = yy;// - _dragging.y;
                paste();
                _clipboard = temp;
                cursor();
                dirty();
            }
    }
}

function upMouse()
{
    _isDown = -1;
    if (_dragging)
    {

    }
    _selecting = _dragging = false;
}

function save(filename)
{
    _state.lastPath = path.dirname(filename);
    if (path.extname(filename) !== '.json')
    {
        filename += '.json';
    }
    _state.lastFile = filename;
    _state.save();
    _pixel.save(filename);
    remote.getCurrentWindow().save();
    remote.getCurrentWindow().setTitle(path.basename(filename, '.json'));
}

function load(list)
{
    const filename = list[0];
    if (_pixel.load(filename))
    {
        _state.lastFile = filename;
        _state.save();
        remote.getCurrentWindow().setTitle(path.basename(filename, '.json'));
        resize();
    }
}

function dropper()
{
    const color = _pixel.get(_cursor.x, _cursor.y);
    remote.getCurrentWindow().windows.palette.emit('dropper', color);
}

function clear()
{
    switch (_data.tool)
    {
        case 'paint':
            if (_cursorSize.x < 0)
            {
                _cursor.x += _cursorSize.x;
            }
            if (_cursorSize.y < 0)
            {
                _cursor.y += _cursorSize.y;
            }
            _cursorSize.x = 1;
            _cursorSize.y = 1;
            cursor();
            View.render();
            break;
    }
}

function tool()
{
    switch (_data.tool)
    {
        case 'circle':
            if (_cursorSize.x === 1)
            {
                _cursorSize.x = 3;
            }
            break;

        case 'select':
            _dragging = false;
            _selecting = false;
            break;
    }
    cursor();
    dirty();
}

function cut()
{
    copy(true);
    dirty();
}

function copy(clear)
{
    if (_cursorSize.x === 1 && _cursorSize.y === 1)
    {
        _clipboard = { width: 1, height: 1, data: _pixel.get(_cursor.x, _cursor.y) };
        if (clear)
        {
            _pixel.set(_cursor.x, _cursor.y, null);
        }
    }
    else
    {
        let xStart = _cursor.x, yStart = _cursor.y, xTo, yTo;
        if (_cursorSize.x < 0)
        {
            xStart += _cursorSize.x;
            xTo = xStart + Math.abs(_cursorSize.x);
        }
        else
        {
            xTo = xStart + _cursorSize.x;
        }
        if (_cursorSize.y < 0)
        {
            yStart += _cursorSize.y;
            yTo = yStart + Math.abs(_cursorSize.y) - 1;
        }
        else
        {
            yTo = yStart + _cursorSize.y;
        }
        _clipboard = { width: xTo - xStart, height: yTo - yStart, data: [] };
        for (let y = yStart; y < yTo; y++)
        {
            for (let x = xStart; x < xTo; x++)
            {
                _clipboard.data.push(_pixel.get(x, y));
                if (clear)
                {
                    _pixel.set(x, y, null);
                }
            }
        }
    }
}

function paste()
{
    if (_clipboard)
    {
        let i = 0;
        for (let y = 0; y < _clipboard.height; y++)
        {
            for (let x = 0; x < _clipboard.width; x++)
            {
                _pixel.set(x + _cursor.x, y + _cursor.y, _clipboard.data[i++]);
            }
        }
        dirty();
    }
}

function key(code, special)
{
    _shift = special.shift;
    if (special.ctrl)
    {
        switch (code)
        {
            case 83:
                remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Save PIXEL file', defaultPath: _state.lastPath }, save);
                break;
            case 79:
                remote.dialog.showOpenDialog(remote.getCurrentWindow(), { title: 'Load PIXEL file', defaultPath: _state.lastPath, filters: [ {name: 'JSON', extensions: ['json']}] }, load);
                break;
            case 88:
                cut();
                break;
            case 67:
                copy();
                break;
            case 86:
                paste();
                break;
            case 90:
                if (special.shift)
                {
                    _pixel.redoOne();
                }
                else
                {
                    _pixel.undoOne();
                }
                resize();
                remote.getCurrentWindow().windows.show.emit('dirty');
                break;
        }
    }
    else
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
            case 73:
                dropper();
                break;
            case 27:
                clear();
                break;
            case 66:
                _data.tool = 'paint';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
            case 86:
                _data.tool = 'select';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
            case 67:
                _data.tool = 'circle';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
        }
    }
}

init();