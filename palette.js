const remote = require('electron').remote;

const View = require('./view');

const BORDER = 5;
const WIDTH = 10;
let _blocks,
    _pixel,
    _colors;

function init()
{
    _pixel = remote.getCurrentWindow().pixel.pixel;
    _colors = remote.getCurrentWindow().pixel.colors;
    _blocks = View.add(new PIXI.Container());
    draw();
    View.dirty();
}

function draw()
{
    const size = remote.getCurrentWindow().getContentSize();
    const width = (size[0] / WIDTH) - (BORDER / WIDTH);
    _blocks.removeChildren();
    let x = 0, y = 0;
    for (let color of _colors.colors)
    {
        const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        block.width = block.height = width - BORDER;
        block.position.set(x * width + BORDER, y * width + BORDER);
        block.tint = color;
        x++;
        if (x > WIDTH)
        {
            y++;
            x = 0;
        }
    }
    const window = remote.getCurrentWindow();
    // window.setContentSize(_pixel.width * _zoom, _pixel.height * _zoom);
}

module.exports = {
    init,
    draw
};