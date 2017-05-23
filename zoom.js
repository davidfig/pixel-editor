const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const path = require('path');
const RenderSheet = require('yy-rendersheet');
const TinyColor = require('tinycolor2');
const Pixel = require('../components/pixel/pixel');

const Input = require('./input');
const View = require('./view');
const Sheet = require('./sheet');
const State = require('./data/state');
const PixelEditor = require('./data/pixel-editor');

const CURSOR_COLOR = 0xff0000;
const SHAPE_HOVER_ALPHA = 1;
const BORDER = 1;
const DOTTED = 10;

let _state, _pixel, _zoom = 50, _sheet, _sprite,
    _cursorBlock, _blocks, _grid,
    _isDown = -1, _shift,
    _stamp, _clipboard,
    _dragging, _selecting, _line;

function init()
{
    _state = new State();
    try
    {
        _pixel = new PixelEditor(_state.lastFile);
    }
    catch (e)
    {
        _pixel = new PixelEditor();
    }
    _sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST });
    _state.lastFile = _pixel.filename;
    View.init();
    Input.init(View.renderer.canvas, { keyDown: key, down: downMouse, move: moveMouse, up: upMouse });
    Sheet.init();
    _blocks = View.add(new PIXI.Container());
    _sprite = View.add(new PIXI.Container());
    _grid = View.add(new PIXI.Graphics());
    _cursorBlock = View.add(new PIXI.Graphics());
    resize();
    remote.getCurrentWindow().on('keydown', key);
    remote.getCurrentWindow().setContentSize(Math.round(_pixel.width * _zoom), Math.round(_pixel.height * _zoom));
    title();
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('pixel', pixelChange);
    ipcRenderer.on('menu', menu);
    window.addEventListener('resize', resize);
    remote.getCurrentWindow().show();
}

function title()
{
    remote.getCurrentWindow().setTitle(path.basename(_state.lastFile, '.json') + ' (' + _pixel.current + ')');
}

function stateChange()
{
    _state.load();
    title();
    cursor();
    View.render();
}

function pixelChange()
{
    _pixel.load();
    title();
    if (Math.round(_pixel.width * _zoom) !== window.innerWidth || Math.round(_pixel.height * _zoom) !== window.innerHeight)
    {
        remote.getCurrentWindow().setContentSize(Math.round(_pixel.width * _zoom), Math.round(_pixel.height * _zoom));
    }
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
    transparency();
    frame();
    cursor();
    draw();
    View.render();
    remote.getCurrentWindow().zoom = _zoom;
}

function transparency()
{
    _blocks.removeChildren();
    for (let y = 0; y < _pixel.height; y++)
    {
        for (let x = 0; x < _pixel.height; x++)
        {
            const block = _blocks.addChild(new PIXI.Sprite(Sheet.getTexture('transparency')));
            block.width = block.height = _zoom;
            block.position.set(x * _zoom, y * _zoom);
        }
    }
}

