const remote = require('electron').remote;

const Input = require('./input');

let _pixel;

function init()
{
    Input.init(null, { keyDown });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    // window.addEventListener('resize', resize);
    // resize();
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
    for (let y = 0; y < _pixel.height; y++)
    {
        for (let x = 0; x < _pixel.height; x++)
        {
            const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            block.width = block.height = _zoom;
            block.position.set(BUFFER + x * _zoom, BUFFER + y * _zoom);
            const color = _pixel.get(x, y);
            block.tint = color === null ? TRANSPARENT : color;
        }
    }
    const window = remote.getCurrentWindow();
    window.setContentSize(BUFFER * 2 + Math.ceil(_pixel.width * _zoom), BUFFER * 2 + Math.ceil(_pixel.height * _zoom));
    View.render();
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

init();