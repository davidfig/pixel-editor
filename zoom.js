const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const path = require('path');

const Input = require('./input');
const View = require('./view');
const Sheet = require('./sheet');
const State = require('./data/state');
const PixelEditor = require('./data/pixel-editor');

const CURSOR_COLOR = 0xff0000;
const SHAPE_HOVER_ALPHA = 1;
const BORDER = 1;

let _state, _pixel, _zoom = 50,
    _cursorBlock, _blocks, _grid,
    _isDown = -1, _shift,
    _stamp, _clipboard,
    _dragging, _selecting, _line;

function init()
{
    _state = new State();
    _pixel = new PixelEditor(_state.lastFile);
    _state.lastFile = _pixel.filename;
    View.init();
    Input.init(View.renderer.canvas, { keyDown: key, down: downMouse, move: moveMouse, up: upMouse });
    Sheet.init();
    _blocks = View.add(new PIXI.Container());
    _grid = View.add(new PIXI.Graphics());
    _cursorBlock = View.add(new PIXI.Graphics());
    window.addEventListener('resize', resize);
    resize();
    remote.getCurrentWindow().on('keydown', key);
    remote.getCurrentWindow().setContentSize(Math.round(_pixel.width * _zoom), Math.round(_pixel.height * _zoom));
    remote.getCurrentWindow().setTitle(path.basename(_state.lastFile, '.json') + ' (' + _state.current + ')');
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('pixel', pixelChange);
    remote.getCurrentWindow().show();
}

function stateChange()
{
    _state.load();
    remote.getCurrentWindow().setTitle(path.basename(_state.lastFile, '.json') + ' (' + _state.current + ')');
    cursor();
    View.render();
}

function pixelChange()
{
    _pixel.load();
    // if (Math.round(_pixel.width * _zoom) !== window.innerWidth || Math.round(_pixel.height * _zoom) !== window.innerHeight)
    // {
    //     remote.getCurrentWindow().setContentSize(Math.round(_pixel.width * _zoom), Math.round(_pixel.height * _zoom));
    // }
    resize();
}

function resize()
{
    View.resize();
    const size = remote.getCurrentWindow().getContentSize();
    let width = size[0], height = size[1];
    if (Math.round(_pixel.width * _zoom) !== size[0] || Math.round(_pixel.height * _zoom) !== size[1])
    {
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
    }
    _state.cursorSizeX = (_state.cursorSizeX >= _pixel.width) ? _pixel.width - 1 : _state.cursorSizeX;
    _state.cursorSizeY = (_state.cursorSizeX >= _pixel.height) ? _pixel.height - 1 : _state.cursorSizeY;
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
    _grid.lineStyle(BORDER, 0x888888);
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
    let x0 = _state.cursorX;
    let y0 = _state.cursorY;
    let x = _state.cursorSizeX;
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
        _cursorBlock.beginFill(color, SHAPE_HOVER_ALPHA).drawRect(parseInt(pos[0]) * _zoom, parseInt(pos[1]) * _zoom, _zoom, _zoom).endFill();
        _stamp.push({ x: parseInt(pos[0]), y: parseInt([pos[1]]) });
    }
}

function lineCursor()
{
    const color = _state.foreground === null ? CURSOR_COLOR : _state.foreground;
    _cursorBlock.position.set(0);
    if (_line)
    {
        _stamp = [];
        let x0 = _state.cursorX;
        let y0 = _state.cursorY;
        let x1 = _line.x;
        let y1 = _line.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let e2;
        while (true)
        {
            _cursorBlock.beginFill(color, SHAPE_HOVER_ALPHA)
                .drawRect(x0 * _zoom - BORDER, y0 * _zoom - BORDER, _zoom + BORDER * 2, _zoom + BORDER * 2)
                .endFill();
            _stamp.push({ x: x0, y: y0 });
            if (x0 == x1 && y0 == y1)
            {
                break;
            }
            e2 = 2 * err;
            if (e2 > -dy)
            {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx)
            {
                err += dx;
                y0 += sy;
            }
        }
    }
    else
    {
        _cursorBlock.beginFill(color, SHAPE_HOVER_ALPHA)
            .drawRect(_state.cursorX * _zoom - BORDER, _state.cursorY * _zoom - BORDER, _zoom + BORDER * 2, _zoom + BORDER * 2)
            .endFill();
        _stamp = [{ x: _state.cursorX, y: _state.cursorY }];
    }
}

function singleCursor()
{
    const color = _state.foreground === null ? CURSOR_COLOR : _state.foreground;
    _cursorBlock.position.set(_state.cursorX * _zoom, _state.cursorY * _zoom);
    _cursorBlock.lineStyle(5, color);
    _cursorBlock.drawRect(0, 0, _zoom, _zoom);
    remote.getCurrentWindow().windows.coords.emit('cursor', _state.cursorX, _state.cursorY);
}