function draw()
{
    _sprite.removeChildren();
    const pixel = _sprite.addChild(new Pixel(_pixel.getData(), _sheet));
    _sheet.render();
    pixel.scale.set(_zoom);
    pixel.frame(_pixel.current);
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

function ellipseCursor(color)
{
    _cursorBlock.lineStyle(0);
    _cursorBlock.position.set(0, 0);
    let xc = _state.cursorX;
    let yc = _state.cursorY;
    let rx = _state.cursorSizeX;
    let ry = _state.cursorSizeY;
    let x = 0, y = ry;
    let p = (ry * ry) - (rx * rx * ry) + ((rx * rx) / 4);
    const blocks = {};
    while ((2 * x * ry * ry) < (2 * y * rx * rx))
    {
        for (let i = 0; i < x * 2; i++)
        {
            blocks[(xc - x + i) + ',' + (yc - y)] = true;
            blocks[(xc - x + i) + ',' + (yc + y)] = true;
        }
        if (p < 0)
        {
            x = x + 1;
            p = p + (2 * ry * ry * x) + (ry * ry);
        }
        else
        {
            x = x + 1;
            y = y - 1;
            p = p + (2 * ry * ry * x + ry * ry) - (2 * rx * rx * y);
        }
    }
    p = (x + 0.5) * (x + 0.5) * ry * ry + (y - 1) * (y - 1) * rx * rx - rx * rx * ry * ry;
    while (y >= 0)
    {
        for (let i = 0; i < x * 2; i++)
        {
            blocks[(xc - x + i) + ',' + (yc - y)] = true;
            blocks[(xc - x + i) + ',' + (yc + y)] = true;
        }
        if (p > 0)
        {
            y = y - 1;
            p = p - (2 * rx * rx * y) + (rx * rx);
        }
        else
        {
            y = y - 1;
            x = x + 1;
            p = p + (2 * ry * ry * x) - (2 * rx * rx * y) - (rx * rx);
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
}

function normalCursor()
{
    const color = _state.foreground === null ? CURSOR_COLOR : _state.foreground;
    _cursorBlock.position.set(_state.cursorX * _zoom, _state.cursorY * _zoom);
    _cursorBlock.lineStyle(5, color);
    const x = _state.cursorSizeX + _state.cursorX >= _pixel.width ? _pixel.width - _state.cursorX : _state.cursorSizeX;
    const y = _state.cursorSizeY + _state.cursorY >= _pixel.height ? _pixel.height - _state.cursorY : _state.cursorSizeY;
    _cursorBlock.drawRect(0, 0, _zoom * x, _zoom * y);
}

function selectCursor()
{
    const color = _state.foreground === null ? CURSOR_COLOR : _state.foreground;
    _cursorBlock.position.set(_state.cursorX * _zoom, _state.cursorY * _zoom);
    _cursorBlock.lineStyle(5, color);
    const x = _state.cursorSizeX + _state.cursorX >= _pixel.width ? _pixel.width - _state.cursorX : _state.cursorSizeX;
    const y = _state.cursorSizeY + _state.cursorY >= _pixel.height ? _pixel.height - _state.cursorY : _state.cursorSizeY;
    let reverse = _zoom * x < 0;
    for (let i = 0; reverse ? i > _zoom * x : i < _zoom * x; reverse ? i -= DOTTED * 2 : i += DOTTED * 2)
    {
        let far;
        if (reverse)
        {
            far = i - DOTTED < _zoom * x ? _zoom * x : i - DOTTED;
        }
        else
        {
            far = i + DOTTED > _zoom * x ? _zoom * x : i + DOTTED;
        }
        _cursorBlock.moveTo(i, 0);
        _cursorBlock.lineTo(far, 0);
        _cursorBlock.moveTo(i, _zoom * y);
        _cursorBlock.lineTo(far, _zoom * y);
    }
    reverse = _zoom * y < 0;
    for (let i = 0; reverse ? i > _zoom * y : i < _zoom * y; reverse ? i -= DOTTED * 2 : i += DOTTED * 2)
    {
        let far;
        if (reverse)
        {
            far = i - DOTTED < _zoom * y ? _zoom * y : i - DOTTED;
        }
        else
        {
            far = i + DOTTED > _zoom * y ? _zoom * y : i + DOTTED;
        }
        _cursorBlock.moveTo(0, i);
        _cursorBlock.lineTo(0, far);
        _cursorBlock.moveTo(_zoom * x, i);
        _cursorBlock.lineTo(_zoom * x, far);
    }
}

function cursor()
{
    _cursorBlock.clear();
    switch (_state.tool)
    {
        case 'select':
            selectCursor();
            break;

        case 'paint':
            normalCursor();
            break;

        case 'circle':
            circleCursor(_state.foreground);
            break;

        case 'ellipse':
            ellipseCursor(_state.foreground);
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
            if ((_state.tool === 'circle' || _state.tool === 'ellipse') && _state.cursorSizeX < 1)
            {
                _state.cursorSizeX = 1;
            }
            if (_state.tool === 'ellipse' && _state.cursorSizeY < 1)
            {
                _state.cursorSizeY = 1;
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

        case 'ellipse':
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
            _pixel.save();
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
    _pixel.save();
    draw();
    ipcRenderer.send('pixel');
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

        case 'ellipse':
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

        case 'ellipse':
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
    title();
    ipcRenderer.send('reset');
}

function load(list)
{
    const filename = list[0];
    _pixel = new PixelEditor(filename);
    _state.lastFile = filename;
    _state.current = 0;
    title();
    resize();
    ipcRenderer.send('reset');
}

function newFile()
{
    _pixel = new PixelEditor();
    _state.lastFile = _pixel.filename;
    _state.current = 0;
    title();
    resize();
    ipcRenderer.send('reset');
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
        case 'ellipse':
            if (_state.cursorSizeX === 1 && _state.cursorSizeY === 1)
            {
                _state.cursorSizeX = 3;
                _state.cursorSizeY = 3;
            }
            break;

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
    ipcRenderer.send('state');
}

function cut()
{
    copy(true);
    dirty();
}

function copy(clear)
{
    _pixel.undoSave();
    if (_state.cursorSizeX === 1 && _state.cursorSizeY === 1)
    {
        _clipboard = { width: 1, height: 1, data: _pixel.get(_state.cursorX, _state.cursorY) };
        if (clear)
        {
            _pixel.set(_state.cursorX, _state.cursorY, null, true);
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
                    _pixel.set(x, y, null, true);
                }
            }
        }
    }
}

function paste()
{
    if (_clipboard)
    {
        _pixel.undoSave();
        let i = 0;
        for (let y = 0; y < _clipboard.height; y++)
        {
            for (let x = 0; x < _clipboard.width; x++)
            {
                _pixel.set(x + _state.cursorX, y + _state.cursorY, _clipboard.data[i++], true);
            }
        }
        dirty();
    }
}

function saveFile()
{
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), { title: 'Save PIXEL file', defaultPath: _state.lastPath }, save);
}

function openFile()
{
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), { title: 'Load PIXEL file', defaultPath: _state.lastPath, filters: [{ name: 'JSON', extensions: ['json'] }] }, load);
}

