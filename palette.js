const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const TinyColor = require('tinycolor2');

const Sheet = require('./sheet');
const View = require('./view');
const Input = require('./input');
const State = require('./data/state');
const PixelEditor = require('./data/pixel-editor');
const Color = require('yy-color');

const COLORS_PER_LINE = 10;

const BORDER = 5;
const WIDTH = 10;

let _state, _pixel, _colors = [[]],
    _blocks, _foreground, _background, _activeColor;

function init()
{
    _state = new State();
    _pixel = new PixelEditor(_state.lastFile);
    View.init();
    Sheet.init();
    _blocks = View.add(new PIXI.Container());
    palettes();
    Input.init(View.renderer.canvas, { down, keyDown });
    window.addEventListener('resize', resize);
    resize(true);
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('pixel', pixelChange);
    remote.getCurrentWindow().show();
}

function stateChange()
{
    _state.load();
    draw();
    View.render();
}

function pixelChange()
{
    _pixel.load();
    updateColors();
    draw();
    View.render();
}

function palettes()
{
    _colors[1] = [];
    for (let i = 0; i < COLORS_PER_LINE; i++)
    {
        const color = Color.blend((i + 1) / (COLORS_PER_LINE + 2), 0xffffff, 0);
        _colors[1].push(color);
    }
    _colors[2] = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff];
}

function resize(resize)
{
    View.resize();
    updateColors();
    draw(resize);
    View.render();
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

function updateColors()
{
    _colors[0] = [];
    function find(color)
    {
        for (let find of _colors[0])
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
                _colors[0].push(color);
            }
        }
    }
    _colors[0].sort(
        function (a, b)
        {
            const hslA = convert(a);
            const hslB = convert(b);
            return hslA.h < hslB.h ? -1 : hslA.h > hslB.h ? 1 : hslA.l < hslB.l ? -1 : hslA.l > hslB.l - 1 ? hslA.s < hslB.s : hslA.s > hslB.s ? -1 : 0;
        });
}

function draw()
{
    const width = (window.innerWidth / WIDTH) - (BORDER / WIDTH);
    _blocks.removeChildren();

    let yStart = 30;

    _foreground = _blocks.addChild(new PIXI.Sprite(_state.foreground === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE));
    _foreground.width = _foreground.height = width * 2 - BORDER;
    _foreground.position.set(BORDER, BORDER + yStart);
    if (_state.foreground !== null)
    {
        _foreground.tint = _state.foreground;
    }
    _background = _blocks.addChild(new PIXI.Sprite(_state.background === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE));
    _background.width = _background.height = width * 2 - BORDER;
    _background.position.set(BORDER + width * 2, BORDER + yStart);
    if (_state.background !== null)
    {
        _background.tint = _state.background;
    }

    const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
    block.width = block.height = width / 3;
    block.position.set((_state.isForeground ? width: width * 2) - block.width / 2 + BORDER / 2, width - block.width / 2 + BORDER / 2 + yStart);
    _activeColor = block;
    setActiveColor();

    const colors = [0, 0xffffff, null];
    for (let i = 0; i < colors.length; i++)
    {
        const color = colors[i];
        const block = _blocks.addChild(new PIXI.Sprite(color === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE));
        block.width = block.height = width * 1.25 - BORDER;
        block.position.set(width * 5 + i * (width * 1.25) + BORDER, BORDER + width / 3 + yStart);
        if (color !== null)
        {
            block.tint = color;
        }
        else
        {
            block.isTransparent = true;
        }
    }

    let x = 0, y = 2;
    for (let line of _colors)
    {
        for (let i = 0; i < line.length; i++)
        {
            const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            block.width = block.height = width - BORDER;
            block.position.set(x * width + BORDER, y * width + BORDER + yStart);
            block.tint = line[i];
            x++;
            if (x === WIDTH && i !== line.length - 1)
            {
                y++;
                x = 0;
            }
        }
        x = 0;
        y++;
    }
}

function setActiveColor()
{
    let color;
    if (_state.isForeground)
    {
        _activeColor.x = _foreground.width / 2 - _activeColor.width / 2 + BORDER;
        color = _foreground.tint;
    }
    else
    {
        _activeColor.x = _foreground.width * 1.5 - _activeColor.width / 2 + BORDER * 2;
        color = _background.tint;
    }
    if (color === 0)
    {
        _activeColor.tint = 0xffffff;
    }
    else
    {
        _activeColor.tint = 0;
    }
}

function down(x, y)
{
    const point = new PIXI.Point(x, y);
    if (_foreground.containsPoint(point) && !_state.isForeground)
    {
        _state.isForeground = true;
        setActiveColor();
        View.render();
        return;
    }
    if (_background.containsPoint(point) && _state.isForeground)
    {
        _state.isForeground = false;
        setActiveColor();
        View.render();
        return;
    }
    for (let block of _blocks.children)
    {
        if (block.containsPoint(point))
        {
            if (_state.isForeground)
            {
                if (block.isTransparent)
                {
                    _foreground.tint = 0xffffff;
                    _foreground.texture = Sheet.getTexture('transparency');
                    _state.foreground = null;
                }
                else
                {
                    _foreground.tint = block.tint;
                    _foreground.texture = PIXI.Texture.WHITE;
                    _state.foreground = block.tint;
                }
            }
            else
            {
                if (block.isTransparent)
                {
                    _background.tint = 0xffffff;
                    _background.texture = Sheet.getTexture('transparency');
                    _state.background = null;
                }
                else
                {
                    _background.tint = block.tint;
                    _background.texture = PIXI.Texture.WHITE;
                    _state.background = block.tint;
                }
            }
            ipcRenderer.send('state');
            setActiveColor();
            View.render();
            return;
        }
    }
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

init();