const remote = require('electron').remote;

const Input = require('./input');
const View = require('./view');

let _pixel, _blocks, _width, _height, _animation, _time, _next;

function init()
{
    View.init({ canvas: document.getElementById('canvas') });
    Input.init(View.renderer.canvas, { keyDown, down });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    _blocks = View.add(new PIXI.Container());
    setup();
    window.addEventListener('resize', resize);
    resize();
    remote.getCurrentWindow().show();
}

function setup()
{
    _blocks.removeChildren();
    _width = 0;
    _height = 0;
    for (let frame of _pixel.frames)
    {
        if (frame.width > _width)
        {
            _width = frame.width;
        }
        if (frame.height > _height)
        {
            _height = frame.height;
        }
    }
    for (let y = 0; y < _height; y++)
    {
        for (let x = 0; x < _width; x++)
        {
            _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        }
    }
    _time = 0;
}

function resize()
{
    View.resize();
    let i = 0, blocks = _blocks.children;
    for (let y = 0; y < _height; y++)
    {
        for (let x = 0; x < _width; x++)
        {
            const block = blocks[i];
            block.width = block.height = remote.getCurrentWindow().state.zoom;
        }
    }
    View.render();
}

function update(elapsed)
{
    _time += elapsed;
    if (_time >= _next)
    {

    }
    for (let y = 0; y < frame.height; y++)
    {
        for (let x = 0; x < frame.height; x++)
        {
            const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            block.width = block.height = _zoom;
            block.position.set(xStart + x * _zoom, yStart + y * _zoom);
            const color = frame.data[x + y * frame.width];
            block.tint = color === null ? TRANSPARENT : color;
        }
    }
    const window = remote.getCurrentWindow();
    window.setContentSize(total.width, total.height + yStart + BUFFER + document.getElementById('spacer').offsetHeight);
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
            remote.getCurrentWindow().windows.zoom.emit('refresh');
            return;
        }
    }
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

init();