function key(code, special)
{
    _shift = special.shift;
    if (special.ctrl)
    {
        switch (code)
        {
            case 83:
                saveFile();
                break;
            case 79:
                openFile();
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
                _pixel.duplicate(_pixel.current);
                draw();
                dirty();
                break;
            case 65:
                _state.tool = 'select';
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
                _state.foreground = _pixel.get(_state.cursorX, _state.cursorY);
                ipcRenderer.send('state');
                break;
            case 27:
                clear();
                break;
            case 66:
                _state.tool = 'paint';
                tool();
                break;
            case 86:
                _state.tool = 'select';
                tool();
                break;
            case 67:
                _state.tool = 'circle';
                tool();
                break;
            case 76:
                _state.tool = 'line';
                tool();
                break;
            case 70:
                _state.tool = 'fill';
                tool();
                break;
            case 69:
                _state.tool = 'ellipse';
                tool();
                break;
            case 49:
                _state.foreground = 0;
                ipcRenderer.send('state');
                break;
            case 50:
                _state.foreground = 0xffffff;
                ipcRenderer.send('state');
                break;
            case 51: case 52: case 53: case 54: case 55: case 56: case 57: case 58:
                color(code - 51);
                break;
        }
    }
}

function convert(color)
{
    let test = color.toString(16);
    while (test.length < 6)
    {
        test = '0' + test;
    }
    return TinyColor(test).toHsl();
}

function color(color)
{
    const colors = [];
    function find(color)
    {
        for (let find of colors)
        {
            if (find === color)
            {
                return true;
            }
        }
    }
    for (let frame of _pixel.frames)
    {
        for (let color of frame.data)
        {
            if (color !== null && !find(color))
            {
                colors.push(color);
            }
        }
    }
    colors.sort(
        function (a, b)
        {
            const hslA = convert(a);
            const hslB = convert(b);
            return hslA.h < hslB.h ? -1 : hslA.h > hslB.h ? 1 : hslA.l < hslB.l ? -1 : hslA.l > hslB.l - 1 ? hslA.s < hslB.s : hslA.s > hslB.s ? -1 : 0;
        });
    if (color < colors.length)
    {
        _state.foreground = colors[color];
        ipcRenderer.send('state');
    }
}

function menu(caller, menu)
{
    switch (menu)
    {
        case 'new':
            newFile();
            break;

        case 'open':
            openFile();
            break;

        case 'save':
            saveFile();
            break;

        case 'duplicate':
            _pixel.duplicate(_pixel.current);
            draw();
            dirty();
            break;

        case 'delete':
            if (_pixel.frames.length > 1)
            {
                const current = _pixel.current === 0 ? 0 : _pixel.current - 1;
                _pixel.delete(_pixel.current);
                _pixel.current = current;
                draw();
                title();
                dirty();
            }
            break;

        case 'frame':
            _pixel.blank();
            _pixel.current = _pixel.frames.length - 1;
            draw();
            title();
            dirty();
            break;

        case 'paint':
            _state.tool = 'paint';
            tool();
            break;

        case 'select':
            _state.tool = 'select';
            tool();
            break;

        case 'circle':
            _state.tool = 'circle';
            tool();
            break;

        case 'ellipse':
            _state.tool = 'ellipse';
            tool();
            break;

        case 'line':
            _state.tool = 'line';
            tool();
            break;

        case 'fill':
            _state.tool = 'fill';
            tool();
            break;

    }
}

init();