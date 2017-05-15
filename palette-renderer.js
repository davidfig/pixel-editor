const View = require('./view');
const Palette = require('./palette');

function resize()
{
    View.resize();
}

View.init();
window.addEventListener('resize', resize);

Palette.init();