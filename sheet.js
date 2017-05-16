const RenderSheet = require('yy-rendersheet');

const SIZE = 100;

const GRAY_LIGHT = '#fefefe';
const GRAY = '#dddddd';

let _sheet;

function init()
{
    _sheet = new RenderSheet();
    _sheet.add('transparency', draw, measure);
    _sheet.render();
}

function draw(c)
{
    const half = SIZE / 2;
    c.fillStyle = GRAY_LIGHT;
    c.fillRect(0, 0, half, half);
    c.fillRect(half, half, half, half);
    c.fillStyle = GRAY;
    c.fillRect(half, 0, half, half);
    c.fillRect(0, half, half, half);
}

function measure()
{
    return { width: SIZE, height: SIZE };
}

function get(name)
{
    return _sheet.get(name);
}

function getTexture(name)
{
    return _sheet.getTexture(name);
}

module.exports = {
    init,
    get,
    getTexture
};