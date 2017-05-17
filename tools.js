const remote = require('electron').remote;
const FontFaceObserver = require('fontfaceobserver');

const Sheet = require('./sheet');
const View = require('./view');
const Input = require('./input');

const SELECT = 0xdddddd;
const UNSELECT = 0x777777;

const BORDER = 5;
const WIDTH = 50;
let _blocks,
    _text,
    _data;

const TOOLS = ['paint', 'select', 'circle'];

function init()
{
    View.init(document.getElementById('canvas'));
    Input.init(View.renderer.canvas, { down });
    Sheet.init();
    _data = remote.getCurrentWindow().pixel;
    _blocks = View.add(new PIXI.Container());
    _text = View.add(new PIXI.Container());
    window.addEventListener('resize', resize);
    resize(true);
    remote.getCurrentWindow().show();
}

function resize(resize)
{
    View.resize();
    draw(resize);
    View.render();
}

function draw(resize)
{
    _blocks.removeChildren();
    _text.removeChildren();
    let y = 0.5;
    for (let tool of TOOLS)
    {
        const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        block.width = block.height = WIDTH - BORDER;
        block.position.set(BORDER, y * WIDTH + BORDER);
        block.tint = (_data.tool === tool) ? SELECT : UNSELECT;
        block.tool = tool;
        const text = _text.addChild(new PIXI.Text(tool[0].toUpperCase(), { fontFamily: 'bitmap', fontSize: WIDTH * 0.75, fill: 0xffffff }));
        text.anchor.set(0.5);
        text.position.set(BORDER / 2 + WIDTH / 2, y * WIDTH + BORDER + WIDTH / 2);
        y++;
    }
    if (resize === true)
    {
        const window = remote.getCurrentWindow();
        window.setContentSize(Math.ceil(BORDER + WIDTH), Math.ceil(y * WIDTH + BORDER * 2));
    }
}

function updateTool()
{
    for (let block of _blocks.children)
    {
        block.tint = (block.tool === _data.tool) ? SELECT : UNSELECT;
    }
    View.render();
}

function down(x, y)
{
    const point = new PIXI.Point(x, y);
    for (let block of _blocks.children)
    {
        if (block.containsPoint(point))
        {
            _data.tool = block.tool;
            updateTool();
            return;
        }
    }
}

const font = new FontFaceObserver('bitmap');
font.load().then(function () { init(); });