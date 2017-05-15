const View = require('./view');
const Input = require('./input');
const Zoom = require('./zoom');

function resize()
{
    View.resize();
}

View.init();
window.addEventListener('resize', resize);
Input.init();

Zoom.init();