function normalCursor()
{
    const color = _state.foreground === null ? CURSOR_COLOR : _state.foreground;
    _cursorBlock.position.set(_state.cursorX * _zoom, _state.cursorY * _zoom);
    _cursorBlock.lineStyle(5, color);
    const x = _state.cursorSizeX + _state.cursorX >= _pixel.width ? _pixel.width - _state.cursorX : _state.cursorSizeX;
    const y = _state.cursorSizeY + _state.cursorY >= _pixel.height ? _pixel.height - _state.cursorY : _state.cursorSizeY;
    _cursorBlock.drawRect(0, 0, _zoom * x, _zoom * y);
    // remote.getCurrentWindow().windows.coords.emit('cursor', _state.cursorX, _state.cursorY);
}

function cursor()
{
    _cursorBlock.clear();
    switch (_state.tool)
    {
        case 'paint':
        case 'select':
            normalCursor();
            break;

        case 'circle':
            circleCursor(_state.foreground);
            remote.getCurrentWindow().windows.coords.emit('cursor', _state.cursorX, _state.cursorY);
            break;

        case 'line':
            lineCursor(_state.foreground);
            break;

        case 'fill':
            singleCursor();
            break;
    }
}

function move(x, y)
{
    if (_shift)
    {
        if (_state.tool === 'line')
        {
            if (!_line)
            {
                _line = { x: _state.cursorX, y: _state.cursorY };
            }
            _line.x += x;
            _line.y += y;
            _line.x = _line.x < 0 ? _pixel.width - 1 : _line.x;
            _line.y = _line.y < 0 ? _pixel.height - 1 : _line.y;
            _line.x = _line.x === _pixel.width ? 0 : _line.x;
            _line.y = _line.y === _pixel.height ? 0 : _line.y;
        }
        else
        {
            _state.cursorSizeX += x;
            _state.cursorSizeX = (_state.cursorSizeX > _pixel.width) ? _pixel.width : _state.cursorSizeX;
            _state.cursorSizeX = (_state.cursorSizeX < -_pixel.width) ? -_pixel.width : _state.cursorSizeX;
            if (_state.tool === 'circle' && _state.cursorSizeX < 1)
            {
                _state.cursorSizeX = 1;
            }
            if (_state.cursorSizeX === 0)
            {
                _state.cursorSizeX = (x < 0) ? -1 : 1;
            }
            _state.cursorSizeY += y;
            _state.cursorSizeY = (_state.cursorSizeY > _pixel.height) ? _pixel.height : _state.cursorSizeY;
            _state.cursorSizeY = (_state.cursorSizeY < -_pixel.height) ? -_pixel.height : _state.cursorSizeY;
            if (_state.cursorSizeY === 0)
            {
                _state.cursorSizeY = (y < 0) ? -1 : 1;
            }
        }
    }
    else
    {
        if (_state.cursorSizeX < 0)
        {
            _state.cursorX += _state.cursorSizeX;
            _state.cursorSizeX = -_state.cursorSizeX;
        }
        if (_state.cursorSizeY < 0)
        {
            _state.cursorY += _state.cursorSizeY;
            _state.cursorSizeY = -_state.cursorSizeY;
        }
        _state.cursorX += x;
        _state.cursorY += y;
        _state.cursorX = _state.cursorX < 0 ? _pixel.width - 1 : _state.cursorX;
        _state.cursorY = _state.cursorY < 0 ? _pixel.height - 1 : _state.cursorY;
        _state.cursorX = _state.cursorX === _pixel.width ? 0 : _state.cursorX;
        _state.cursorY = _state.cursorY === _pixel.height ? 0 : _state.cursorY;
    }
    cursor();
    ipcRenderer.send('state');
    View.render();
}

