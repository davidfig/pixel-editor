const remote = require('electron').remote;
const Update = require('yy-update');
const EasyEdit = require('./easyedit');
const Input = require('./input');
const View = require('./view');

let _pixel, _blocks, _width, _height, _animation, _time, _next, _frame, _editing;

function init()
{
    Update.init();
    View.init({ canvas: document.getElementById('canvas') });
    Input.init(View.renderer.canvas, { keyDown, down });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    _blocks = View.add(new PIXI.Container());
    setup();
    window.addEventListener('resize', resize);
    resize();
    remote.getCurrentWindow().show();
    Update.add(update);
    _time = 0;
    _next = 0;
    _frame = _pixel.frames[0];
    new EasyEdit(document.getElementById('name'), { onsuccess: changeName, onstart: () => _editing = true, oncancel: () => _editing = false });
    Update.update();
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
    document.getElementById('canvas').width = _width * _pixel.pixels;
    document.getElementById('canvas').height = _height * _pixel.pixels;
    document.getElementById('canvas').style.width = _width * _pixel.pixels + 'px';
    document.getElementById('canvas').style.height = _height * _pixel.pixels + 'px';
    for (let y = 0; y < _height; y++)
    {
        for (let x = 0; x < _width; x++)
        {
            _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        }
    }
    const select = document.getElementById('animation');
    let html = '';
    for (let animation in _pixel.animations)
    {
        html += '<option value="' + animation + '">' + animation.name + '</option>';
    }
    html += '<option value="-new">Create animation...</option>';
    select.innerHTML = html;
    document.getElementById('name').innerHTML = _animation ? _animation.name : 'Create here';
}

function resize()
{
    View.resize();
    let i = 0, blocks = _blocks.children;
    for (let y = 0; y < _height; y++)
    {
        for (let x = 0; x < _width; x++)
        {
            const block = blocks[i++];
            block.width = block.height = _pixel.pixels;
            block.position.set(x * _pixel.pixels, y * _pixel.pixels);
        }
    }
}

function update(elapsed)
{
    const blocks = _blocks.children;
    _time += elapsed;
    for (let block of blocks)
    {
        block.tint = 0xffffff;
    }
    if (_time >= _next)
    {
        _next = 1000;
        for (let y = 0; y < _frame.height; y++)
        {
            for (let x = 0; x < _frame.width; x++)
            {
                const i = x + y * _frame.width;
                blocks[i].tint = (_frame.data[i] === null) ? 0xbbbbbb : _frame.data[i];
            }
        }
        View.render();
    }
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

function changeName()
{

}

function keyDown(code, special)
{
    if (!_editing)
    {
        remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
    }
}

init();