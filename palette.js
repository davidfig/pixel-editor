const remote = require('electron').remote;

const Sheet = require('./sheet');
const View = require('./view');
const Input = require('./input');

const BORDER = 5;
const WIDTH = 10;
let _blocks,
    _foreground,
    _background,
    _colors,
    _activeColor,
    _isForeground = true;

function init()
{
    View.init();
    Input.init(View.renderer.canvas, { down });
    Sheet.init();
    _colors = remote.getCurrentWindow().pixel.colors;
    _blocks = View.add(new PIXI.Container());
    window.addEventListener('resize', resize);
    resize(true);
}

function resize(resize)
{
    View.resize();
    draw(resize);
    View.render();
}

function draw(resize)
{
    const size = remote.getCurrentWindow().getContentSize();
    const width = (size[0] / WIDTH) - (BORDER / WIDTH);
    _blocks.removeChildren();

    _foreground = _blocks.addChild(new PIXI.Sprite(_colors.foreground === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE));
    _foreground.width = _foreground.height = width * 2 - BORDER;
    _foreground.position.set(BORDER, BORDER);
    if (_colors.foreground !== null)
    {
        _foreground.tint = _colors.foreground;
    }
    _background = _blocks.addChild(new PIXI.Sprite(_colors.background === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE));
    _background.width = _background.height = width * 2 - BORDER;
    _background.position.set(BORDER + width * 2, BORDER);
    if (_colors.background !== null)
    {
        _background.tint = _colors.background;
    }

    const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
    block.width = block.height = width / 3;
    block.position.set((_isForeground ? width: width * 2) - block.width / 2 + BORDER / 2, width - block.width / 2 + BORDER / 2);
    _activeColor = block;
    setActiveColor();

    const colors = [0, 0xffffff, null];
    for (let i = 0; i < colors.length; i++)
    {
        const color = colors[i];
        const block = _blocks.addChild(new PIXI.Sprite(color === null ? Sheet.getTexture('transparency') : PIXI.Texture.WHITE));
        block.width = block.height = width * 1.25 - BORDER;
        block.position.set(width * 5 + i * (width * 1.25) + BORDER, BORDER + width / 3);
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
    for (let color of _colors.colors)
    {
        const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        block.width = block.height = width - BORDER;
        block.position.set(x * width + BORDER, y * width + BORDER);
        block.tint = color;
        x++;
        if (x === WIDTH)
        {
            y++;
            x = 0;
        }
    }
    if (resize === true)
    {
        const window = remote.getCurrentWindow();
        window.setContentSize(Math.ceil(WIDTH * width) + BORDER, Math.ceil((y + 1) * width + BORDER));
    }
}

function setActiveColor()
{
    let color;
    if (_isForeground)
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
    if (_foreground.containsPoint(point))
    {
        _isForeground = true;
        setActiveColor();
        View.render();
        return;
    }
    if (_background.containsPoint(point))
    {
        _isForeground = false;
        setActiveColor();
        View.render();
        return;
    }
    for (let block of _blocks.children)
    {
        if (block.containsPoint(point))
        {
            if (_isForeground)
            {
                if (block.isTransparent)
                {
                    _foreground.tint = 0xffffff;
                    _foreground.texture = Sheet.getTexture('transparency');
                    _colors.foreground = null;
                }
                else
                {
                    _foreground.tint = block.tint;
                    _foreground.texture = PIXI.Texture.WHITE;
                    _colors.foreground = block.tint;
                }
            }
            else
            {
                if (block.isTransparent)
                {
                    _background.tint = 0xffffff;
                    _background.texture = Sheet.getTexture('transparency');
                    _colors.background = null;
                }
                else
                {
                    _background.tint = block.tint;
                    _background.texture = PIXI.Texture.WHITE;
                    _colors.background = block.tint;
                }
            }
            setActiveColor();
            View.render();
            return;
        }
    }
}

init();