function space()
{
    switch (_state.tool)
    {
        case 'paint':
            if (_state.cursorSizeX === 1 && _state.cursorSizeY === 1)
            {
                const current = _pixel.get(_state.cursorX, _state.cursorY);
                const color = (current !== _state.foreground) ? _state.foreground : _state.background;
                _pixel.set(_state.cursorX, _state.cursorY, color);
                dirty();
                return color;
            }
            else
            {
                _pixel.undoSave();
                const color = _state.foreground;
                let xStart = _state.cursorX, yStart = _state.cursorY, xTo, yTo;
                if (_state.cursorSizeX < 0)
                {
                    xStart += _state.cursorSizeX;
                    xTo = xStart + Math.abs(_state.cursorSizeX);
                }
                else
                {
                    xTo = xStart + _state.cursorSizeX;
                }
                if (_state.cursorSizeY < 0)
                {
                    yStart += _state.cursorSizeY;
                    yTo = yStart + Math.abs(_state.cursorSizeY) - 1;
                }
                else
                {
                    yTo = yStart + _state.cursorSizeY;
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
        case 'line':
            const color = _state.foreground;
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

        case 'line':
            break;

        case 'fill':
            _pixel.undoSave();
            floodFill(_state.cursorX, _state.cursorY, _pixel.get(_state.cursorX, _state.cursorY));
            dirty();
            break;
    }
}

function floodFill(x, y, check)
{
    if (check !== _state.foreground && _pixel.get(x, y) === check)
    {
        _pixel.set(x, y, _state.foreground, true);
        if (y > 0)
        {
            floodFill(x, y - 1, check);
        }
        if (y < _pixel.height - 1)
        {
            floodFill(x, y + 1, check);
        }
        if (x > 0)
        {
            floodFill(x - 1, y, check);
        }
        if (x < _pixel.width - 1)
        {
            floodFill(x + 1, y, check);
        }
    }
}

function dirty()
{
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
    switch (_state.tool)
    {
        case 'paint':
            const current = _pixel.get(xx, yy);
            const color = (current !== _state.foreground) ? _state.foreground : _state.background;
            _pixel.set(xx, yy, color);
            dirty();
            _isDown = { color, x: xx, y: yy };
            break;

        case 'fill':
            _pixel.undoSave();
            floodFill(xx, yy, _pixel.get(xx, yy));
            dirty();
            break;

        case 'circle':
            space();
            break;

        case 'select':
            if (xx >= _state.cursorX && xx <= _state.cursorX + _state.cursorSizeX && yy >= _state.cursorY && yy <= _state.cursorY + _state.cursorSizeY)
            {
                _dragging = { x: xx, y: yy, data: _pixel.data.slice(0) };
            }
            else
            {
                _selecting = true;
                _state.cursorX = xx;
                _state.cursorY = yy;
            }
            break;
    }
}

function moveMouse(x, y)
{
    const xx = Math.floor(x / _zoom);
    const yy = Math.floor(y / _zoom);
    switch (_state.tool)
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
            _state.cursorX = Math.floor(x / _zoom);
            _state.cursorY = Math.floor(y / _zoom);
            cursor();
            View.render();
            break;

        case 'select':
            if (_selecting)
            {
                _state.cursorSizeX = xx - _state.cursorX;
                _state.cursorSizeY = yy - _state.cursorY;
                cursor();
                View.render();
            }
            else if (_dragging && (xx !== _dragging.x || yy !== _dragging.y))
            {
                _state.cursorX = _dragging.x;
                _state.cursorY = _dragging.y;
                _pixel.data = _dragging.data;
                const temp = _clipboard;
                cut();
                _state.cursorX = xx; //_dragging.x;
                _state.cursorY = yy;// - _dragging.y;
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

function newFile()
{
    _pixel = new Pixel(15, 15);
    remote.getCurrentWindow().pixel.pixel = _pixel;
    _state.lastFile = null;
    remote.getCurrentWindow().setTitle('New File');
    resize();
}

function dropper()
{
    const color = _pixel.get(_state.cursorX, _state.cursorY);
    remote.getCurrentWindow().windows.palette.emit('dropper', color);
}

function clear()
{
    switch (_state.tool)
    {
        case 'paint':
            if (_state.cursorSizeX < 0)
            {
                _state.cursorX += _state.cursorSizeX;
            }
            if (_state.cursorSizeY < 0)
            {
                _state.cursorY += _state.cursorSizeY;
            }
            _state.cursorSizeX = 1;
            _state.cursorSizeY = 1;
            cursor();
            View.render();
            break;
    }
}

function tool()
{
    switch (_state.tool)
    {
        case 'circle':
            if (_state.cursorSizeX === 1)
            {
                _state.cursorSizeX = 3;
            }
            break;

        case 'select':
            _dragging = false;
            _selecting = false;
            break;

        case 'line':
            _line = null;
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
    if (_state.cursorSizeX === 1 && _state.cursorSizeY === 1)
    {
        _clipboard = { width: 1, height: 1, data: _pixel.get(_state.cursorX, _state.cursorY) };
        if (clear)
        {
            _pixel.set(_state.cursorX, _state.cursorY, null);
        }
    }
    else
    {
        let xStart = _state.cursorX, yStart = _state.cursorY, xTo, yTo;
        if (_state.cursorSizeX < 0)
        {
            xStart += _state.cursorSizeX;
            xTo = xStart + Math.abs(_state.cursorSizeX);
        }
        else
        {
            xTo = xStart + _state.cursorSizeX;
        }
        if (_state.cursorSizeY < 0)
        {
            yStart += _state.cursorSizeY;
            yTo = yStart + Math.abs(_state.cursorSizeY) - 1;
        }
        else
        {
            yTo = yStart + _state.cursorSizeY;
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
                _pixel.set(x + _state.cursorX, y + _state.cursorY, _clipboard.data[i++]);
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
                dirty();
                break;
            case 68:
                _pixel.duplicate(_state.current);
                draw();
                dirty();
                break;
            case 65:
                _state.tool = 'select';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                _state.cursorX = 0;
                _state.cursorY = 0;
                _state.cursorSizeX = _pixel.width;
                _state.cursorSizeY = _pixel.height;
                cursor();
                View.render();
                break;
            case 78:
                newFile();
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
                _state.tool = 'paint';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
            case 86:
                _state.tool = 'select';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
            case 67:
                _state.tool = 'circle';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
            case 76:
                _state.tool = 'line';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
            case 70:
                _state.tool = 'fill';
                remote.getCurrentWindow().windows.tools.emit('tools');
                tool();
                break;
        }
    }
}

init();