const remote = require('electron').remote;
const FontFaceObserver = require('fontfaceobserver');

const Input = require('./input');
const EasyEdit = require('./easyedit');

let _pixel, _editing;

function init()
{
    Input.init(null, { keyDown });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    size(_pixel.width, _pixel.height);
    pixel(_pixel.pixels);
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
    remote.getCurrentWindow().show();
    remote.getCurrentWindow().on('cursor', move);
    new EasyEdit(document.getElementById('width'), { onsuccess: widthChange, oncancel: cancel, onedit: start });
    new EasyEdit(document.getElementById('height'), { onsuccess: heightChange, oncancel: cancel, onedit: start });
    new EasyEdit(document.getElementById('pixels'), { onsuccess: pixelsChange, oncancel: cancel, onedit: start });
}

function start()
{
    _editing = true;
}

function cancel()
{
    _editing = false;
}

function widthChange(value)
{
    const original = _pixel.width;
    _pixel.width = value;
    if (_pixel.width !== parseInt(value))
    {
        document.getElementById('width').innerHTML = original;
    }
    else
    {
        _pixel.save();
    }
    remote.getCurrentWindow().windows.zoom.emit('refresh');
}

function heightChange(value)
{
    const original = _pixel.height;
    _pixel.height = value;
    if (_pixel.height !== parseInt(value))
    {
        document.getElementById('height').innerHTML = original;
    }
    else
    {
        _pixel.save();
    }
    remote.getCurrentWindow().windows.zoom.emit('refresh');
}

function pixelsChange(value)
{
    const pixels = parseInt(value);
    if (!isNaN(pixels) && pixels > 0)
    {
        _pixel.pixels = value;
        _pixel.save();
    }
    remote.getCurrentWindow().windows.show.emit('dirty');
}

function move(x, y)
{
    document.getElementById('x').innerHTML = x;
    document.getElementById('y').innerHTML = y;
}

function size(width, height)
{
    document.getElementById('width').innerHTML = width;
    document.getElementById('height').innerHTML = height;
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
}

function pixel(pixels)
{
    document.getElementById('pixels').innerHTML = pixels;
}

function keyDown(code, special)
{
    if (!_editing)
    {
        remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
    }
}

const font = new FontFaceObserver('bitmap');
font.load().then(function () { init(); });
