const remote = require('electron').remote;

const Input = require('./input');
const View = require('./view');

const BUFFER = 10;

let _pixel,
    _blocks,
    _buttons,
    _name,
    _nameDiv,
    _spacer,
    _canvas;

const TRANSPARENT = 0x888888;

function init()
{
    _spacer = document.getElementById('spacer');
    _name = document.getElementById('name');
    _nameDiv = document.getElementById('name-div');
    _canvas = document.getElementById('canvas');
    View.init({canvas: _canvas});
    Input.init(_canvas, { keyDown, down });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    _blocks = View.add(new PIXI.Container());
    window.addEventListener('resize', resize);
    resize();
    remote.getCurrentWindow().on('dirty', draw);
    remote.getCurrentWindow().show();
}

function resize()
{
    View.resize();
    draw();
    View.render();
}

function draw()
{
    _blocks.removeChildren();
    _buttons = [];
    let xStart = BUFFER, yStart = BUFFER, i = 0, total = { width: xStart, height: yStart };
    for (let frame of _pixel.frames)
    {
        if (i === _pixel.current)
        {
            const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            block.width = _pixel.pixels * frame.width + BUFFER;
            block.height = _pixel.pixels * frame.height + BUFFER;
            block.position.set(xStart - BUFFER / 2, yStart - BUFFER / 2);
            block.tint = 0xff0000;
            _name.innerHTML = i;
        }
        for (let y = 0; y < frame.height; y++)
        {
            for (let x = 0; x < frame.width; x++)
            {
                const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
                block.width = block.height = _pixel.pixels;
                block.position.set(xStart + x * _pixel.pixels, yStart + y * _pixel.pixels);
                const color = frame.data[x + y * frame.width];
                block.tint = color === null ? TRANSPARENT : color;
            }
        }

        _buttons.push({ x1: xStart, y1: yStart + BUFFER, x2: xStart + _pixel.pixels * frame.width, y2: yStart + BUFFER + _pixel.pixels * frame.height, current: i });
        xStart += BUFFER + _pixel.pixels * frame.width;
        total.width += BUFFER + _pixel.pixels * frame.width;
        total.height = _pixel.pixels * frame.height > total.height ? _pixel.pixels * frame.height : total.height;
        i++;
    }
    const window = remote.getCurrentWindow();
    window.setContentSize(total.width, _spacer.offsetHeight + _nameDiv.offsetHeight + total.height + yStart + BUFFER + document.getElementById('spacer').offsetHeight);
    View.render();
}

function down(x, y)
{
    y -= document.getElementById('spacer').offsetHeight;
    for (let button of _buttons)
    {
        if (x >= button.x1 && x <= button.x2 && y >= button.y1 && y <= button.y2)
        {
            _pixel.current = button.current;
            draw();
            _name.innerHTML = button.current;
            remote.getCurrentWindow().windows.zoom.emit('refresh');
            return;
        }
    }
}

function keyDown(code, special)
{
    if (!_editing)
    {
        remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
    }
}

init();