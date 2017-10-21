const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const FontFaceObserver = require('fontfaceobserver');
const PIXI = require('pixi.js')

const Sheet = require('./sheet');
const View = require('./view');
const Input = require('./input');
const State = require('./data/state');

const SELECT = 0xdddddd;
const UNSELECT = 0x777777;

const BORDER = 5;
const WIDTH = 50;
let _state,
    _blocks,
    _text;

const TOOLS = ['paint', 'select', 'circle', 'ellipse', 'line', 'fill'];

function init()
{
    _state = new State();
    View.init();
    Input.init(View.renderer.canvas, { down, keyDown });
    Sheet.init();
    _blocks = View.add(new PIXI.Container());
    _text = View.add(new PIXI.Container());
    window.addEventListener('resize', resize);
    resize(true);
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('reset', stateChange);
    remote.getCurrentWindow().show();
}

function stateChange()
{
    if (arguments.length)
    {
        _state.load();
    }
    for (let block of _blocks.children)
    {
        block.tint = (block.tool === _state.tool) ? SELECT : UNSELECT;
    }
    View.render();

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
    const yStart = 30;
    let y = 0;
    for (let tool of TOOLS)
    {
        const block = _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        block.width = block.height = WIDTH - BORDER;
        block.position.set(BORDER, y * WIDTH + BORDER + yStart);
        block.tint = (_state.tool === tool) ? SELECT : UNSELECT;
        block.tool = tool;
        const text = _text.addChild(new PIXI.Text(tool[0].toUpperCase(), { fontFamily: 'bitmap', fontSize: WIDTH * 0.75, fill: 0xffffff }));
        text.anchor.set(0.5);
        text.position.set(BORDER / 2 + WIDTH / 2, y * WIDTH + BORDER + WIDTH / 2 + yStart);
        y++;
    }
    if (resize === true)
    {
        const window = remote.getCurrentWindow();
        window.setContentSize(Math.ceil(BORDER + WIDTH), Math.ceil(y * WIDTH + BORDER * 2 + yStart));
    }
}

function down(x, y)
{
    const point = new PIXI.Point(x, y);
    for (let block of _blocks.children)
    {
        if (block.containsPoint(point))
        {
            if (_state.tool !== block.tool)
            {
                _state.tool = block.tool;
                stateChange();
                ipcRenderer.send('state');
            }
            return;
        }
    }
}

function keyDown(code, special)
{
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

const font = new FontFaceObserver('bitmap');
font.load().then(function () { init(); });