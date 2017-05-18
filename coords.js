const remote = require('electron').remote;
const FontFaceObserver = require('fontfaceobserver');

const Input = require('./input');
const EasyEdit = require('./easyedit');

let _pixel, _editing, _original;

function init()
{
    Input.init(null, { keyDown });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    size(_pixel.width, _pixel.height);
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
    remote.getCurrentWindow().show();
    remote.getCurrentWindow().on('cursor', move);
    new EasyEdit(document.getElementById('width'), { onsuccess: widthChange, oncancel: cancel, onedit: start });
    new EasyEdit(document.getElementById('height'), { onsuccess: heightChange, oncancel: cancel, onedit: start });
}

function start()
{
    _editing = true;
    _original = remote.getCurrentWindow().windows.zoom.getContentSize();
}

function cancel()
{
    _editing = false;
}

function widthChange(value)
{
    const original = remote.getCurrentWindow().pixel.pixel.width;
    remote.getCurrentWindow().pixel.pixel.width = value;
    if (remote.getCurrentWindow().pixel.pixel.width !== parseInt(value))
    {
        document.getElementById('width').innerHTML = original;
    }
    else
    {
        remote.getCurrentWindow().pixel.pixel.save();
    }
    remote.getCurrentWindow().windows.zoom.emit('refresh');
}

function heightChange(value)
{
    const original = remote.getCurrentWindow().pixel.pixel.height;
    remote.getCurrentWindow().pixel.pixel.height = value;
    if (remote.getCurrentWindow().pixel.pixel.height !== parseInt(value))
    {
        document.getElementById('height').innerHTML = original;
    }
    else
    {
        remote.getCurrentWindow().pixel.pixel.save();
    }
    remote.getCurrentWindow().windows.zoom.emit('refresh');
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

function keyDown(code, special)
{
    if (!_editing)
    {
        remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
    }
}

const font = new FontFaceObserver('bitmap');
font.load().then(function () { init(); });
