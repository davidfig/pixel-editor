const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const RenderSheet = require('yy-rendersheet');

const Input = require('./input');
const View = require('./view');
const State = require('./data/state');
const PixelEditor = require('./data/pixel-editor');
const Pixel = require('./data/pixel');

const COLOR_SELECTED = 0x888888;

const BUFFER = 10;

let _sheet,
    _state,
    _pixel,
    _pixels,
    _buttons,
    _name,
    _spacer,
    _canvas;

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
    Input.init(_canvas, { keyDown, down });
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('pixel', pixelChange);
    pixelChange();
    resize();
    window.addEventListener('resize', resize);
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

function resize()
{
    View.resize();
    _pixels.removeChildren();
    _buttons = [];
    const data = _pixel.getData();
    let xStart = BUFFER, yStart = BUFFER;
    for (let i = 0; i < _pixel.frames.length; i++)
    {
        let block;
        if (i === _pixel.current)
        {
            block = _pixels.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            block.tint = COLOR_SELECTED;
            block.position.set(xStart - BUFFER / 2, yStart - BUFFER / 2);
            block.width = _state.pixels * _pixel.width + BUFFER;
            block.height = _state.pixels * _pixel.height + BUFFER;
            _name.innerHTML = i;
        }
        const pixel = _pixels.addChild(new Pixel(data, _sheet));
        if (i === 0)
        {
            pixel.sheet(_sheet);
            _sheet.render();
        }
        pixel.scale.set(_state.pixels);
        pixel.frame(i);
        pixel.position.set(xStart, yStart);
        _buttons.push({ x1: xStart, y1: yStart - BUFFER, x2: xStart + pixel.width, y2: yStart + pixel.height + BUFFER, current: i });
        xStart += BUFFER + pixel.width;
    }
    const window = remote.getCurrentWindow();
    window.setContentSize(xStart, _pixels.height + _spacer.offsetHeight + _name.offsetHeight + BUFFER);
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
            return;
        }
    }
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

init();