const remote = require('electron').remote;

const Input = require('./input');
const View = require('./view');

const BUFFER = 10;

let _pixel,
    _zoom = 5,
    _blocks,
    _buttons;

const TRANSPARENT = 0x888888;

function init()
{
    View.init({canvas: document.getElementById('canvas')});
    Input.init(View.renderer.canvas, { keyDown, down });
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
    let xStart = BUFFER, yStart = BUFFER, i = 0, total = { width: xStart, height: 0 };
    for (let frame of _pixel.frames)
    {
        if (i === _pixel.current)
        {
            const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            block.width = _zoom * frame.width + BUFFER;
            block.height = _zoom * frame.height + BUFFER;
            block.position.set(xStart - BUFFER / 2, yStart - BUFFER / 2);
            block.tint = 0xff0000;
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
        _buttons.push({ x1: xStart, y1: yStart + BUFFER, x2: xStart + _zoom * frame.width, y2: yStart + BUFFER + _zoom * frame.height, current: i });
        xStart += BUFFER + _zoom * frame.width;
        total.width += BUFFER + _zoom * frame.width;
        total.height = _zoom * frame.height > total.height ? _zoom * frame.height : total.height;
        i++;
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