const remote = require('electron').remote;
const FontFaceObserver = require('fontfaceobserver');
const Input = require('./input');

let _pixel;

function init()
{
    Input.init(null, { keyDown });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    size(_pixel.width, _pixel.height);
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
    remote.getCurrentWindow().show();
    remote.getCurrentWindow().on('cursor', move);
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
    remote.getCurrentWindow().windows.zoom.emit('keydown', code, special);
}

const font = new FontFaceObserver('bitmap');
font.load().then(function () { init(); });
