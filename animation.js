const remote = require('electron').remote;
const Parse = require('parse-json');
const Format = require('json-format');
const Random = require('yy-random');

const Input = require('./input');
const View = require('./view');

let _canvas, _pixel, _code, _error, _select, _hide, _top, _middle, _saved, _blocks, _width, _height, _animations = {}, _editing,
    _animation, _next, _frame, _index, _entry;

function init()
{
    _canvas = document.getElementById('canvas');
    View.init({ canvas: _canvas });
    Input.init(_canvas, { keyDown });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    _blocks = View.add(new PIXI.Container());
    _code = document.getElementById('code');
    _code.addEventListener('focus', () => _editing = true);
    _code.addEventListener('blur', () => _editing = false);
    _code.addEventListener('input', codeChange);
    _error = document.getElementById('error');
    _select = document.getElementById('animation');
    _hide = document.getElementById('hide');
    _hide.addEventListener('click', hide);
    _top = document.getElementById('top');
    _middle = document.getElementById('middle');
    setup();
    window.addEventListener('resize', resize);
    resize();
    _next = 0;
    _frame = _pixel.frames[0];
    remote.getCurrentWindow().show();
    update(0);
}

function hide()
{
    if (_hide.innerHTML === 'Hide Code')
    {
        _hide.innerHTML = 'Show Code';
        _code.style.display = 'none';
        _error.style.display = 'none';
        _saved = remote.getCurrentWindow().getContentSize();
        remote.getCurrentWindow().noResizeSave = true;
        remote.getCurrentWindow().setContentSize(_middle.offsetWidth, _middle.offsetHeight);
    }
    else
    {
        _hide.innerHTML = 'Hide Code';
        remote.getCurrentWindow().setContentSize(_saved[0], _saved[1]);
        _code.style.display = 'block';
        _error.style.display = 'block';
        remote.getCurrentWindow().noResizeSave = false;
    }
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
    _canvas.width = _width * _pixel.pixels;
    _canvas.height = _height * _pixel.pixels;
    _canvas.style.width = _width * _pixel.pixels + 'px';
    _canvas.style.height = _height * _pixel.pixels + 'px';
    for (let y = 0; y < _height; y++)
    {
        for (let x = 0; x < _width; x++)
        {
            _blocks.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        }
    }
    setupSelect();
    try
    {
        _code.value = Format(_pixel.animations);
    }
    catch (e) { }
}


function setupSelect()
{
    let different = false;
    for (let animation in _pixel.animations)
    {
        if (!_animations[animation])
        {
            different = animation;
            break;
        }
    }
    for (let animation in _animations)
    {
        if (!_pixel.animations[animation])
        {
            different = true;
            break;
        }
    }
    if (different)
    {
        _animation = null;
        _animations = {};
        _select.innerHTML = '';
        for (let animation in _pixel.animations)
        {
            if (!_animation)
            {
                _animation = _pixel.animations[animation];
            }
            _animations[animation] = true;
            _select.innerHTML += '<option value="' + animation + '"' + (different === animation ? 'selected = "selected"' : '') + '>' + animation + '</option>';
            if (different === animation)
            {
                _animation = _pixel.animations[animation];
            }
        }
        changeAnimation();
    }
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
    // _error.style.display = 'none';
    _code.style.height = window.innerHeight - _top.offsetHeight - document.getElementById('middle').offsetHeight - _error.offsetHeight + 'px';
}

function changeAnimation()
{
    if (_animation)
    {
        _index = 0;
        updateFrame(0);
    }
}

function updateFrame(leftover)
{
    _entry = _animation[_index];
    if (!Array.isArray(_entry))
    {
        switch (_entry)
        {
            case 'loop':
                _index = 0;
                _entry = _animation[0];
                break;
        }
    }
    if (Array.isArray(_entry[1]))
    {
        _next = Random.range(_entry[1][0], _entry[1][1]) + leftover;
    }
    else
    {
        _next = _entry[1] + leftover;
    }
    _frame = _pixel.frames[_entry[0]];
}

function update(elapsed)
{
    if (_next === -1)
    {
        return;
    }
    _next -= elapsed;
    if (_next <= 0)
    {
        _index++;
        if (_index === _animation.length)
        {
            _next = -1;
        }
        updateFrame(_next);
        const blocks = _blocks.children;
        for (let block of blocks)
        {
            block.tint = 0xffffff;
        }
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
    requestAnimationFrame(update);
}

function codeChange()
{
    try
    {
        const value = Parse(_code.value);
        _error.innerHTML = 'Compiled.';
        _pixel.animations = value;
        _pixel.save();
        setupSelect();
        changeAnimation();
    }
    catch (e)
    {
        _error.innerHTML = e.message;
    }
}

function keyDown(code, special, e)
{
    if (_editing)
    {
        if (code === 9)
        {
            e.preventDefault();
            const s = _code.selectionStart;
            _code.value = _code.value.substring(0, _code.selectionStart) + '\t' + _code.value.substring(_code.selectionEnd);
            _code.selectionEnd = s + 4;
        }
    }
    else
    {
        remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
    }
}

init();