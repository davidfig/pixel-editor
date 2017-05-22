const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const Parse = require('parse-json');
const Format = require('json-format');
const RenderSheet = require('yy-rendersheet');
const Pixel = require('../components/pixel/pixel');

const Input = require('./input');
const View = require('./view');
const State = require('./data/state');
const PixelEditor = require('./data/pixel-editor');

let _canvas, _state, _pixel, _sprite, _sheet,
    _code, _error, _select, _hide, _top, _middle, _saved, _editing,
    _time, _animation, _animations = {}, _animationName;

function init()
{
    _state = new State();
    _pixel = new PixelEditor(_state.lastFile);
    _canvas = document.getElementById('canvas');
    View.init({ canvas: _canvas });
    Input.init(_canvas, { keyDown });

    _code = document.getElementById('code');
    _code.addEventListener('focus', () => _editing = true);
    _code.addEventListener('blur', () => _editing = false);
    _code.addEventListener('input', codeChange);

    _error = document.getElementById('error');
    _select = document.getElementById('animation');
    _select.addEventListener('change', changeAnimation);
    document.getElementById('play').addEventListener('click', changeAnimation);
    document.getElementById('stop').addEventListener('click', () => _sprite.frame(0));
    _hide = document.getElementById('hide');
    _hide.addEventListener('click', hide);
    _top = document.getElementById('top');
    _middle = document.getElementById('middle');

    setup();
    resize();
    setupSelect();

    window.addEventListener('resize', resize);
    remote.getCurrentWindow().show();

    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('pixel', pixelChange);
    ipcRenderer.on('reset', reset);

    update();
    resize();
    hide();
}

function stateChange()
{
    _state.load();
}

function pixelChange()
{
    _pixel.load();
    resize();
}

function reset()
{
    _state.load();
    _pixel = new PixelEditor(_state.lastFile);
    setup();
    resize();
    setupSelect();
}

function changeAnimation()
{
    _sprite.animate(_select.value);
    View.render();
}

function hide()
{
    if (_hide.innerHTML === 'Hide Code')
    {
        _hide.innerHTML = 'Show Code';
        _saved = remote.getCurrentWindow().getContentSize();
        _code.style.display = 'none';
        _error.style.display = 'none';
        remote.getCurrentWindow().noResizeSave = true;
        remote.getCurrentWindow().setContentSize(_middle.offsetWidth, _middle.offsetHeight + _top.offsetHeight);
    }
    else
    {
        _hide.innerHTML = 'Hide Code';
        if (_saved)
        {
            remote.getCurrentWindow().setContentSize(_saved[0], _saved[1]);
        }
        _code.style.display = 'block';
        _error.style.display = 'block';
        remote.getCurrentWindow().noResizeSave = false;
    }
}

function setup()
{
    _sheet = new RenderSheet({ scaleMode: PIXI.SCALE_MODES.NEAREST });
    try
    {
        _code.value = Format(_pixel.animations);
    }
    catch (e)
    {
        _code.value = _pixel.animations;
        _error.innerHTML = e.message;
    }
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
                _animationName = animation;
            }
            _animations[animation] = true;
            _select.innerHTML += '<option value="' + animation + '"' + (different === animation ? 'selected = "selected"' : '') + '>' + animation + '</option>';
            if (different === animation)
            {
                _animation = _pixel.animations[animation];
                _animationName = animation;
            }
        }
        if (_sprite)
        {
            _sprite.animate(_animationName);
        }
    }
    else
    {
        if (_sprite)
        {
            _sprite.animate(_animationName);
        }
    }
}

function resize()
{
    View.resize();
    View.clear();
    _sprite = View.add(new Pixel(_pixel.getData(), _sheet));
    _sheet.render();
    _sprite.frame(0);
    _sprite.scale.set(_state.pixels);
    if (_animationName)
    {
        _sprite.animate(_animationName);
    }
    _canvas.style.width = _sprite.width + 'px';
    _canvas.style.height = _sprite.height + 'px';
    View.render();

    _code.style.height = window.innerHeight - _top.offsetHeight - _middle.offsetHeight - _error.offsetHeight + 'px';
}

function update()
{
    const now = Date.now();
    const elapsed = _time ? now - _time : 0;
    _time = now;
    if (_sprite)
    {
        if (_sprite.update(elapsed))
        {
            View.render();
        }
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
        ipcRenderer.send('pixel');
        setupSelect();
        resize();
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