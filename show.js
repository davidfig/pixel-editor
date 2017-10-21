const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const PIXI = require('pixi.js')
const RenderSheet = require('yy-rendersheet');
const Pixel = require('yy-pixel').Pixel;
const FontFaceObserver = require('fontfaceobserver');

const Input = require('./input');
const View = require('./view');
const State = require('./data/state');
const PixelEditor = require('./data/pixel-editor');

const COLOR_SELECTED = 0x888888;

const BUFFER = 10;

let _sheet,
    _state,
    _pixel,
    _pixels,
    _buttons,
    _name,
    _spacer,
    _canvas,
    _selector,
    _dragging;

function init()
{
    _state = new State();
    _pixel = new PixelEditor(_state.lastFile);
    _sheet = new RenderSheet({scaleMode: PIXI.SCALE_MODES.NEAREST});
    _spacer = document.getElementById('spacer');
    _name = document.getElementById('name');
    _canvas = document.getElementById('canvas');
    View.init({ canvas: _canvas });
    _pixels = View.add(new PIXI.Container());
    Input.init(_canvas, { keyDown, down, up, move });
    pixelChange();
    resize();
    window.addEventListener('resize', resize);
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('pixel', pixelChange);
    ipcRenderer.on('reset', reset);
    remote.getCurrentWindow().show();
}

function stateChange()
{
    _state.load();
}

function pixelChange()
{
    if (arguments.length)
    {
        _pixel.load();
    }
    resize();
}

function reset()
{
    _state.load();
    _pixel = new PixelEditor(_state.lastFile);
    resize();
}

function resize()
{
    View.resize();
    _pixels.removeChildren();
    _buttons = [];
    const data = _pixel.getData();
    let xStart = BUFFER, yStart = BUFFER, yEnd = 0;
    for (let i = 0; i < _pixel.frames.length; i++)
    {
        _selector;
        if (i === _pixel.current)
        {
            _selector = _pixels.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            _selector.tint = COLOR_SELECTED;
            _selector.position.set(xStart - BUFFER / 2, yStart - BUFFER / 2);
            _selector.width = _state.pixels * _pixel.width + BUFFER;
            _selector.height = _state.pixels * _pixel.height + BUFFER;
            _name.innerHTML = i;
        }
        const pixel = _pixels.addChild(new Pixel(data, _sheet));
        if (i === 0)
        {
            pixel.render(true);
            _sheet.render();
        }
        pixel.scale.set(_state.pixels);
        pixel.frame(i);
        pixel.position.set(xStart, yStart);
        const n = _pixels.addChild(new PIXI.Text(i, { fontFamily: 'bitmap', fontSize: '20px', fill: 0 }));
        n.anchor.set(0, 1);
        n.position.set(xStart, yStart + _state.pixels * _pixel.height);
        yEnd = pixel.height > yEnd ? pixel.height : yEnd;
        _buttons.push({ pixel, x1: xStart, y1: yStart - BUFFER, x2: xStart + pixel.width, y2: yStart + pixel.height + BUFFER, current: i });
        xStart += BUFFER + pixel.width;
    }
    const window = remote.getCurrentWindow();
    window.setContentSize(xStart + BUFFER * 2, yEnd + _spacer.offsetHeight + _name.offsetHeight + BUFFER * 2);
    View.render();
}

function down(x, y)
{
    y -= _spacer.offsetHeight + _name.offsetHeight;
    for (let button of _buttons)
    {
        if (x >= button.x1 && x <= button.x2 && y >= button.y1 && y <= button.y2)
        {
            if (_pixel.current !== button.current)
            {
                _pixel.current = button.current;
                _name.innerHTML = button.current;
                resize();
                ipcRenderer.send('pixel');
            }
            const pixel = _buttons[button.current].pixel;
            _dragging = { pixel, current: button.current, x, y, originalX: pixel.x, originalY: pixel.y };
            return;
        }
    }
}

function move(x, y)
{
    if (_dragging)
    {
        const width = 10;
        y -= _spacer.offsetHeight + _name.offsetHeight;
        _dragging.pixel.x = _dragging.originalX + (x - _dragging.x);
        _dragging.pixel.y = _dragging.originalY + (y - _dragging.y);
        let found = false;
        for (let button of _buttons)
        {
            if (x < (button.x1 + button.x2) / 2)
            {
                if (button.current === _dragging.current || button.current - 1 === _dragging.current)
                {
                    _selector.x = _dragging.originalX;
                    _selector.width = _state.pixels * _pixel.width + BUFFER;
                    _dragging.drop = _dragging.current;
                }
                else
                {
                    _selector.x = button.x1 - width / 2;
                    _selector.width = width;
                    _dragging.drop = button.current;
                }
                found = true;
                break;
            }
        }
        if (!found)
        {
            if (_dragging.current === _buttons.length - 1)
            {
                _selector.x = _dragging.originalX;
                _selector.width = _state.pixels * _pixel.width + BUFFER;
                _dragging.drop = _dragging.current;
            }
            else
            {
                _selector.x = _buttons[_buttons.length - 1].x2 + _pixel.width;
                _selector.width = width;
                _dragging.drop = _buttons.length;
            }
        }
        View.render();
    }
}

function up()
{
    if (_dragging)
    {
        if (_dragging.drop)
        {
            if (_dragging.drop !== _dragging.current)
            {
                _pixel.move(_dragging.current, _dragging.drop);
                ipcRenderer.send('pixel');
            }
        }
        _dragging = null;
        resize();
    }
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

const font = new FontFaceObserver('bitmap');
font.load().then(function () { init(); });