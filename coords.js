const remote = require('electron').remote;
const FontFaceObserver = require('fontfaceobserver');

const Input = require('./input');

let _pixel,
    _isDragging;

function init()
{
    remote.getCurrentWindow().on('cursor', move);
    Input.init(document.body, { move, down, up });
    _pixel = remote.getCurrentWindow().pixel.pixel;
    size(_pixel.width, _pixel.height);
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
}

function move(x, y)
{
    document.getElementById('x').innerHTML = x;
    document.getElementById('y').innerHTML = y;
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
}

function size(width, height)
{
    document.getElementById('width').innerHTML = width;
    document.getElementById('height').innerHTML = height;
    remote.getCurrentWindow().setSize(document.body.offsetWidth, document.body.offsetHeight);
}

function down(x, y)
{
    _isDragging = { x, y };
}

function move(x, y)
{
    if (_isDragging)
    {
        const position = remote.getCurrentWindow().getPosition();
        remote.getCurrentWindow().setPosition(position[0] + x - _isDragging.x, position[1] + y - _isDragging.y);
    }
}

function up()
{
    _isDragging = null;
}

const font = new FontFaceObserver('bitmap');
font.load().then(function () { init(); });
