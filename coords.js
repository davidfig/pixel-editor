const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const FontFaceObserver = require('fontfaceobserver');
const path = require('path');
const EasyEdit = require('easyedit');

const Input = require('./input');
const State = require('./data/state');
const PixelEditor = require('./data/pixel-editor');

let _state, _pixel, _editing;

function init()
{
    Input.init(null, { keyDown });
    _state = new State();
    _pixel = new PixelEditor(_state.lastFile);
    stateChange(true);
    pixelChange(true);
    new EasyEdit(document.getElementById('width'), { onsuccess: widthChange, oncancel: cancel, onedit: start });
    new EasyEdit(document.getElementById('height'), { onsuccess: heightChange, oncancel: cancel, onedit: start });
    new EasyEdit(document.getElementById('pixels'), { onsuccess: pixelsChange, oncancel: cancel, onedit: start });
    ipcRenderer.on('state', stateChange);
    ipcRenderer.on('pixel', pixelChange);
    ipcRenderer.on('reset', reset);
    remote.getCurrentWindow().show();
}

function reset()
{
    _state.load();
    _pixel = new PixelEditor(_state.lastFile);
    stateChange(true);
    pixelChange(true);
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
        ipcRenderer.send('pixel');
    }
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
        ipcRenderer.send('pixel');
    }
}

function pixelsChange(value)
{
    const pixels = parseInt(value);
    if (!isNaN(pixels) && pixels > 0)
    {
        _pixel.pixels = value;
        _pixel.save();
        ipcRenderer.send('pixel');
    }
}

function pixelChange(noload)
{
    if (noload !== true)
    {
        _pixel.load();
    }
    document.getElementById('width').innerHTML = _pixel.width;
    document.getElementById('height').innerHTML = _pixel.height;
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
}

function stateChange(noload)
{
    if (noload !== true)
    {
        _state.load();
    }
    document.getElementById('pixels').innerHTML = _state.pixels;
    document.getElementById('x').innerHTML = _state.cursorX;
    document.getElementById('y').innerHTML = _state.cursorY;
    document.getElementById('cursorWidth').innerHTML = _state.cursorSizeX;
    document.getElementById('cursorHeight').innerHTML = _state.cursorSizeY;
    const filename = '--- ' + path.basename(_state.lastFile, '.json') + ' ---';
    document.getElementById('filename').innerHTML = filename;
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
